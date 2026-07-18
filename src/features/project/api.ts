import { api } from '@/shared/api/client'
import type {
  ProjectCreateRequest,
  ProjectCreateResponse,
  ProjectDetailResponse,
  ProjectInviteLinkResponse,
  ProjectJoinRequest,
  ProjectJoinResponse,
  ProjectListResponse,
  ProjectMemberListResponse,
} from '@/shared/api/types'

export const projectApi = {
  list: (signal?: AbortSignal) => api.get<ProjectListResponse>('/projects', signal),
  detail: (projectId: number, signal?: AbortSignal) =>
    api.get<ProjectDetailResponse>(`/projects/${projectId}`, signal),
  members: (projectId: number, signal?: AbortSignal) =>
    api.get<ProjectMemberListResponse>(`/projects/${projectId}/members`, signal),
  create: (body: ProjectCreateRequest) =>
    api.post<ProjectCreateResponse>('/projects', body),
  createInviteLink: (projectId: number) =>
    api.post<ProjectInviteLinkResponse>(`/projects/${projectId}/invite-link`),
  join: (body: ProjectJoinRequest) => api.post<ProjectJoinResponse>('/projects/join', body),
}
