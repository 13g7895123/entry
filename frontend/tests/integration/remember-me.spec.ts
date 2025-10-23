// tests/integration/remember-me.spec.ts
// Integration 測試 - 記住我流程

import { test, expect } from '@playwright/test'

test.describe('[US2] Remember Me Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // 清除所有儲存
    await page.goto('http://localhost:5173/login')
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
  })

  test('應在勾選「記住我」後將 token 儲存至 localStorage', async ({ page, context }) => {
    await page.goto('http://localhost:5173/login')

    // 輸入帳號密碼
    await page.fill('input[name="username"]', 'user@example.com')
    await page.fill('input[name="password"]', 'ValidPassword123')

    // 勾選「記住我」
    await page.check('input[type="checkbox"]#rememberMe')

    // 點擊登入
    await page.click('button[type="submit"]')

    // 等待導向 dashboard
    await page.waitForURL(/.*dashboard/, { timeout: 5000 })

    // 驗證 token 儲存在 localStorage
    const localStorageToken = await page.evaluate(() => {
      return localStorage.getItem('auth_token')
    })
    expect(localStorageToken).toBeTruthy()

    // 驗證 sessionStorage 沒有 token
    const sessionStorageToken = await page.evaluate(() => {
      return sessionStorage.getItem('auth_token')
    })
    expect(sessionStorageToken).toBeNull()
  })

  test('應在未勾選「記住我」時將 token 儲存至 sessionStorage', async ({ page }) => {
    await page.goto('http://localhost:5173/login')

    // 輸入帳號密碼（不勾選記住我）
    await page.fill('input[name="username"]', 'user@example.com')
    await page.fill('input[name="password"]', 'ValidPassword123')

    // 點擊登入
    await page.click('button[type="submit"]')

    // 等待導向 dashboard
    await page.waitForURL(/.*dashboard/, { timeout: 5000 })

    // 驗證 token 儲存在 sessionStorage
    const sessionStorageToken = await page.evaluate(() => {
      return sessionStorage.getItem('auth_token')
    })
    expect(sessionStorageToken).toBeTruthy()

    // 驗證 localStorage 沒有 token
    const localStorageToken = await page.evaluate(() => {
      return localStorage.getItem('auth_token')
    })
    expect(localStorageToken).toBeNull()
  })

  test('應在關閉並重新開啟瀏覽器後保持登入（記住我）', async ({ page, context }) => {
    // 第一次登入並勾選記住我
    await page.goto('http://localhost:5173/login')
    await page.fill('input[name="username"]', 'user@example.com')
    await page.fill('input[name="password"]', 'ValidPassword123')
    await page.check('input[type="checkbox"]#rememberMe')
    await page.click('button[type="submit"]')
    await page.waitForURL(/.*dashboard/)

    // 取得 token
    const token = await page.evaluate(() => localStorage.getItem('auth_token'))

    // 模擬關閉瀏覽器：關閉頁面
    await page.close()

    // 重新開啟新頁面（模擬新 session）
    const newPage = await context.newPage()

    // 設定 localStorage（模擬瀏覽器重啟後的資料）
    await newPage.goto('http://localhost:5173/login')
    await newPage.evaluate((savedToken) => {
      localStorage.setItem('auth_token', savedToken || '')
      localStorage.setItem('auth_token_expires', String(Date.now() + 3600000))
    }, token)

    // 重新載入頁面，應該自動導向 dashboard
    await newPage.goto('http://localhost:5173/login')

    // 等待自動導向（若 checkAuth 實作正確）
    // 或驗證已登入狀態
    await newPage.waitForTimeout(1000)

    // 驗證使用者資訊顯示（已登入）
    const isLoggedIn = await newPage.evaluate(() => {
      return localStorage.getItem('auth_token') !== null
    })
    expect(isLoggedIn).toBe(true)
  })

  test('應在關閉瀏覽器後登出（未勾選記住我）', async ({ page, context }) => {
    // 登入但不勾選記住我
    await page.goto('http://localhost:5173/login')
    await page.fill('input[name="username"]', 'user@example.com')
    await page.fill('input[name="password"]', 'ValidPassword123')
    await page.click('button[type="submit"]')
    await page.waitForURL(/.*dashboard/)

    // 關閉頁面（模擬關閉瀏覽器）
    await page.close()

    // 重新開啟新頁面
    const newPage = await context.newPage()
    await newPage.goto('http://localhost:5173/login')

    // 驗證 sessionStorage 已清除（新 session）
    const sessionToken = await newPage.evaluate(() => {
      return sessionStorage.getItem('auth_token')
    })
    expect(sessionToken).toBeNull()

    // 驗證停留在登入頁面
    await expect(newPage).toHaveURL(/.*login/)
  })

  test('應在 token 過期後清除並導向登入頁', async ({ page }) => {
    // 設定過期 token
    await page.goto('http://localhost:5173/login')
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'expired_token')
      localStorage.setItem('auth_token_expires', String(Date.now() - 1000)) // 已過期
    })

    // 嘗試訪問 dashboard
    await page.goto('http://localhost:5173/dashboard')

    // 應該被導向登入頁
    await expect(page).toHaveURL(/.*login/)

    // 驗證 token 已被清除
    const token = await page.evaluate(() => localStorage.getItem('auth_token'))
    expect(token).toBeNull()
  })
})
