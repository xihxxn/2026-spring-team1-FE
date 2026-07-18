import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { WireframeGenerateRequest, WireframeRegenerationCreateRequest } from '@/shared/api/types'
import { wireframeApi } from './api'

export const wireframeKeys = {
  all: ['wireframe'] as const,
  screens: (projectId: number) => [...wireframeKeys.all, 'screens', projectId] as const,
  detail: (screenId: number) => [...wireframeKeys.all, 'detail', screenId] as const,
  regenerationRequests: (projectId: number) =>
    [...wireframeKeys.all, 'regeneration-requests', projectId] as const,
}

export function useProjectScreens(projectId: number) {
  return useQuery({
    queryKey: wireframeKeys.screens(projectId),
    queryFn: ({ signal }) => wireframeApi.getScreens(projectId, signal),
  })
}

export function useWireframe(screenId: number) {
  return useQuery({
    queryKey: wireframeKeys.detail(screenId),
    queryFn: ({ signal }) => wireframeApi.getWireframe(screenId, signal),
  })
}

export function useGenerateWireframe(projectId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: WireframeGenerateRequest) => wireframeApi.generate(projectId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wireframeKeys.screens(projectId) })
    },
  })
}

export function useRegenerationRequests(projectId: number) {
  return useQuery({
    queryKey: wireframeKeys.regenerationRequests(projectId),
    queryFn: ({ signal }) => wireframeApi.getRegenerationRequests(projectId, signal),
  })
}

export function useCreateRegenerationRequest(projectId: number, screenId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: WireframeRegenerationCreateRequest) =>
      wireframeApi.createRegenerationRequest(screenId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wireframeKeys.regenerationRequests(projectId) })
    },
  })
}

export function useAcceptRegenerationRequest(projectId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (requestId: number) => wireframeApi.acceptRegenerationRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wireframeKeys.regenerationRequests(projectId) })
      queryClient.invalidateQueries({ queryKey: wireframeKeys.screens(projectId) })
    },
  })
}

export function useRejectRegenerationRequest(projectId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (requestId: number) => wireframeApi.rejectRegenerationRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wireframeKeys.regenerationRequests(projectId) })
    },
  })
}
