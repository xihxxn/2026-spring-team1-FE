import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  FeatureGenerateRequest,
  PlanGenerateRequest,
  ScreenGenerateRequest,
  SnapshotUpdateRequest,
  StageType,
} from '@/shared/api/types'
import { stageApi } from './api'

export const stageKeys = {
  all: ['stage-documents'] as const,
  document: (projectId: number, stageType: StageType) =>
    [...stageKeys.all, projectId, stageType] as const,
}

export function useStageDocument(
  projectId: number,
  stageType: Exclude<StageType, 'WIREFRAME'>,
) {
  return useQuery({
    queryKey: stageKeys.document(projectId, stageType),
    queryFn: ({ signal }) => stageApi.getDocument(projectId, stageType, signal),
  })
}

export function useGeneratePlan(projectId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: PlanGenerateRequest) => stageApi.generatePlan(projectId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stageKeys.document(projectId, 'PLAN') })
    },
  })
}

export function useGenerateFeatureSpec(projectId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: FeatureGenerateRequest) => stageApi.generateFeatureSpec(projectId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: stageKeys.document(projectId, 'FEATURE_SPEC'),
      })
    },
  })
}

export function useGenerateScreenSpec(projectId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: ScreenGenerateRequest) => stageApi.generateScreenSpec(projectId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: stageKeys.document(projectId, 'SCREEN_SPEC'),
      })
    },
  })
}

// 공동편집 snapshot 저장. 어떤 stageType 문서인지 몰라도 무효화할 수 있도록
// projectId 하위 전체 stage-documents 캐시를 무효화한다.
export function useUpdateSnapshot(projectId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ documentId, ...body }: SnapshotUpdateRequest & { documentId: number }) =>
      stageApi.updateSnapshot(documentId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...stageKeys.all, projectId] })
    },
  })
}

export function useConfirmDocument(projectId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (documentId: number) => stageApi.confirm(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...stageKeys.all, projectId] })
    },
  })
}
