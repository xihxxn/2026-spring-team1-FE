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
