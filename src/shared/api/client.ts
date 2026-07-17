import type { ApiResponse, ErrorBody } from './types'

// 백엔드가 반환하는 { success, data, message } 래퍼를 벗겨내고,
// 실패 시 code/message 를 담은 ApiError 를 던지는 얇은 fetch 래퍼.
//
// 인증은 httpOnly 세션 쿠키로 이뤄지므로 별도 토큰 헤더는 없다.
// 개발 환경에서는 Vite proxy 가 동일 출처로 만들어 주므로 credentials 기본값으로 충분하지만,
// 명시적으로 same-origin 을 지정해 둔다.

export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  signal?: AbortSignal
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal } = options

  const response = await fetch(path, {
    method,
    credentials: 'same-origin',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  })

  // 204 No Content 또는 빈 바디 처리
  const text = await response.text()
  const parsed: unknown = text ? JSON.parse(text) : null

  if (!response.ok) {
    const errorBody = extractErrorBody(parsed)
    throw new ApiError(
      response.status,
      errorBody?.code ?? 'UNKNOWN',
      errorBody?.message ?? `요청에 실패했습니다. (${response.status})`,
    )
  }

  const envelope = parsed as ApiResponse<T> | null
  return (envelope?.data ?? null) as T
}

function extractErrorBody(parsed: unknown): ErrorBody | null {
  if (parsed && typeof parsed === 'object' && 'data' in parsed) {
    const data = (parsed as { data: unknown }).data
    if (data && typeof data === 'object' && 'code' in data && 'message' in data) {
      return data as ErrorBody
    }
  }
  return null
}

export const api = {
  get: <T>(path: string, signal?: AbortSignal) => request<T>(path, { method: 'GET', signal }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}

// export(markdown) 처럼 ApiResponse 래퍼가 아닌 raw 텍스트 응답 전용.
export async function fetchText(path: string): Promise<string> {
  const response = await fetch(path, { credentials: 'same-origin' })
  if (!response.ok) {
    throw new ApiError(response.status, 'UNKNOWN', `요청에 실패했습니다. (${response.status})`)
  }
  return response.text()
}
