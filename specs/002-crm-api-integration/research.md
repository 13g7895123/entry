# 研究報告：CRM 認證 API 整合

**功能分支**：`002-crm-api-integration`
**研究日期**：2025-10-23
**狀態**：已完成

本文件整合了 Phase 0 所有研究任務的結果，包含技術決策、理由、捨棄的替代方案與實作範例。

---

## 研究任務 1：CodeIgniter 4 JWT 與 HttpOnly Cookies 整合

### 決策

**採用方案**：使用 CodeIgniter 4 Filter 機制 + `firebase/php-jwt` 套件進行 JWT 驗證，並透過 Response 物件設定 HttpOnly cookies。

**核心實作策略**：
1. **JWT 驗證**：建立 `JwtAuthFilter` 繼承 `CodeIgniter\Filters\FilterInterface`
2. **HttpOnly Cookie 設定**：使用 CI4 原生 `Response::setCookie()` 方法
3. **安全屬性配置**：
   - `httponly = true`（防止 JavaScript 存取）
   - `secure = true`（僅 HTTPS 傳輸）
   - `samesite = 'None'`（允許跨域認證）
4. **權杖來源**：Access Token 從 `Authorization: Bearer` header 讀取，Refresh Token 從 Cookie 讀取

### 理由

1. **Filter 是 CI4 推薦的請求攔截機制**：
   - 官方文件明確建議使用 Filters 進行認證檢查
   - 支援全域或路由級別的靈活配置
   - 易於維護與測試

2. **firebase/php-jwt 是業界標準**：
   - GitHub 18k+ stars，Laravel、Symfony 等框架廣泛採用
   - 支援 RS256/HS256 等多種演算法
   - 完整的過期時間、簽發者驗證功能

3. **HttpOnly Cookies 最佳安全實踐**：
   - OWASP 推薦用於儲存 Refresh Token
   - 防止 XSS 攻擊竊取權杖
   - 符合規格書 FR-002 需求

4. **SameSite=None 支援跨域場景**：
   - SaaS 入口專案可能前後端不同網域
   - 需配合 Secure 屬性在 HTTPS 環境使用
   - 符合現代瀏覽器 Cookie 政策

### 捨棄的替代方案

#### 替代方案 A：使用第三方套件 `tymondesigns/jwt-auth`
**捨棄理由**：
- 該套件主要為 Laravel 設計，CI4 整合需要大量客製化
- 文件與社群支援針對 Laravel，CI4 範例稀少
- 增加不必要的依賴複雜度

#### 替代方案 B：在 Controller 層級手動檢查 JWT
**捨棄理由**：
- 違反 DRY 原則，每個 Controller 需重複驗證邏輯
- 容易遺漏保護某些端點
- 不符合 CI4 架構最佳實踐

#### 替代方案 C：使用 Session 儲存 Refresh Token
**捨棄理由**：
- Session 預設儲存在伺服器端，增加狀態管理複雜度
- 不適合分散式部署（需額外配置 Redis 等共享儲存）
- HttpOnly Cookie 已提供足夠安全性且實作更簡單

### 實作範例

#### 1. Composer 安裝依賴

```bash
composer require firebase/php-jwt
```

#### 2. JWT 驗證 Filter（`app/Filters/JwtAuthFilter.php`）

```php
<?php

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Exception;

class JwtAuthFilter implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        $authHeader = $request->getHeaderLine('Authorization');

        if (empty($authHeader) || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return $this->unauthorizedResponse('Missing or invalid Authorization header');
        }

        $token = $matches[1];

        try {
            $secretKey = getenv('JWT_SECRET_KEY');
            $algorithm = getenv('JWT_ALGORITHM') ?: 'HS256';

            $decoded = JWT::decode($token, new Key($secretKey, $algorithm));

            // 將解碼後的使用者資訊注入 Request 屬性
            $request->user = $decoded;

        } catch (Exception $e) {
            log_message('warning', 'JWT verification failed: ' . $e->getMessage());
            return $this->unauthorizedResponse('Invalid or expired token');
        }
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        // 不需要 after 處理
    }

    private function unauthorizedResponse(string $message): ResponseInterface
    {
        $response = service('response');
        $response->setStatusCode(401);
        $response->setJSON([
            'error' => 'Unauthorized',
            'message' => $message,
        ]);
        return $response;
    }
}
```

#### 3. 設定 HttpOnly Cookie（登入成功後）

```php
<?php

namespace App\Controllers\Api\V1\Auth;

use CodeIgniter\RESTful\ResourceController;

class LoginController extends ResourceController
{
    public function login()
    {
        // ... 驗證憑證、呼叫 CRM API 取得權杖 ...

        $refreshToken = $crmApiResponse['refresh_token'];
        $accessToken = $crmApiResponse['access_token'];
        $expiresIn = $crmApiResponse['expires_in']; // 秒數

        // 設定 HttpOnly Cookie 儲存 Refresh Token
        $this->response->setCookie([
            'name'     => 'refresh_token',
            'value'    => $refreshToken,
            'expire'   => $expiresIn, // Cookie 有效期（秒）
            'path'     => '/',
            'domain'   => getenv('COOKIE_DOMAIN'), // 例如 '.example.com'
            'secure'   => true,  // 僅 HTTPS
            'httponly' => true,  // 防止 JavaScript 存取
            'samesite' => 'None' // 允許跨域
        ]);

        // Access Token 返回給前端（由前端儲存於 sessionStorage）
        return $this->respond([
            'access_token' => $accessToken,
            'token_type' => 'Bearer',
            'expires_in' => $expiresIn,
            'user' => $crmApiResponse['user']
        ], 200);
    }
}
```

#### 4. 註冊 Filter（`app/Config/Filters.php`）

```php
<?php

namespace Config;

use CodeIgniter\Config\BaseConfig;

class Filters extends BaseConfig
{
    public array $aliases = [
        'jwt_auth' => \App\Filters\JwtAuthFilter::class,
        // ... 其他 filters
    ];

    public array $filters = [
        // 全域套用 jwt_auth 到特定路由
    ];
}
```

#### 5. 應用到路由（`app/Config/Routes.php`）

```php
<?php

$routes->group('api/v1', ['filter' => 'jwt_auth'], function($routes) {
    $routes->get('auth/me', 'Api\V1\Auth\MeController::index');
    $routes->post('auth/logout', 'Api\V1\Auth\LogoutController::logout');
    // ... 其他需要認證的路由
});

// 登入、註冊等公開路由不套用 filter
$routes->post('api/v1/auth/login', 'Api\V1\Auth\LoginController::login');
$routes->post('api/v1/auth/refresh', 'Api\V1\Auth\RefreshController::refresh');
```

#### 6. 環境變數配置（`.env`）

```env
JWT_SECRET_KEY=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
COOKIE_DOMAIN=.example.com
```

### 參考資料

