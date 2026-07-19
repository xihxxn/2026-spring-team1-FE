import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '@/shared/api/client'
import type { LoginRequest, MeResponse, SignupRequest } from '@/shared/api/types'
import { authApi } from './api'

export const meQueryKey = ['auth', 'me'] as const
export const sessionTokenQueryKey = ['auth', 'sessionToken'] as const

// 크로스도메인 배포에서 WebSocket 핸드셰이크에 세션 쿠키가 실리지 않는 경우를 대비해,
// 로그인 응답의 sessionToken을 쿼리 캐시에 보관해두고 useProjectWebSocket이 꺼내 쓴다.
export function useSessionToken() {
  return useQuery<string | null>({
    queryKey: sessionTokenQueryKey,
    queryFn: () => null,
    staleTime: Infinity,
    initialData: null,
  })
}

// 로그인 여부는 GET /auth/me 로만 판단할 수 있다(쿠키가 httpOnly).
// 401 이면 비로그인으로 간주하고 null 을 반환한다.
export function useMe() {
  return useQuery<MeResponse | null>({
    queryKey: meQueryKey,
    queryFn: async ({ signal }) => {
      try {
        return await authApi.me(signal)
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          return null
        }
        throw error
      }
    },
    staleTime: 5 * 60_000,
  })
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: LoginRequest) => authApi.login(body),
    onSuccess: (data) => {
      queryClient.setQueryData(sessionTokenQueryKey, data.sessionToken)
      queryClient.setQueryData(meQueryKey, {
        userId: data.id,
        loginId: data.loginId,
        name: data.name,
      })
    },
  })
}

export function useSignup() {
  return useMutation({
    mutationFn: (body: SignupRequest) => authApi.signup(body),
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      // 성공/실패와 무관하게 클라이언트 상태는 비운다.
      queryClient.setQueryData(meQueryKey, null)
      queryClient.setQueryData(sessionTokenQueryKey, null)
      queryClient.invalidateQueries({ queryKey: meQueryKey })
    },
  })
}
