interface ApiErrorLike {
  data?: {
    message?: string
    data?: { message?: string }
  }
  message?: string
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  const apiError = error as ApiErrorLike
  return apiError.data?.data?.message
    ?? apiError.data?.message
    ?? apiError.message
    ?? fallback
}
