import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ProjectCreateRequest, ProjectJoinRequest } from '@/shared/api/types'
import { projectApi } from './api'


export const projectKeys = {
  all: ['projects'] as const,
  list: () => [...projectKeys.all, 'list'] as const,
  detail: (projectId: number) => [...projectKeys.all, 'detail', projectId] as const,
  members: (projectId: number) => [...projectKeys.all, 'members', projectId] as const,
}

export function useProjectList() {
  return useQuery({
    queryKey: projectKeys.list(),
    queryFn: ({ signal }) => projectApi.list(signal),
  })
}

export function useProjectDetail(projectId: number) {
  return useQuery({
    queryKey: projectKeys.detail(projectId),
    queryFn: ({ signal }) => projectApi.detail(projectId, signal),
    enabled: projectId > 0,
  })
}

export function useProjectMembers(projectId: number) {
  return useQuery({
    queryKey: projectKeys.members(projectId),
    queryFn: ({ signal }) => projectApi.members(projectId, signal),
    enabled: projectId > 0,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: ProjectCreateRequest) => projectApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.list() })
    },
  })
}

export function useJoinProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: ProjectJoinRequest) => projectApi.join(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.list() })
    },
  })
}

export function useCreateInviteLink() {
  return useMutation({
    mutationFn: (projectId: number) => projectApi.createInviteLink(projectId),
  })
}

export function useTransferLeader(projectId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (newLeaderId: number) =>
      projectApi.transferLeader(projectId, { newLeaderId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) })
      queryClient.invalidateQueries({ queryKey: projectKeys.members(projectId) })
    },
  })
}

export function useRemoveMember(projectId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (memberId: number) => projectApi.removeMember(projectId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.members(projectId) })
    },
  })
}
