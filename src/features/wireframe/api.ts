import { api } from '@/shared/api/client'
import type {
  ScreenWireframe,
  WireframeDsl,
  WireframeGenerateRequest,
  WireframeRegenerationAcceptResponse,
  WireframeRegenerationCreateRequest,
  WireframeRegenerationCreateResponse,
  WireframeRegenerationListResponse,
  WireframeRegenerationRejectResponse,
} from '@/shared/api/types'

export const wireframeApi = {
  generate: (projectId: number, body: WireframeGenerateRequest) =>
    api.post<ScreenWireframe[]>(`/projects/${projectId}/stages/wireframes/generate`, body),

  getScreens: (projectId: number, signal?: AbortSignal) =>
    api.get<ScreenWireframe[]>(`/projects/${projectId}/screens`, signal),

  getWireframe: (screenId: number, signal?: AbortSignal) =>
    api.get<WireframeDsl>(`/screens/${screenId}/wireframe`, signal),

  createRegenerationRequest: (screenId: number, body: WireframeRegenerationCreateRequest) =>
    api.post<WireframeRegenerationCreateResponse>(
      `/screens/${screenId}/wireframe/regeneration-requests`,
      body,
    ),

  getRegenerationRequests: (projectId: number, signal?: AbortSignal) =>
    api.get<WireframeRegenerationListResponse>(
      `/projects/${projectId}/wireframe/regeneration-requests`,
      signal,
    ),

  acceptRegenerationRequest: (requestId: number) =>
    api.post<WireframeRegenerationAcceptResponse>(
      `/wireframe/regeneration-requests/${requestId}/accept`,
    ),

  rejectRegenerationRequest: (requestId: number) =>
    api.post<WireframeRegenerationRejectResponse>(
      `/wireframe/regeneration-requests/${requestId}/reject`,
    ),
}
