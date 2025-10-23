// utils/validators.ts
// 表單驗證規則 - 使用 Yup

import * as yup from 'yup'

export const loginCredentialsSchema = yup.object({
  username: yup
    .string()
    .required('帳號為必填欄位')
    .min(3, '帳號至少需 3 個字元')
    .max(50, '帳號最多 50 個字元')
    .trim(),
  password: yup
    .string()
    .required('密碼為必填欄位')
    .min(6, '密碼長度至少需 6 個字元')
    .max(100, '密碼最多 100 個字元'),
  rememberMe: yup.boolean().default(false)
})
