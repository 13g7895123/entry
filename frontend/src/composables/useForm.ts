// composables/useForm.ts
// 表單驗證 Composable - 整合 Yup schema 與即時驗證

import { ref, reactive, computed } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import type { ObjectSchema } from 'yup'
import type { ValidationError } from 'yup'

interface FormErrors {
  [key: string]: string | undefined
}

interface UseFormReturn<T> {
  values: T
  errors: Ref<FormErrors>
  isValid: ComputedRef<boolean>
  validateField: (fieldName: keyof T) => Promise<boolean>
  validateForm: () => Promise<boolean>
  resetForm: () => void
}

/**
 * 表單驗證 Composable
 *
 * @param schema - Yup 驗證 schema
 * @param initialValues - 表單初始值
 * @returns 表單驗證相關的狀態與方法
 *
 * @example
 * ```ts
 * const { values, errors, isValid, validateField, validateForm } = useForm(
 *   loginCredentialsSchema,
 *   { username: '', password: '', rememberMe: false }
 * )
 * ```
 */
export function useForm<T extends Record<string, any>>(
  schema: ObjectSchema<T>,
  initialValues: T
): UseFormReturn<T> {
  // 表單值 - 使用 reactive 確保深層響應性
  const values = reactive<T>({ ...initialValues }) as T

  // 錯誤訊息 - 使用 ref 包裹的物件
  const errors = ref<FormErrors>({})

  // 已驗證的欄位集合
  const touchedFields = ref<Set<keyof T>>(new Set())

  /**
   * 計算表單是否有效
   * 所有已觸碰的欄位都沒有錯誤，且至少有一個欄位已觸碰
   */
  const isValid = computed(() => {
    // 如果沒有任何欄位被觸碰，表單無效
    if (touchedFields.value.size === 0) {
      return false
    }

    // 檢查所有欄位是否都沒有錯誤
    const hasErrors = Object.values(errors.value).some((error) => error !== undefined)
    if (hasErrors) {
      return false
    }

    // 檢查所有必填欄位是否都已填寫
    try {
      schema.validateSync(values)
      return true
    } catch {
      return false
    }
  })

  /**
   * 驗證單一欄位
   *
   * @param fieldName - 要驗證的欄位名稱
   * @returns Promise<boolean> - 驗證是否通過
   */
  const validateField = async (fieldName: keyof T): Promise<boolean> => {
    // 標記欄位為已觸碰
    touchedFields.value.add(fieldName)

    try {
      // 使用 schema.validateAt 驗證單一欄位
      await schema.validateAt(fieldName as string, values)

      // 驗證通過，清除錯誤訊息
      errors.value[fieldName as string] = undefined

      return true
    } catch (error) {
      // 驗證失敗，設定錯誤訊息
      if (error instanceof Error && 'message' in error) {
        errors.value[fieldName as string] = (error as ValidationError).message
      } else {
        errors.value[fieldName as string] = '驗證失敗'
      }

      return false
    }
  }

  /**
   * 驗證整個表單
   *
   * @returns Promise<boolean> - 驗證是否通過
   */
  const validateForm = async (): Promise<boolean> => {
    // 標記所有欄位為已觸碰
    Object.keys(values).forEach((key) => {
      touchedFields.value.add(key as keyof T)
    })

    try {
      // 驗證整個表單
      await schema.validate(values, { abortEarly: false })

      // 驗證通過，清除所有錯誤訊息
      errors.value = {}

      return true
    } catch (error) {
      if (error instanceof Error && 'inner' in error) {
        const validationError = error as ValidationError

        // 清除舊的錯誤訊息
        errors.value = {}

        // 設定新的錯誤訊息
        if (validationError.inner && validationError.inner.length > 0) {
          validationError.inner.forEach((err) => {
            if (err.path) {
              errors.value[err.path] = err.message
            }
          })
        } else if (validationError.path) {
          // 只有一個錯誤
          errors.value[validationError.path] = validationError.message
        }
      }

      return false
    }
  }

  /**
   * 重置表單
   * 清除所有值、錯誤訊息和觸碰狀態
   */
  const resetForm = (): void => {
    // 重置所有值
    Object.keys(initialValues).forEach((key) => {
      ;(values as any)[key] = initialValues[key]
    })

    // 清除錯誤訊息
    errors.value = {}

    // 清除觸碰狀態
    touchedFields.value.clear()
  }

  return {
    values,
    errors,
    isValid,
    validateField,
    validateForm,
    resetForm
  }
}
