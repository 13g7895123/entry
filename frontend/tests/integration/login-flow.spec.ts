// tests/integration/login-flow.spec.ts
// Integration 測試 - 完整登入流程 E2E

import { test, expect } from '@playwright/test'

test.describe('[US1] Login Flow Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/login')
  })

  test('應成功完成登入流程並導向會員頁面', async ({ page }) => {
    // 等待登入頁面載入
    await expect(page.locator('h1')).toContainText('登入')

    // 輸入有效的帳號密碼
    await page.fill('input[name="username"]', 'user@example.com')
    await page.fill('input[name="password"]', 'ValidPassword123')

    // 點擊登入按鈕
    await page.click('button[type="submit"]')

    // 等待載入狀態
    await expect(page.locator('button[type="submit"]')).toBeDisabled()

    // 驗證導向至會員頁面
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 5000 })

    // 驗證會員頁面顯示使用者資訊
    await expect(page.locator('text=張三')).toBeVisible()
  })

  test('應在帳號或密碼錯誤時顯示錯誤訊息', async ({ page }) => {
    // 輸入無效的帳號密碼
    await page.fill('input[name="username"]', 'user@example.com')
    await page.fill('input[name="password"]', 'WrongPassword')

    // 點擊登入按鈕
    await page.click('button[type="submit"]')

    // 驗證錯誤訊息顯示
    await expect(page.locator('[role="alert"]')).toContainText('帳號或密碼錯誤')

    // 驗證仍停留在登入頁面
    await expect(page).toHaveURL(/.*login/)
  })

  test('應在網路異常時顯示友善錯誤訊息', async ({ page }) => {
    // 模擬網路異常（透過 MSW 或攔截網路請求）
    await page.route('**/api/auth/login', (route) => route.abort('failed'))

    // 輸入帳號密碼
    await page.fill('input[name="username"]', 'user@example.com')
    await page.fill('input[name="password"]', 'ValidPassword123')

    // 點擊登入按鈕
    await page.click('button[type="submit"]')

    // 驗證錯誤訊息顯示
    await expect(page.locator('[role="alert"]')).toContainText('連線失敗')
  })

  test('應在表單輸入時顯示載入狀態', async ({ page }) => {
    // 輸入帳號密碼
    await page.fill('input[name="username"]', 'user@example.com')
    await page.fill('input[name="password"]', 'ValidPassword123')

    // 點擊登入按鈕
    await page.click('button[type="submit"]')

    // 驗證載入狀態
    await expect(page.locator('button[type="submit"]')).toContainText('登入中')
    await expect(page.locator('button[type="submit"]')).toBeDisabled()
  })

  test('應在 5 秒內完成登入流程', async ({ page }) => {
    const startTime = Date.now()

    // 執行登入
    await page.fill('input[name="username"]', 'user@example.com')
    await page.fill('input[name="password"]', 'ValidPassword123')
    await page.click('button[type="submit"]')

    // 等待導向
    await page.waitForURL(/.*dashboard/, { timeout: 5000 })

    const endTime = Date.now()
    const duration = endTime - startTime

    // 驗證時間在 5 秒內
    expect(duration).toBeLessThan(5000)
  })
})