- [CodeIgniter 4 Filters 官方文件](https://codeigniter.com/user_guide/incoming/filters.html)
- [firebase/php-jwt GitHub Repository](https://github.com/firebase/php-jwt)
- [OWASP: HttpOnly Cookie Best Practices](https://owasp.org/www-community/HttpOnly)
- [MDN: SameSite Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)

---

## 研究任務 2：PHP Guzzle 重試機制與指數退避

### 決策

**採用方案**：使用 GuzzleHttp 6.x/7.x 內建的 `RetryMiddleware` + `HandlerStack` 實作自動重試，配合指數退避（Exponential Backoff）與抖動（Jitter）策略。

**核心實作策略**：
1. **Middleware 整合**：使用 `Middleware::retry()` 建立重試中介層
2. **重試條件**：
   - 網路錯誤（`ConnectException`）
   - 5xx 伺服器錯誤
   - 特定 4xx 錯誤（如 429 Too Many Requests）
3. **退避公式**：`延遲時間 = min(基礎延遲 * 2^重試次數 + 隨機抖動, 最大延遲)`
4. **最大重試次數**：3 次（符合規格書 FR-011）
5. **抖動範圍**：±20% 隨機變化

### 理由

1. **Guzzle 內建支援完整且可靠**：
   - Laravel、Symfony 等主流框架預設 HTTP 客戶端
   - 官方文件完整，社群範例豐富
   - 支援 PSR-7/PSR-18 標準

2. **Middleware 架構易於擴展**：
   - 可與日誌、監控等其他 Middleware 組合
   - 不侵入業務邏輯程式碼
   - 支援細粒度控制（per-request 或全域配置）

3. **指數退避符合 RFC 標準**：
   - RFC 7231 建議在伺服器錯誤時使用退避策略
   - 避免「雷鳴群」效應（Thundering Herd）
   - 提升成功率同時降低伺服器壓力

4. **抖動防止同步重試**：
   - 多個客戶端同時重試會造成流量尖峰
   - 隨機化延遲時間分散請求
   - AWS、Google Cloud 均推薦此做法

### 捨棄的替代方案

#### 替代方案 A：手動實作 try-catch 重試迴圈
**捨棄理由**：
- 程式碼重複性高，每個 API 呼叫都需撰寫重試邏輯
- 容易出錯（忘記重置計數器、錯誤分類不當）
- 維護成本高，違反 DRY 原則

#### 替代方案 B：使用第三方套件 `kevinrob/guzzle-cache-middleware`
**捨棄理由**：
- 該套件主要用於快取，非重試機制
- 引入不必要的依賴
- Guzzle 原生功能已足夠

#### 替代方案 C：固定延遲時間（如每次等待 2 秒）
**捨棄理由**：
- 無法適應不同錯誤類型（暫時性 vs. 持續性）
- 總重試時間過長或過短
- 不符合規格書要求的指數退避（1s, 2s, 4s）

### 實作範例

#### 1. Composer 安裝依賴

```bash
composer require guzzlehttp/guzzle
```

#### 2. 建立 Guzzle Client 服務（`app/Services/CrmApiClient.php`）

```php
<?php

namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Middleware;
use GuzzleHttp\Exception\ConnectException;
use GuzzleHttp\Exception\RequestException;
use Psr\Http\Message\RequestInterface;
use Psr\Http\Message\ResponseInterface;

class CrmApiClient
{
    private Client $client;

    public function __construct()
    {
        $stack = HandlerStack::create();

        // 加入重試 Middleware
        $stack->push(Middleware::retry(
            $this->retryDecider(),
            $this->retryDelay()
        ));

        $this->client = new Client([
            'base_uri' => getenv('CRM_API_BASE_URL'),
            'timeout'  => 10.0,
            'handler'  => $stack,
            'headers'  => [
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
            ],
        ]);
    }

    /**
     * 決定是否應該重試
     */
    private function retryDecider(): callable
    {
        return function (
            int $retries,
            RequestInterface $request,
            ?ResponseInterface $response = null,
            ?RequestException $exception = null
        ): bool {
            // 超過最大重試次數
            if ($retries >= 3) {
                return false;
            }

            // 網路連線錯誤 → 重試
            if ($exception instanceof ConnectException) {
                return true;
            }

            // 有回應時檢查狀態碼
            if ($response) {
                $statusCode = $response->getStatusCode();

                // 5xx 伺服器錯誤 → 重試
                if ($statusCode >= 500) {
                    return true;
                }

                // 429 Too Many Requests → 重試
                if ($statusCode === 429) {
                    return true;
                }
            }

            // 其他情況不重試（包括 4xx 客戶端錯誤）
            return false;
        };
    }

    /**
     * 計算重試延遲時間（指數退避 + 抖動）
     */
    private function retryDelay(): callable
    {
        return function (int $retries): int {
            // 基礎延遲 1 秒，指數成長：1s, 2s, 4s
            $baseDelay = 1000; // 毫秒
            $exponentialDelay = $baseDelay * (2 ** ($retries - 1));

            // 加入 ±20% 隨機抖動
            $jitter = $exponentialDelay * 0.2 * (mt_rand(-100, 100) / 100);
            $totalDelay = $exponentialDelay + $jitter;

            // 最大延遲上限 10 秒
            return (int) min($totalDelay, 10000);
        };
    }

    /**
     * 發送請求（範例：POST /api/v1/auth/login）
     */
    public function login(string $username, string $password, bool $rememberMe = false): array
    {
        try {
            $response = $this->client->post('/api/v1/auth/login', [
                'json' => [
                    'username' => $username,
                    'password' => $password,
                    'remember_me' => $rememberMe,
                ],
            ]);

            return json_decode($response->getBody()->getContents(), true);

        } catch (RequestException $e) {
            log_message('error', 'CRM API login failed: ' . $e->getMessage());

            if ($e->hasResponse()) {
                $errorBody = json_decode($e->getResponse()->getBody()->getContents(), true);
                throw new \RuntimeException($errorBody['message'] ?? 'Login failed');
            }

            throw new \RuntimeException('Network error during login');
        }
    }

    public function getClient(): Client
    {
        return $this->client;
    }
}
```

#### 3. 使用範例（在 Controller 中）

```php
<?php

namespace App\Controllers\Api\V1\Auth;

use CodeIgniter\RESTful\ResourceController;
use App\Services\CrmApiClient;

class LoginController extends ResourceController
{
    public function login()
    {
        $username = $this->request->getPost('username');
        $password = $this->request->getPost('password');
        $rememberMe = (bool) $this->request->getPost('remember_me');

        $crmClient = new CrmApiClient();

        try {
            $result = $crmClient->login($username, $password, $rememberMe);

            // ... 設定 HttpOnly Cookie、返回 Access Token ...

            return $this->respond($result, 200);

        } catch (\RuntimeException $e) {
            return $this->fail($e->getMessage(), 401);
        }
    }
}
```

#### 4. 環境變數配置（`.env`）

```env
CRM_API_BASE_URL=https://crm.example.com
```

### 測試驗證

#### 單元測試範例（使用 PHPUnit + Guzzle Mock）

```php
<?php

namespace Tests\Unit\Services;

use CodeIgniter\Test\CIUnitTestCase;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Response;
use GuzzleHttp\Exception\ConnectException;

class CrmApiClientTest extends CIUnitTestCase
{
    public function testLoginRetriesOn5xxError()
    {
        // 模擬：第一次 500 錯誤，第二次成功
        $mock = new MockHandler([
            new Response(500, [], 'Internal Server Error'),
            new Response(200, [], json_encode(['access_token' => 'test_token'])),
        ]);

        $handlerStack = HandlerStack::create($mock);
        // ... 將 handlerStack 注入 CrmApiClient ...

        $result = $crmClient->login('testuser', 'testpass');

        $this->assertArrayHasKey('access_token', $result);
        $this->assertEquals('test_token', $result['access_token']);
    }

    public function testLoginFailsAfterMaxRetries()
    {
        $this->expectException(\RuntimeException::class);

        // 模擬：連續 4 次 500 錯誤（超過最大重試 3 次）
        $mock = new MockHandler([
            new Response(500),
            new Response(500),
            new Response(500),
            new Response(500),
        ]);

        // ... 執行測試 ...
    }
}
```

### 參考資料

- [Guzzle Middleware 官方文件](https://docs.guzzlephp.org/en/stable/handlers-and-middleware.html)
- [RFC 7231: 6.6 Server Error 5xx](https://datatracker.ietf.org/doc/html/rfc7231#section-6.6)
- [AWS Architecture Blog: Exponential Backoff and Jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
- [Google Cloud: Retry Strategy Best Practices](https://cloud.google.com/apis/design/errors#error_retries)

---

## 研究任務 3：CodeIgniter 4 CORS 配置

### 決策

**採用方案**：在 CodeIgniter 4 應用程式層級處理 CORS，使用自訂 `CorsFilter` 統一管理 CORS 標頭，而非依賴 Nginx 或 Apache 設定。

**核心實作策略**：
1. **Filter 層級處理**：建立 `CorsFilter` 在請求進入前加入 CORS 標頭
2. **支援 Preflight 請求**：偵測 OPTIONS 請求並直接返回 204 No Content
3. **動態 Origin 白名單**：從環境變數讀取允許的來源清單
4. **Credentials 支援**：設定 `Access-Control-Allow-Credentials: true` 以支援 Cookie 傳遞
5. **安全性考量**：
   - 不使用萬用字元 `*`（與 Credentials 不相容）
   - 僅允許特定 HTTP 方法與標頭
   - 限制快取時間（Preflight 結果）

### 理由

1. **應用程式層級控制更靈活**：
   - 可根據路由、環境動態調整 CORS 策略
   - 易於單元測試與版本控制
   - 不依賴外部伺服器配置（開發、生產環境一致）

2. **符合 HttpOnly Cookie + 跨域需求**：
   - `Access-Control-Allow-Credentials: true` 必須配合明確的 Origin（不能是 `*`）
   - 規格書要求 FR-002：更新權杖使用 HttpOnly Cookies
   - SaaS 入口專案前後端網域可能不同

3. **Filter 是 CI4 推薦的前處理機制**：
   - 與 JwtAuthFilter 一致的架構風格
   - 全域套用或路由級別皆可
   - 執行順序可控（before/after）

4. **OPTIONS Preflight 標準處理**：
   - 瀏覽器在跨域請求前會發送 OPTIONS 預檢請求
   - 必須快速回應 204 No Content 避免延遲
   - 需返回 `Access-Control-Allow-Methods` 和 `Access-Control-Allow-Headers`

### 捨棄的替代方案

#### 替代方案 A：在 Nginx 層級設定 CORS
**捨棄理由**：
- 配置分散在多處（Nginx config + 應用程式）
- 不易版本控制與團隊協作
- 開發環境（PHP 內建伺服器）無法使用相同配置
- 動態調整需重新載入 Nginx

#### 替代方案 B：使用第三方套件 `fruitcake/laravel-cors`
**捨棄理由**：
- 套件為 Laravel 設計，CI4 整合需額外適配層
- 增加依賴複雜度
- 自訂 Filter 實作簡單（<100 行程式碼）

#### 替代方案 C：在每個 Controller 手動設定標頭
**捨棄理由**：
- 違反 DRY 原則
- 容易遺漏某些端點
- OPTIONS Preflight 需在 before 階段處理，Controller 層級太晚

### 實作範例

#### 1. CORS Filter（`app/Filters/CorsFilter.php`）

```php
<?php

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

class CorsFilter implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        // 從環境變數讀取允許的 Origins（逗號分隔）
        $allowedOrigins = explode(',', getenv('CORS_ALLOWED_ORIGINS'));
        $origin = $request->getHeaderLine('Origin');

        // 驗證 Origin 是否在白名單中
        if (!in_array($origin, $allowedOrigins, true)) {
            // 不在白名單：不加入 CORS 標頭（瀏覽器會阻擋）
            if ($request->getMethod() === 'options') {
                // OPTIONS 請求仍需回應，避免瀏覽器卡住
                return service('response')->setStatusCode(403);
            }
            return null; // 繼續處理，但不加 CORS 標頭
        }

        // OPTIONS Preflight 請求：直接返回 204
        if ($request->getMethod() === 'options') {
            $response = service('response');
            return $this->setCorsHeaders($response, $origin)
                        ->setStatusCode(204);
        }

        // 其他請求：繼續處理，CORS 標頭在 after() 加入
        return null;
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        $allowedOrigins = explode(',', getenv('CORS_ALLOWED_ORIGINS'));
        $origin = $request->getHeaderLine('Origin');

        if (in_array($origin, $allowedOrigins, true)) {
            $this->setCorsHeaders($response, $origin);
        }

        return $response;
    }

    private function setCorsHeaders(ResponseInterface $response, string $origin): ResponseInterface
    {
        $response->setHeader('Access-Control-Allow-Origin', $origin)
                 ->setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                 ->setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
                 ->setHeader('Access-Control-Allow-Credentials', 'true')
                 ->setHeader('Access-Control-Max-Age', '86400'); // 快取 Preflight 24 小時

        return $response;
    }
}
```

#### 2. 註冊 Filter（`app/Config/Filters.php`）

```php
<?php

namespace Config;

use CodeIgniter\Config\BaseConfig;

class Filters extends BaseConfig
{
    public array $aliases = [
        'cors' => \App\Filters\CorsFilter::class,
        'jwt_auth' => \App\Filters\JwtAuthFilter::class,
    ];

    public array $globals = [
        'before' => [
            'cors', // 全域啟用 CORS（最先執行）
        ],
        'after' => [
            'cors',
        ],
    ];
}
```

#### 3. 環境變數配置（`.env`）

```env
# 開發環境
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# 生產環境（範例）
# CORS_ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com
```

#### 4. Docker Compose 環境變數注入（`deploy/docker-compose.yml`）

```yaml
services:
  backend:
    image: entry-backend:latest
    environment:
      CORS_ALLOWED_ORIGINS: ${CORS_ALLOWED_ORIGINS}
    env_file:
      - ../.env
```

### 測試驗證

#### 單元測試範例（使用 PHPUnit）

```php
<?php

namespace Tests\Unit\Filters;

use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\FilterTestTrait;
use App\Filters\CorsFilter;

class CorsFilterTest extends CIUnitTestCase
{
    use FilterTestTrait;

    public function testPreflightRequestReturns204()
    {
        putenv('CORS_ALLOWED_ORIGINS=http://localhost:5173');

        $request = service('request');
        $request->setMethod('options');
        $request->setHeader('Origin', 'http://localhost:5173');

        $response = $this->callFilter(CorsFilter::class, $request);

        $this->assertEquals(204, $response->getStatusCode());
        $this->assertEquals('http://localhost:5173', $response->getHeaderLine('Access-Control-Allow-Origin'));
        $this->assertEquals('true', $response->getHeaderLine('Access-Control-Allow-Credentials'));
    }

    public function testUnauthorizedOriginBlocked()
    {
        putenv('CORS_ALLOWED_ORIGINS=http://localhost:5173');

        $request = service('request');
        $request->setHeader('Origin', 'http://malicious.com');

        $response = $this->callFilter(CorsFilter::class, $request);

        $this->assertEmpty($response->getHeaderLine('Access-Control-Allow-Origin'));
    }
}
```

#### 手動測試（使用 curl）

```bash
# Preflight 請求
curl -X OPTIONS http://localhost:8080/api/v1/auth/login \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -v

# 預期回應：
# HTTP/1.1 204 No Content
# Access-Control-Allow-Origin: http://localhost:5173
# Access-Control-Allow-Credentials: true
```

### 參考資料

- [MDN: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [CodeIgniter 4 Filters 官方文件](https://codeigniter.com/user_guide/incoming/filters.html)
- [OWASP: CORS Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Origin_Resource_Sharing_Cheat_Sheet.html)
- [W3C: Fetch Standard - CORS Protocol](https://fetch.spec.whatwg.org/#http-cors-protocol)

---

## 研究任務 4：Docker 多環境部署策略

### 決策

**採用方案**：使用 Docker Compose 的 **base + override** 架構實作開發與生產環境分離，配合 Docker Secrets 管理敏感資料。

**核心實作策略**：
1. **檔案結構**：
   - `docker-compose.yml`：基礎配置（共用服務定義）
   - `docker-compose.override.yml`：開發環境專用（自動載入）
   - `docker-compose.prod.yml`：生產環境專用（需明確指定）
2. **環境變數管理**：
   - `.env`：預設開發環境變數
   - `.env.prod`：生產環境變數（不納入版本控制）
   - Docker Secrets：生產環境敏感資料（JWT 金鑰、資料庫密碼）
3. **Port 管理**：所有外部 Port 透過 `.env` 檔案集中管理
4. **部署腳本**：
   - `deploy/scripts/deploy-dev.sh`：啟動開發環境
   - `deploy/scripts/deploy-prod.sh`：啟動生產環境
   - `deploy/scripts/update.sh`：更新映像與重啟服務
5. **多階段建置**：使用 Multi-stage Dockerfile 減少映像大小

### 理由

1. **Docker Compose Override 是官方推薦做法**：
   - 自動合併 `docker-compose.yml` + `docker-compose.override.yml`
   - 生產環境使用 `-f` 參數明確指定配置檔
   - 避免重複配置，符合 DRY 原則

2. **Docker Secrets 提升生產安全性**：
   - 敏感資料不以環境變數傳遞（可能洩漏於 `docker inspect`）
   - 儲存於 `/run/secrets/` 記憶體檔案系統
   - 符合 OWASP 安全最佳實踐

3. **集中式 Port 管理**：
   - 避免 Port 衝突（多個專案同時執行）
   - 易於調整與文件化
   - 符合規格書要求「所有外部 Port 透過 `.env` 控制」

4. **腳本自動化降低錯誤**：
   - 統一部署流程（團隊成員一致）
   - 減少手動指令輸入錯誤
   - 支援 CI/CD 整合

### 捨棄的替代方案

#### 替代方案 A：單一 `docker-compose.yml` + 環境變數切換
**捨棄理由**：
- 配置檔案混雜開發與生產邏輯，難以維護
- 容易誤用錯誤的環境變數（如生產使用 `DEBUG=true`）
- 無法利用 Docker Compose 的 override 機制

#### 替代方案 B：完全獨立的兩份 `docker-compose` 檔案
**捨棄理由**：
- 共用配置重複（違反 DRY 原則）
- 修改共用服務需同步更新兩份檔案
- 維護成本高

#### 替代方案 C：使用 Kubernetes（K8s）
**捨棄理由**：
- 專案規模不需要 K8s 複雜度
- 學習曲線陡峭，團隊需額外培訓
- 基礎設施成本高（需叢集管理）
- Docker Compose 已滿足需求

### 實作範例

#### 1. 專案結構

```
deploy/
├── docker-compose.yml          # 基礎配置
├── docker-compose.override.yml # 開發環境（自動載入）
├── docker-compose.prod.yml     # 生產環境
├── .env.example                # 環境變數範本
├── scripts/
│   ├── deploy-dev.sh
│   ├── deploy-prod.sh
│   └── update.sh
├── secrets/                    # 生產環境 Secrets（不納入 Git）
│   ├── jwt_secret
│   └── db_password
backend/
├── Dockerfile
├── Dockerfile.prod             # 生產環境最佳化版本
frontend/
├── Dockerfile
├── Dockerfile.prod
```

#### 2. 基礎配置（`deploy/docker-compose.yml`）

```yaml
version: '3.9'

services:
  backend:
    build:
      context: ../backend
      dockerfile: Dockerfile
    restart: unless-stopped
    volumes:
      - ../backend:/var/www/html
    environment:
      CI_ENVIRONMENT: ${CI_ENVIRONMENT}
      CRM_API_BASE_URL: ${CRM_API_BASE_URL}
      CORS_ALLOWED_ORIGINS: ${CORS_ALLOWED_ORIGINS}
    networks:
      - app-network

  frontend:
    build:
      context: ../frontend
      dockerfile: Dockerfile
    restart: unless-stopped
    volumes:
      - ../frontend:/app
    environment:
      VITE_API_BASE_URL: ${VITE_API_BASE_URL}
    networks:
      - app-network

  nginx:
    image: nginx:1.25-alpine
    restart: unless-stopped
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    ports:
      - "${NGINX_PORT}:80"
    depends_on:
      - backend
      - frontend
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

#### 3. 開發環境覆寫（`deploy/docker-compose.override.yml`）

```yaml
version: '3.9'

services:
  backend:
    build:
      target: development  # Multi-stage 開發階段
    ports:
      - "${BACKEND_PORT}:8080"
    environment:
      CI_ENVIRONMENT: development
      JWT_SECRET_KEY: dev-secret-key-change-me
    volumes:
      - ../backend:/var/www/html  # Hot-reload 支援

  frontend:
    build:
      target: development
    command: npm run dev
    ports:
      - "${FRONTEND_PORT}:5173"
    volumes:
      - ../frontend:/app
      - /app/node_modules  # 避免覆寫 node_modules
```

#### 4. 生產環境配置（`deploy/docker-compose.prod.yml`）

```yaml
version: '3.9'

services:
  backend:
    build:
      context: ../backend
      dockerfile: Dockerfile.prod
      target: production
    restart: always
    secrets:
      - jwt_secret
      - db_password
    environment:
      CI_ENVIRONMENT: production
      JWT_SECRET_KEY_FILE: /run/secrets/jwt_secret
    volumes: []  # 不掛載本地目錄（使用映像內檔案）

  frontend:
    build:
      context: ../frontend
      dockerfile: Dockerfile.prod
      target: production
    restart: always
    volumes: []

  nginx:
    volumes:
      - ./nginx/nginx.prod.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro  # SSL 憑證
    ports:
      - "${NGINX_HTTPS_PORT}:443"
      - "${NGINX_HTTP_PORT}:80"

secrets:
  jwt_secret:
    file: ./secrets/jwt_secret
  db_password:
    file: ./secrets/db_password
```

#### 5. 環境變數範本（`deploy/.env.example`）

```env
# 複製此檔案為 .env（開發）或 .env.prod（生產）

# 環境類型
CI_ENVIRONMENT=development

# Port 配置
NGINX_PORT=8000
BACKEND_PORT=8080
FRONTEND_PORT=5173

# 生產環境額外 Ports
NGINX_HTTP_PORT=80
NGINX_HTTPS_PORT=443

# API URLs
CRM_API_BASE_URL=https://crm.example.com
VITE_API_BASE_URL=http://localhost:8000/api

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173

# 注意：生產環境的 JWT_SECRET_KEY 應使用 Docker Secrets
```

#### 6. 部署腳本（`deploy/scripts/deploy-dev.sh`）

```bash
#!/bin/bash
set -e

echo "🚀 Starting development environment..."

cd "$(dirname "$0")/.."

# 檢查 .env 是否存在
if [ ! -f .env ]; then
    echo "⚠️  .env not found, copying from .env.example"
    cp .env.example .env
fi

# 啟動服務（自動載入 docker-compose.override.yml）
docker-compose up -d --build

echo "✅ Development environment started!"
echo "📍 Frontend: http://localhost:${FRONTEND_PORT:-5173}"
echo "📍 Backend: http://localhost:${BACKEND_PORT:-8080}"
echo "📍 Nginx: http://localhost:${NGINX_PORT:-8000}"
```

#### 7. 生產部署腳本（`deploy/scripts/deploy-prod.sh`）

```bash
#!/bin/bash
set -e

echo "🚀 Starting production environment..."

cd "$(dirname "$0")/.."

# 檢查必要檔案
if [ ! -f .env.prod ]; then
    echo "❌ .env.prod not found!"
    exit 1
fi

if [ ! -f secrets/jwt_secret ] || [ ! -f secrets/db_password ]; then
    echo "❌ Docker secrets not found in secrets/ directory!"
    exit 1
fi

# 載入生產環境變數
export $(cat .env.prod | grep -v '^#' | xargs)

# 啟動服務（明確指定生產配置）
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

echo "✅ Production environment started!"
echo "📍 Application: https://localhost:${NGINX_HTTPS_PORT:-443}"
```

#### 8. 更新腳本（`deploy/scripts/update.sh`）

```bash
#!/bin/bash
set -e

ENVIRONMENT=${1:-development}

echo "🔄 Updating $ENVIRONMENT environment..."

cd "$(dirname "$0")/.."

if [ "$ENVIRONMENT" = "production" ]; then
    export $(cat .env.prod | grep -v '^#' | xargs)
    COMPOSE_FILES="-f docker-compose.yml -f docker-compose.prod.yml"
else
    COMPOSE_FILES=""
fi

# 拉取最新程式碼（假設使用 Git）
git pull origin main

# 重新建置映像
docker-compose $COMPOSE_FILES build --no-cache

# 停止舊容器、啟動新容器（零停機時間策略）
docker-compose $COMPOSE_FILES up -d --force-recreate

# 清理未使用的映像
docker image prune -f

echo "✅ Update completed!"
```

#### 9. Multi-stage Dockerfile 範例（`backend/Dockerfile.prod`）

```dockerfile
# Stage 1: 建置階段
FROM php:8.1-fpm-alpine AS builder

WORKDIR /var/www/html

# 安裝依賴
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-interaction

COPY . .

# Stage 2: 生產階段
FROM php:8.1-fpm-alpine AS production

WORKDIR /var/www/html

# 僅複製必要檔案
COPY --from=builder /var/www/html/vendor ./vendor
COPY --from=builder /var/www/html/app ./app
COPY --from=builder /var/www/html/public ./public

# 安裝運行時依賴
RUN apk add --no-cache nginx supervisor

# 安全性：移除不必要套件
RUN rm -rf /var/cache/apk/*

EXPOSE 8080

CMD ["php-fpm"]
```

### 使用說明

#### 開發環境啟動

```bash
cd deploy
./scripts/deploy-dev.sh
```

#### 生產環境啟動

```bash
cd deploy

# 首次部署：建立 Secrets
echo "your-production-jwt-secret" > secrets/jwt_secret
echo "your-database-password" > secrets/db_password
chmod 600 secrets/*

# 複製並編輯生產環境變數
cp .env.example .env.prod
nano .env.prod

# 啟動
./scripts/deploy-prod.sh
```

#### 更新部署

```bash
# 開發環境
./scripts/update.sh development

# 生產環境
./scripts/update.sh production
```

### 參考資料

- [Docker Compose 官方文件：Multiple Compose Files](https://docs.docker.com/compose/extends/)
- [Docker Secrets 官方文件](https://docs.docker.com/engine/swarm/secrets/)
- [Docker Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [OWASP Docker Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html)

---

## 研究任務 5：Vue 3 + Pinia 權杖自動更新機制

### 決策

**採用方案**：結合 **Axios 攔截器（Interceptor）** 與 **Pinia Store** 實作雙重權杖更新機制：被動式（401 錯誤觸發）+ 主動式（Composable 監控過期時間）。

**核心實作策略**：
1. **Pinia Auth Store**：集中管理認證狀態（Access Token、使用者資訊、過期時間）
2. **Axios Response 攔截器**：捕捉 401 錯誤，自動呼叫 `/refresh` API
3. **Promise 重用機制**：防止並行請求重複觸發更新
4. **主動監控 Composable**：每 30 秒檢查權杖剩餘時間，<5 分鐘時主動更新
5. **更新失敗處理**：清除 Store、重定向至登入頁
6. **Retry Queue**：更新成功後重試原失敗請求

### 理由

1. **Axios 攔截器是 Vue 社群標準做法**：
   - Vue 官方文件推薦用於全域錯誤處理
   - 無需修改每個 API 呼叫
   - 支援請求/回應雙向攔截

2. **Pinia 提供響應式狀態管理**：
   - Vue 3 官方推薦替代 Vuex
   - Composition API 友善
   - TypeScript 支援完整
   - DevTools 整合

3. **雙重機制確保可靠性**：
   - **被動式**：處理意外過期（時鐘偏移、網路延遲）
   - **主動式**：減少使用者感知到的延遲
   - 符合規格書 FR-004（5 分鐘閾值）

4. **Promise 重用避免競態條件**：
   - 多個並行請求同時收到 401 時，僅呼叫一次 `/refresh`
   - 其他請求等待同一個 Promise 完成
   - 防止伺服器負載過高

### 捨棄的替代方案

#### 替代方案 A：在每個 API 呼叫前手動檢查權杖
**捨棄理由**：
- 違反 DRY 原則，程式碼重複
- 容易遺漏某些呼叫
- 維護成本高

#### 替代方案 B：僅使用 Axios 攔截器（無主動監控）
**捨棄理由**：
- 使用者會在操作時遇到短暫失敗（401 → 重試）
- 無法提前更新，影響使用者體驗
- 不符合規格書「剩餘 5 分鐘主動更新」需求

#### 替代方案 C：使用 Vue Router 導航守衛檢查權杖
**捨棄理由**：
- 僅能攔截路由變更，無法處理同頁面內的 API 呼叫
- 無法處理背景自動更新
- 範圍過窄

### 實作範例

#### 1. Pinia Auth Store（`frontend/src/stores/auth.ts`）

```typescript
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/services/api';

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  department: string;
  region: string;
}

export const useAuthStore = defineStore('auth', () => {
  // 狀態
  const accessToken = ref<string | null>(sessionStorage.getItem('access_token'));
  const tokenExpiry = ref<number | null>(
    sessionStorage.getItem('token_expiry')
      ? parseInt(sessionStorage.getItem('token_expiry')!, 10)
      : null
  );
  const user = ref<User | null>(null);
  const isRefreshing = ref(false);
  let refreshPromise: Promise<void> | null = null;

  // Getters
  const isAuthenticated = computed(() => !!accessToken.value && !!tokenExpiry.value);

  const tokenRemainingTime = computed(() => {
    if (!tokenExpiry.value) return 0;
    return Math.max(0, tokenExpiry.value - Date.now());
  });

  // Actions
  async function login(username: string, password: string, rememberMe: boolean = false) {
    try {
      const response = await api.post('/auth/login', {
        username,
        password,
        remember_me: rememberMe,
      });

      setTokens(response.data.access_token, response.data.expires_in);
      user.value = response.data.user;

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async function refreshToken(): Promise<void> {
    // Promise 重用：防止並行請求重複更新
    if (isRefreshing.value && refreshPromise) {
      return refreshPromise;
    }

    isRefreshing.value = true;

    refreshPromise = api.post('/auth/refresh')
      .then((response) => {
        setTokens(response.data.access_token, response.data.expires_in);
      })
      .catch((error) => {
        // 更新失敗：清除狀態並登出
        console.error('Token refresh failed:', error);
        logout();
        throw error;
      })
      .finally(() => {
        isRefreshing.value = false;
        refreshPromise = null;
      });

    return refreshPromise;
  }

  async function logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      clearAuth();
    }
  }

  function setTokens(token: string, expiresIn: number) {
    accessToken.value = token;
    const expiryTime = Date.now() + expiresIn * 1000;
    tokenExpiry.value = expiryTime;

    // 持久化至 sessionStorage
    sessionStorage.setItem('access_token', token);
    sessionStorage.setItem('token_expiry', expiryTime.toString());
  }

  function clearAuth() {
    accessToken.value = null;
    tokenExpiry.value = null;
    user.value = null;
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('token_expiry');
  }

  return {
    // State
    accessToken,
    user,
    isRefreshing,
    // Getters
    isAuthenticated,
    tokenRemainingTime,
    // Actions
    login,
    refreshToken,
    logout,
    setTokens,
    clearAuth,
  };
});
```

#### 2. Axios 攔截器設定（`frontend/src/services/api.ts`）

```typescript
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/auth';
import router from '@/router';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // 支援 HttpOnly Cookies
});

// Request 攔截器：加入 Access Token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const authStore = useAuthStore();

    if (authStore.accessToken) {
      config.headers.Authorization = `Bearer ${authStore.accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response 攔截器：處理 401 錯誤
let isRetrying = false;
let failedRequestsQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const authStore = useAuthStore();

    // 401 錯誤且尚未重試
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRetrying) {
        // 已有更新請求進行中：將此請求加入佇列
        return new Promise((resolve, reject) => {
          failedRequestsQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRetrying = true;

      try {
        await authStore.refreshToken();

        // 更新成功：重試所有佇列中的請求
        failedRequestsQueue.forEach((req) => req.resolve());
        failedRequestsQueue = [];

        // 重試原始請求
        return api(originalRequest);
      } catch (refreshError) {
        // 更新失敗：拒絕所有佇列請求並登出
        failedRequestsQueue.forEach((req) => req.reject(refreshError));
        failedRequestsQueue = [];

        router.push('/login');
        return Promise.reject(refreshError);
      } finally {
        isRetrying = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

#### 3. 主動監控 Composable（`frontend/src/composables/useTokenRefresh.ts`）

```typescript
import { onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '@/stores/auth';

const REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 分鐘（毫秒）
const CHECK_INTERVAL = 30 * 1000; // 每 30 秒檢查一次

export function useTokenRefresh() {
  const authStore = useAuthStore();
  let intervalId: number | null = null;

  const checkAndRefresh = async () => {
    if (!authStore.isAuthenticated) {
      return;
    }

    const remainingTime = authStore.tokenRemainingTime;

    // 剩餘時間 < 5 分鐘：主動更新
    if (remainingTime > 0 && remainingTime < REFRESH_THRESHOLD) {
      console.log(`Token expiring in ${Math.floor(remainingTime / 1000)}s, refreshing...`);

      try {
        await authStore.refreshToken();
        console.log('Token refreshed successfully');
      } catch (error) {
        console.error('Proactive token refresh failed:', error);
      }
    }
  };

  onMounted(() => {
    // 立即檢查一次
    checkAndRefresh();

    // 啟動定期檢查
    intervalId = window.setInterval(checkAndRefresh, CHECK_INTERVAL);
  });

  onUnmounted(() => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  });

  return {
    checkAndRefresh,
  };
}
```

#### 4. 在 App.vue 中啟用主動監控

```vue
<script setup lang="ts">
import { useTokenRefresh } from '@/composables/useTokenRefresh';

// 啟用主動權杖更新監控
useTokenRefresh();
</script>

<template>
  <RouterView />
</template>
```

#### 5. 路由守衛保護（`frontend/src/router/index.ts`）

```typescript
import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/LoginView.vue'),
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true },
    },
  ],
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } });
  } else {
    next();
  }
});

export default router;
```

### 測試驗證

#### 單元測試範例（使用 Vitest）

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '@/stores/auth';
import api from '@/services/api';

vi.mock('@/services/api');

describe('Auth Store - Token Refresh', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    sessionStorage.clear();
  });

  it('should refresh token successfully', async () => {
    const authStore = useAuthStore();

    // Mock API 回應
    vi.mocked(api.post).mockResolvedValue({
      data: {
        access_token: 'new_token',
        expires_in: 3600,
      },
    });

    await authStore.refreshToken();

    expect(authStore.accessToken).toBe('new_token');
    expect(sessionStorage.getItem('access_token')).toBe('new_token');
  });

  it('should logout on refresh failure', async () => {
    const authStore = useAuthStore();
    authStore.setTokens('old_token', 3600);

    vi.mocked(api.post).mockRejectedValue(new Error('Refresh failed'));

    await expect(authStore.refreshToken()).rejects.toThrow('Refresh failed');
    expect(authStore.accessToken).toBeNull();
  });
});
```

### 參考資料

- [Pinia 官方文件](https://pinia.vuejs.org/)
- [Axios Interceptors 官方文件](https://axios-http.com/docs/interceptors)
- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)

---

## 研究任務 6：CodeIgniter 4 日誌記錄與敏感資料過濾

### 決策

**採用方案**：使用 CodeIgniter 4 內建的 `log_message()` 函式配合 **JSON 格式化** + **自訂 LoggingService 類別** 進行結構化日誌記錄，並實作 **SensitiveDataProcessor** 自動過濾敏感資料。

**核心實作策略**：
1. **日誌格式**：JSON 格式（便於 ELK、Splunk 等工具解析）
2. **敏感欄位處理**：
   - 完全遮罩：`password`、`refresh_token`、`api_key`、`secret`
   - 部分遮罩：`access_token`（僅保留前 8 字元）
3. **日誌等級**：
   - `INFO`：登入成功、登出、權杖更新成功
   - `WARNING`：登入失敗、權杖更新失敗
   - `ERROR`：系統錯誤、API 呼叫失敗
4. **記錄內容**：事件類型、使用者 ID、時間戳記、IP、User-Agent、錯誤訊息
5. **輪替策略**：每日輪替，保留 30 天（系統層級 `logrotate`）

### 理由

1. **CI4 內建日誌系統已足夠**：
   - 基於 PSR-3 標準
   - 支援多種 Handler（FileHandler、ChromeLoggerHandler 等）
   - 無需額外依賴

2. **JSON 格式便於自動化處理**：
   - 現代日誌聚合工具標準格式
   - 易於搜尋、過濾、分析
   - 支援結構化查詢

3. **自訂 Service 層集中管理**：
   - 避免在 Controller 重複撰寫日誌邏輯
   - 統一事件命名規範（如 `auth.login.success`）
   - 易於單元測試

4. **遞迴過濾支援巢狀陣列**：
   - API 回應可能包含多層結構
   - 防止遺漏深層敏感資料
   - 符合 OWASP 日誌安全建議

5. **符合規格書 FR-018**：
   - 記錄關鍵認證事件
   - 不記錄密碼、完整權杖內容
   - 包含使用者 ID、時間戳記、錯誤類型

### 捨棄的替代方案

#### 替代方案 A：使用 Monolog 套件
**捨棄理由**：
- CI4 內建日誌已基於 PSR-3（與 Monolog 介面相同）
- 增加依賴複雜度
- 專案規模不需要 Monolog 進階功能（如多通道、動態處理器）

#### 替代方案 B：直接寫入資料庫
**捨棄理由**：
- 效能影響大（每次認證都需 DB 寫入）
- 資料庫容量快速增長
- 不利於日誌輪替與長期歸檔
- 檔案日誌 + 外部工具解析更符合業界實踐

#### 替代方案 C：手動字串替換敏感資料
**捨棄理由**：
- 容易遺漏某些欄位
- 無法處理動態鍵名
- 不支援巢狀結構

### 實作範例

#### 1. LoggingService 類別（`app/Services/LoggingService.php`）

```php
<?php

namespace App\Services;

use CodeIgniter\HTTP\RequestInterface;

class LoggingService
{
    /**
     * 敏感欄位清單（完全遮罩）
     */
    private const SENSITIVE_FIELDS = [
        'password',
        'refresh_token',
        'token',
        'api_key',
        'secret',
        'Authorization', // Header
    ];

    /**
     * 部分遮罩欄位（保留前 8 字元）
     */
    private const PARTIAL_MASK_FIELDS = [
        'access_token',
    ];

    /**
     * 記錄登入成功事件
     */
    public function logLoginSuccess(int $userId, string $username, RequestInterface $request, array $context = []): void
    {
        $data = [
            'event_type' => 'auth.login.success',
            'timestamp' => date('c'), // ISO 8601 格式
            'user_id' => $userId,
            'username' => $username,
            'ip_address' => $request->getIPAddress(),
            'user_agent' => $request->getUserAgent()->getAgentString(),
            'request_id' => $this->generateRequestId($request),
            'context' => $this->sanitizeContext($context),
        ];

        log_message('info', json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    }

    /**
     * 記錄登入失敗事件
     */
    public function logLoginFailure(string $username, string $reason, RequestInterface $request): void
    {
        $data = [
            'event_type' => 'auth.login.failure',
            'timestamp' => date('c'),
            'username' => $username,
            'reason' => $reason,
            'ip_address' => $request->getIPAddress(),
            'user_agent' => $request->getUserAgent()->getAgentString(),
            'request_id' => $this->generateRequestId($request),
        ];

        log_message('warning', json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    }

    /**
     * 記錄登出事件
     */
    public function logLogout(int $userId, RequestInterface $request): void
    {
        $data = [
            'event_type' => 'auth.logout',
            'timestamp' => date('c'),
            'user_id' => $userId,
            'ip_address' => $request->getIPAddress(),
            'request_id' => $this->generateRequestId($request),
        ];

        log_message('info', json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    }

    /**
     * 記錄權杖更新事件
     */
    public function logTokenRefresh(int $userId, bool $success, ?string $errorMessage = null): void
    {
        $data = [
            'event_type' => 'auth.token.refresh',
            'timestamp' => date('c'),
            'user_id' => $userId,
            'success' => $success,
        ];

        if (!$success && $errorMessage) {
            $data['error'] = $errorMessage;
        }

        $level = $success ? 'info' : 'warning';
        log_message($level, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    }

    /**
     * 記錄 API 錯誤事件
     */
    public function logApiError(string $endpoint, int $statusCode, string $errorMessage, array $context = []): void
    {
        $data = [
            'event_type' => 'api.error',
            'timestamp' => date('c'),
            'endpoint' => $endpoint,
            'status_code' => $statusCode,
            'error_message' => $errorMessage,
            'context' => $this->sanitizeContext($context),
        ];

        log_message('error', json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    }

    /**
     * 清理敏感資料（遞迴處理）
     */
    private function sanitizeContext(array $context): array
    {
        $sanitized = [];

        foreach ($context as $key => $value) {
            $lowerKey = strtolower($key);

            // 完全遮罩
            if (in_array($lowerKey, array_map('strtolower', self::SENSITIVE_FIELDS), true)) {
                $sanitized[$key] = '***REDACTED***';
            }
            // 部分遮罩
            elseif (in_array($lowerKey, array_map('strtolower', self::PARTIAL_MASK_FIELDS), true) && is_string($value)) {
                $sanitized[$key] = substr($value, 0, 8) . '...';
            }
            // 遞迴處理陣列
            elseif (is_array($value)) {
                $sanitized[$key] = $this->sanitizeContext($value);
            }
            // 其他資料保持原樣
            else {
                $sanitized[$key] = $value;
            }
        }

        return $sanitized;
    }

    /**
     * 生成唯一請求 ID（用於追蹤）
     */
    private function generateRequestId(RequestInterface $request): string
    {
        // 優先使用 Header 中的 X-Request-ID（如由 Nginx 產生）
        $requestId = $request->getHeaderLine('X-Request-ID');

        if (empty($requestId)) {
            $requestId = uniqid('req_', true);
        }

        return $requestId;
    }
}
```

#### 2. 日誌配置（`app/Config/Logger.php`）

```php
<?php

namespace Config;

use CodeIgniter\Config\BaseConfig;
use CodeIgniter\Log\Handlers\FileHandler;

class Logger extends BaseConfig
{
    public string $threshold = 'info'; // 生產環境：warning

    public array $handlers = [
        FileHandler::class => [
            'handles' => ['critical', 'alert', 'emergency', 'debug', 'error', 'info', 'notice', 'warning'],
            'config' => [
                'path' => WRITEPATH . 'logs/',
                'fileExtension' => 'log',
                'filePermissions' => 0644,
                'dateFormat' => 'Y-m-d', // 每日一個檔案
            ],
        ],
    ];
}
```

#### 3. 在 Controller 中使用（`app/Controllers/Api/V1/Auth/LoginController.php`）

```php
<?php

namespace App\Controllers\Api\V1\Auth;

use CodeIgniter\RESTful\ResourceController;
use App\Services\CrmApiClient;
use App\Services\LoggingService;

class LoginController extends ResourceController
{
    private LoggingService $logger;

    public function __construct()
    {
        $this->logger = new LoggingService();
    }

    public function login()
    {
        $username = $this->request->getPost('username');
        $password = $this->request->getPost('password');
        $rememberMe = (bool) $this->request->getPost('remember_me');

        $crmClient = new CrmApiClient();

        try {
            $result = $crmClient->login($username, $password, $rememberMe);

            // 記錄成功（不包含密碼、完整權杖）
            $this->logger->logLoginSuccess(
                $result['user']['id'],
                $username,
                $this->request,
                [
                    'remember_me' => $rememberMe,
                    'access_token' => $result['access_token'], // 會被部分遮罩
                ]
            );

            // ... 設定 Cookie、返回回應 ...

            return $this->respond($result, 200);

        } catch (\RuntimeException $e) {
            // 記錄失敗
            $this->logger->logLoginFailure(
                $username,
                $e->getMessage(),
                $this->request
            );

            return $this->fail($e->getMessage(), 401);
        }
    }
}
```

#### 4. 日誌輪替配置（`/etc/logrotate.d/ci4-app`）

```bash
/var/www/html/writable/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0644 www-data www-data
    sharedscripts
    postrotate
        # 可選：通知應用程式重新開啟日誌檔案
        systemctl reload php8.1-fpm > /dev/null 2>&1 || true
    endscript
}
```

#### 5. 日誌輸出範例

**成功登入日誌**：
```json
{
  "event_type": "auth.login.success",
  "timestamp": "2025-10-23T14:35:22+08:00",
  "user_id": 123,
  "username": "john.doe",
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "request_id": "req_6538f2a1c3e4f",
  "context": {
    "remember_me": true,
    "access_token": "eyJhbGciO..."
  }
}
```

**失敗登入日誌**：
```json
{
  "event_type": "auth.login.failure",
  "timestamp": "2025-10-23T14:36:10+08:00",
  "username": "john.doe",
  "reason": "Invalid credentials",
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "request_id": "req_6538f2d4a7b2c"
}
```

### 測試驗證

#### 單元測試範例（使用 PHPUnit）

```php
<?php

namespace Tests\Unit\Services;

use CodeIgniter\Test\CIUnitTestCase;
use App\Services\LoggingService;
use CodeIgniter\HTTP\IncomingRequest;

class LoggingServiceTest extends CIUnitTestCase
{
    public function testSensitiveDataMasking()
    {
        $logger = new LoggingService();
        $reflection = new \ReflectionClass($logger);
        $method = $reflection->getMethod('sanitizeContext');
        $method->setAccessible(true);

        $input = [
            'username' => 'testuser',
            'password' => 'secret123',
            'access_token' => 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            'nested' => [
                'refresh_token' => 'refresh_secret',
            ],
        ];

        $result = $method->invoke($logger, $input);

        $this->assertEquals('testuser', $result['username']);
        $this->assertEquals('***REDACTED***', $result['password']);
        $this->assertStringStartsWith('eyJhbGci...', $result['access_token']);
        $this->assertEquals('***REDACTED***', $result['nested']['refresh_token']);
    }
}
```

### 參考資料

- [CodeIgniter 4 Logging 官方文件](https://codeigniter.com/user_guide/general/logging.html)
- [PSR-3: Logger Interface](https://www.php-fig.org/psr/psr-3/)
- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
- [JSON Logging Best Practices](https://www.dataset.com/blog/the-10-commandments-of-logging/)

---

## 研究任務 7：Refresh Token 安全性增強

### 決策

**採用方案**：在維持「CRM API 管理 + HttpOnly Cookie 儲存」架構的基礎上，實作三層安全增強：**Refresh Token Rotation**（輪換機制）、**CSRF Protection**（跨站請求偽造防護）、**Device Fingerprinting**（裝置指紋綁定）。

**核心實作策略**：
1. **Refresh Token Rotation**：每次更新後發放新的 refresh token，舊 token 立即失效
2. **CSRF Protection**：登入時生成 CSRF Token，所有寫入操作需驗證
3. **Device Fingerprinting**：基於 User-Agent + IP Subnet + Accept-Language 生成裝置指紋，更新時驗證一致性
4. **架構橋接**：後端從 HttpOnly Cookie 讀取 refresh token 並轉發給 CRM API（因 CRM API 預期從 request body 讀取）
5. **可選增強**：Token 使用追蹤（需 Redis）、Sliding Window Session、多裝置管理（需資料庫）

### 理由

1. **解決架構不匹配問題**：
   - CRM API 的 `/auth/refresh` 端點預期從 request body 讀取 `refresh_token`
   - 但 HttpOnly Cookie 前端無法讀取
   - 後端作為代理層，從 Cookie 讀取後轉發給 CRM API
   - 符合安全最佳實踐同時保持與 CRM API 的整合

2. **Token Rotation 防重放攻擊**：
   - OAuth 2.0 RFC 6819 推薦的安全實踐
   - 縮短 token 洩漏的影響窗口
   - 偵測異常使用模式（舊 token 被重複使用）

3. **CSRF Protection 必要性**：
   - HttpOnly Cookie 無法被 JavaScript 讀取，但會自動傳送
   - 攻擊者可利用受害者的已登入狀態發起惡意請求
   - CSRF Token 確保請求來自合法前端應用程式

4. **Device Fingerprinting 增加防護層**：
   - 即使 token 洩漏，攻擊者在不同裝置無法使用
   - 可偵測跨地理位置的異常登入
   - 符合銀行級應用的安全標準

5. **漸進式增強**：
   - 核心增強（Rotation + CSRF + Fingerprinting）可獨立實作
   - 進階功能（Token 追蹤、多裝置管理）可延後實作
   - 不影響現有功能，向下相容

### 捨棄的替代方案

#### 替代方案 A：將 refresh token 改為 request body 傳遞（不用 HttpOnly Cookie）
**捨棄理由**：
- 違反 OWASP 安全建議
- 前端需在記憶體或 localStorage 儲存 refresh token，易受 XSS 攻擊
- 規格書 FR-002 明確要求使用 HttpOnly Cookies

#### 替代方案 B：完全自行管理 refresh token（不依賴 CRM API）
**捨棄理由**：
- 需要建立資料庫儲存 token
- 增加系統複雜度（token 生成、驗證、撤銷邏輯）
- 違背用戶需求（維持由 CRM API 管理）
- 雙系統管理 token 可能導致不一致

#### 替代方案 C：僅實作 CSRF Protection，不做 Rotation 和 Fingerprinting
**捨棄理由**：
- 無法防止 token 重放攻擊
- 無法偵測跨裝置濫用
- 不符合現代應用的安全標準

### 實作範例

#### 1. 後端代理層：RefreshController（`app/Controllers/Api/V1/Auth/RefreshController.php`）

```php
<?php

namespace App\Controllers\Api\V1\Auth;

use CodeIgniter\RESTful\ResourceController;
use App\Services\CrmApiClient;
use App\Services\LoggingService;
use App\Services\DeviceFingerprintService;

class RefreshController extends ResourceController
{
    private LoggingService $logger;
    private DeviceFingerprintService $fingerprintService;

    public function __construct()
    {
        $this->logger = new LoggingService();
        $this->fingerprintService = new DeviceFingerprintService();
    }

    /**
     * 更新 Access Token（使用 HttpOnly Cookie 中的 Refresh Token）
     */
    public function refresh()
    {
        // 1. 從 HttpOnly Cookie 讀取 refresh token
        $refreshToken = $this->request->getCookie('refresh_token');

        if (empty($refreshToken)) {
            return $this->failUnauthorized('Refresh token not found');
        }

        // 2. 驗證裝置指紋（可選，增強安全性）
        if (getenv('ENABLE_DEVICE_FINGERPRINT') === 'true') {
            $storedFingerprint = $this->request->getCookie('device_fp');
            $currentFingerprint = $this->fingerprintService->generate($this->request);

            if (!$this->fingerprintService->verify($storedFingerprint, $currentFingerprint)) {
                $this->logger->logSecurityEvent('fingerprint_mismatch', [
                    'ip' => $this->request->getIPAddress(),
                    'user_agent' => $this->request->getUserAgent()->getAgentString(),
                ]);

                return $this->failUnauthorized('Device fingerprint mismatch. Please login again.');
            }
        }

        // 3. 呼叫 CRM API（將 Cookie 轉換為 Body）
        $crmClient = new CrmApiClient();

        try {
            $response = $crmClient->post('/auth/refresh', [
                'json' => ['refresh_token' => $refreshToken]
            ]);

            $data = json_decode($response->getBody()->getContents(), true);

            // 4. Token Rotation：更新 Cookie 為新的 refresh token（如果 CRM 提供）
            if (isset($data['data']['refresh_token'])) {
                $newRefreshToken = $data['data']['refresh_token'];

                // 設定新的 refresh token Cookie
                $this->response->setCookie([
                    'name'     => 'refresh_token',
                    'value'    => $newRefreshToken,
                    'expire'   => 30 * 24 * 3600, // 30 天
                    'path'     => '/',
                    'domain'   => getenv('COOKIE_DOMAIN'),
                    'httponly' => true,
                    'secure'   => true,
                    'samesite' => 'None'
                ]);
            }

            // 5. 記錄成功事件
            $userId = $data['data']['user_id'] ?? null;
            if ($userId) {
                $this->logger->logTokenRefresh($userId, true);
            }

            // 6. 返回新的 access token 給前端
            return $this->respond([
                'access_token' => $data['data']['access_token'],
                'token_type' => 'Bearer',
                'expires_in' => $data['data']['expires_in']
            ], 200);

        } catch (\GuzzleHttp\Exception\ClientException $e) {
            // 4xx 錯誤（如 refresh token 無效或過期）
            $statusCode = $e->getResponse()->getStatusCode();
            $errorBody = json_decode($e->getResponse()->getBody()->getContents(), true);

            if ($statusCode === 401) {
                // Refresh token 無效，清除 Cookie
                $this->response->deleteCookie('refresh_token');
                $this->response->deleteCookie('device_fp');
            }

            $this->logger->logTokenRefresh(null, false, $errorBody['message'] ?? 'Unknown error');

            return $this->fail($errorBody['message'] ?? 'Token refresh failed', $statusCode);

        } catch (\Exception $e) {
            // 5xx 錯誤或網路錯誤
            $this->logger->logApiError(
                '/auth/refresh',
                500,
                $e->getMessage()
            );

            return $this->failServerError('Token refresh failed due to server error');
        }
    }
}
```

#### 2. CSRF Token Filter（`app/Filters/CsrfTokenFilter.php`）

```php
<?php

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

class CsrfTokenFilter implements FilterInterface
{
    /**
     * 驗證 CSRF Token（僅檢查寫入操作）
     */
    public function before(RequestInterface $request, $arguments = null)
    {
        // 僅檢查 POST/PUT/DELETE/PATCH
        $method = strtolower($request->getMethod());
        if (!in_array($method, ['post', 'put', 'delete', 'patch'])) {
            return null;
        }

        // 排除登入端點（尚未有 CSRF Token）
        $uri = $request->getUri()->getPath();
        $excludedPaths = ['/api/v1/auth/login', '/api/v1/auth/refresh'];

        foreach ($excludedPaths as $path) {
            if (strpos($uri, $path) !== false) {
                return null;
            }
        }

        // 從 Header 讀取 CSRF Token
        $tokenFromHeader = $request->getHeaderLine('X-CSRF-Token');

        // 從 Session 讀取預期的 Token
        $session = session();
        $tokenFromSession = $session->get('csrf_token');

        // 驗證
        if (empty($tokenFromHeader) || empty($tokenFromSession)) {
            return $this->forbiddenResponse('CSRF token missing');
        }

        if (!hash_equals($tokenFromSession, $tokenFromHeader)) {
            log_message('warning', 'CSRF token mismatch: ' . json_encode([
                'ip' => $request->getIPAddress(),
                'uri' => $uri,
            ]));

            return $this->forbiddenResponse('CSRF token mismatch');
        }

        return null;
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        // 不需要 after 處理
    }

    private function forbiddenResponse(string $message): ResponseInterface
    {
        $response = service('response');
        $response->setStatusCode(403);
        $response->setJSON([
            'error' => 'Forbidden',
            'message' => $message,
        ]);
        return $response;
    }
}
```

#### 3. 登入時生成 CSRF Token（`app/Controllers/Api/V1/Auth/LoginController.php`）

```php
public function login()
{
    // ... 驗證憑證、呼叫 CRM API ...

    $result = $crmClient->login($username, $password, $rememberMe);

    // 設定 Refresh Token Cookie
    $this->response->setCookie([
        'name'     => 'refresh_token',
        'value'    => $result['refresh_token'],
        'expire'   => $rememberMe ? 30 * 24 * 3600 : 7 * 24 * 3600,
        'httponly' => true,
        'secure'   => true,
        'samesite' => 'None'
    ]);

    // 生成 CSRF Token
    $csrfToken = bin2hex(random_bytes(32));
    $session = session();
    $session->set('csrf_token', $csrfToken);

    // 設定 CSRF Token Cookie（非 HttpOnly，前端可讀）
    $this->response->setCookie([
        'name'     => 'csrf_token',
        'value'    => $csrfToken,
        'expire'   => 0, // Session cookie
        'httponly' => false, // 允許 JavaScript 讀取
        'secure'   => true,
        'samesite' => 'Strict'
    ]);

    // 生成並儲存裝置指紋
    if (getenv('ENABLE_DEVICE_FINGERPRINT') === 'true') {
        $fingerprintService = new DeviceFingerprintService();
        $fingerprint = $fingerprintService->generate($this->request);

        $this->response->setCookie([
            'name'     => 'device_fp',
            'value'    => $fingerprint,
            'expire'   => 30 * 24 * 3600,
            'httponly' => true,
            'secure'   => true,
            'samesite' => 'None'
        ]);
    }

    // 記錄登入成功
    $this->logger->logLoginSuccess(
        $result['user']['id'],
        $username,
        $this->request
    );

    // 返回給前端（不包含 refresh_token）
    return $this->respond([
        'access_token' => $result['access_token'],
        'token_type' => 'Bearer',
        'expires_in' => $result['expires_in'],
        'user' => $result['user'],
        'csrf_token' => $csrfToken, // 也可從 Cookie 讀取
    ], 200);
}
```

#### 4. Device Fingerprint Service（`app/Services/DeviceFingerprintService.php`）

```php
<?php

namespace App\Services;

use CodeIgniter\HTTP\RequestInterface;

class DeviceFingerprintService
{
    /**
     * 生成裝置指紋
     */
    public function generate(RequestInterface $request): string
    {
        $components = [
            $request->getUserAgent()->getAgentString(),
            $this->normalizeIp($request->getIPAddress()),
            $request->getHeaderLine('Accept-Language'),
            $request->getHeaderLine('Accept-Encoding'),
        ];

        // 移除空值
        $components = array_filter($components);

        return hash('sha256', implode('|', $components));
    }

    /**
     * 驗證指紋是否一致
     */
    public function verify(?string $storedFingerprint, string $currentFingerprint): bool
    {
        if (empty($storedFingerprint)) {
            return false;
        }

        return hash_equals($storedFingerprint, $currentFingerprint);
    }

    /**
     * 正規化 IP 位址（取前 3 段，允許同網段）
     */
    private function normalizeIp(string $ip): string
    {
        // IPv4: 192.168.1.100 → 192.168.1.0
        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            $parts = explode('.', $ip);
            return implode('.', array_slice($parts, 0, 3)) . '.0';
        }

        // IPv6: 簡化處理，取前 4 段
        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) {
            $parts = explode(':', $ip);
            return implode(':', array_slice($parts, 0, 4)) . '::';
        }

        return $ip;
    }
}
```

#### 5. 前端 CSRF Token 處理（`frontend/src/services/api.ts`）

```typescript
import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // 支援 HttpOnly Cookies
});

// Request 攔截器：加入 Access Token 和 CSRF Token
api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();

    // 加入 Access Token
    if (authStore.accessToken) {
      config.headers.Authorization = `Bearer ${authStore.accessToken}`;
    }

    // 加入 CSRF Token（從 Cookie 讀取）
    const csrfToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrf_token='))
      ?.split('=')[1];

    if (csrfToken && ['post', 'put', 'delete', 'patch'].includes(config.method?.toLowerCase() || '')) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response 攔截器（401 自動更新邏輯保持不變）
// ... 與之前的 research.md 相同 ...

export default api;
```

#### 6. 環境變數配置（`.env`）

```env
# CSRF Protection
ENABLE_CSRF_PROTECTION=true

# Device Fingerprinting
ENABLE_DEVICE_FINGERPRINT=true

# Cookie 設定
COOKIE_DOMAIN=.example.com
```

#### 7. Filter 註冊（`app/Config/Filters.php`）

```php
<?php

namespace Config;

use CodeIgniter\Config\BaseConfig;

class Filters extends BaseConfig
{
    public array $aliases = [
        'cors'       => \App\Filters\CorsFilter::class,
        'jwt_auth'   => \App\Filters\JwtAuthFilter::class,
        'csrf_token' => \App\Filters\CsrfTokenFilter::class,
    ];

    public array $globals = [
        'before' => [
            'cors',       // 全域 CORS
            'csrf_token', // 全域 CSRF 驗證
        ],
        'after' => [
            'cors',
        ],
    ];

    public array $filters = [
        'jwt_auth' => ['before' => ['api/v1/*'], 'except' => ['api/v1/auth/login', 'api/v1/auth/refresh']],
    ];
}
```

### 測試驗證

#### 單元測試：Refresh Token Rotation

```php
<?php

namespace Tests\Integration\Api\V1\Auth;

use CodeIgniter\Test\FeatureTestTrait;
use CodeIgniter\Test\CIUnitTestCase;

class RefreshControllerTest extends CIUnitTestCase
{
    use FeatureTestTrait;

    public function testRefreshTokenRotation()
    {
        // 模擬登入取得 refresh token
        $loginResponse = $this->withBodyFormat('json')
            ->post('/api/v1/auth/login', [
                'username' => 'testuser',
                'password' => 'testpass'
            ]);

        $oldRefreshToken = $this->getResponseCookie('refresh_token');
        $this->assertNotEmpty($oldRefreshToken);

        // 等待 1 秒後更新
        sleep(1);

        // 呼叫 refresh 端點
        $refreshResponse = $this->withCookie('refresh_token', $oldRefreshToken)
            ->post('/api/v1/auth/refresh');

        $refreshResponse->assertStatus(200);

        // 驗證：取得新的 refresh token
        $newRefreshToken = $this->getResponseCookie('refresh_token');
        $this->assertNotEmpty($newRefreshToken);
        $this->assertNotEquals($oldRefreshToken, $newRefreshToken);

        // 驗證：舊 token 無法再次使用
        $retryResponse = $this->withCookie('refresh_token', $oldRefreshToken)
            ->post('/api/v1/auth/refresh');

        $retryResponse->assertStatus(401);
    }
}
```

#### 單元測試：CSRF Token 驗證

```php
public function testCsrfTokenRequired()
{
    // 登入取得 CSRF Token
    $loginResponse = $this->post('/api/v1/auth/login', [
        'username' => 'testuser',
        'password' => 'testpass'
    ]);

    $csrfToken = $loginResponse->getJSON()->csrf_token;

    // 沒有 CSRF Token：失敗
    $response = $this->post('/api/v1/some-protected-endpoint', [
        'data' => 'test'
    ]);
    $response->assertStatus(403);

    // 有 CSRF Token：成功
    $response = $this->withHeaders(['X-CSRF-Token' => $csrfToken])
        ->post('/api/v1/some-protected-endpoint', [
            'data' => 'test'
        ]);
    $response->assertStatus(200);
}
```

#### 單元測試：Device Fingerprint

```php
public function testDeviceFingerprintMismatch()
{
    // 登入
    $loginResponse = $this->withHeaders([
        'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept-Language' => 'en-US'
    ])->post('/api/v1/auth/login', [
        'username' => 'testuser',
        'password' => 'testpass'
    ]);

    $refreshToken = $this->getResponseCookie('refresh_token');
    $deviceFp = $this->getResponseCookie('device_fp');

    // 嘗試從不同裝置更新（User-Agent 改變）
    $refreshResponse = $this->withHeaders([
        'User-Agent' => 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        'Accept-Language' => 'en-US'
    ])->withCookie('refresh_token', $refreshToken)
      ->withCookie('device_fp', $deviceFp)
      ->post('/api/v1/auth/refresh');

    // 驗證：被拒絕
    $refreshResponse->assertStatus(401);
    $refreshResponse->assertSee('Device fingerprint mismatch');
}
```

### 進階增強（可選實作）

#### Token 使用追蹤（需 Redis）

```php
// 在 RefreshController 中加入
private function trackTokenUsage(string $oldToken, string $newToken): void
{
    $redis = \Config\Services::redis();

    // 記錄舊 token 已被使用
    $redis->setex(
        "refresh_token_used:{$oldToken}",
        3600, // 1 小時內禁止重用
        json_encode([
            'used_at' => time(),
            'new_token' => hash('sha256', $newToken), // 不儲存明文
        ])
    );
}

private function detectTokenReuse(string $token): bool
{
    $redis = \Config\Services::redis();
    return $redis->exists("refresh_token_used:{$token}");
}
```

#### Sliding Window Session（滑動窗口）

```php
// 在更新成功後，檢查是否需要延長有效期
$remainingTime = $expiryTimestamp - time();

if ($remainingTime < 7 * 24 * 3600) { // 剩餘少於 7 天
    // 延長至 30 天
    $newExpiry = time() + 30 * 24 * 3600;

    $this->response->setCookie([
        'name'   => 'refresh_token',
        'value'  => $newRefreshToken,
        'expire' => $newExpiry,
        // ... 其他安全屬性
    ]);
}
```

### 參考資料

- [RFC 6819: OAuth 2.0 Threat Model and Security Considerations](https://datatracker.ietf.org/doc/html/rfc6819)
- [OWASP: Cross-Site Request Forgery (CSRF) Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [OWASP: Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [Auth0: Refresh Token Rotation](https://auth0.com/docs/secure/tokens/refresh-tokens/refresh-token-rotation)
- [MDN: Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie)

---

## 總結

### Phase 0 研究成果概覽

| 研究任務 | 關鍵決策 | 主要技術 | 捨棄方案數量 |
|---------|---------|---------|-------------|
| JWT + HttpOnly Cookies | Filter + firebase/php-jwt | CodeIgniter 4 Filters | 3 |
| Guzzle 重試機制 | Middleware + 指數退避 | GuzzleHTTP RetryMiddleware | 3 |
| CORS 配置 | 應用層級 Filter | CorsFilter | 3 |
| Docker 多環境部署 | Base + Override | Docker Compose | 3 |
| Vue 權杖更新 | Axios 攔截器 + Pinia | Axios + Pinia + Composable | 3 |
| 日誌與敏感資料過濾 | JSON 格式 + 自訂 Service | LoggingService | 3 |
| Refresh Token 安全增強 | Rotation + CSRF + Fingerprinting | 三層安全防護 + 代理層 | 3 |

### 下一步行動

Phase 0 研究已全部完成，接下來進入 **Phase 1：設計階段**，需產出以下文件：

1. **`data-model.md`**：定義實體、狀態機、驗證規則
2. **`contracts/backend-api.yaml`**：後端 API OpenAPI 規格
3. **`contracts/crm-api.yaml`**：CRM API 整合參考規格
4. **`quickstart.md`**：快速開始指南

所有設計文件需符合以下原則：
- 使用**繁體中文**撰寫（符合憲章 V. Documentation Language）
- 符合 Phase 0 研究決策
- 通過憲章預開發閘門檢查

---

**文件版本**：1.1
**最後更新**：2025-10-23
**狀態**：已完成（含安全增強）
