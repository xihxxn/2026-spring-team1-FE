import { api } from '@/shared/api/client'
import type {
  LoginRequest,
  LoginResponse,
  MeResponse,
  SignupRequest,
  SignupResponse,
} from '@/shared/api/types'

export const authApi = {
  signup: (body: SignupRequest) => api.post<SignupResponse>('/auth/signup', body),
  login: (body: LoginRequest) => api.post<LoginResponse>('/auth/login', body),
  logout: () => api.post<void>('/auth/logout'),
  me: (signal?: AbortSignal) => api.get<MeResponse>('/auth/me', signal),
}
