import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  FeatureGenerateRequest,
  PlanGenerateRequest,
  ScreenGenerateRequest,
  SnapshotUpdateRequest,
  StageDocumentResponse,
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

// 생성 뮤테이션은 서버가 돌려준 문서를 캐시에 즉시 써넣는다(setQueryData).
// invalidateQueries만 쓰면 refetch가 비동기로 한 번 더 걸려 화면이 "여전히 없음"
// 상태를 잠깐 보여주고, 그걸 보고 사용자가 생성 버튼을 다시 누르게 되는 원인이 된다.
export function useGeneratePlan(projectId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: PlanGenerateRequest) => stageApi.generatePlan(projectId, body),
    onSuccess: (data: StageDocumentResponse) => {
      queryClient.setQueryData(stageKeys.document(projectId, 'PLAN'), data)
    },
  })
}

export function useGenerateFeatureSpec(projectId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: FeatureGenerateRequest) => stageApi.generateFeatureSpec(projectId, body),
    onSuccess: (data: StageDocumentResponse) => {
      queryClient.setQueryData(stageKeys.document(projectId, 'FEATURE_SPEC'), data)
    },
  })
}

export function useGenerateScreenSpec(projectId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: ScreenGenerateRequest) => stageApi.generateScreenSpec(projectId, body),
    onSuccess: (data: StageDocumentResponse) => {
      queryClient.setQueryData(stageKeys.document(projectId, 'SCREEN_SPEC'), data)
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
      // 저장한 화면은 mutation 호출부가 편집 값을 즉시 캐시에 반영한다.
      // 여기서 활성 refetch까지 시작하면 REST 응답과 경쟁할 수 있으므로 stale 표시만 하고,
      // 다른 사용자의 저장은 WebSocket 이벤트에서 활성 refetch한다.
      queryClient.invalidateQueries({
        queryKey: [...stageKeys.all, projectId],
        refetchType: 'none',
      })
    },
  })
}

export function useConfirmDocument(
  projectId: number,
  stageType: Exclude<StageType, 'WIREFRAME'>,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (documentId: number) => stageApi.confirm(documentId),
    onSuccess: () => {
      // confirm 응답이 void라 서버가 갱신된 문서를 안 주므로, 캐시에 있는 값을
      // 낙관적으로 CONFIRMED 로 바꿔 다음 단계 페이지가 즉시 "확정됨"을 인식하게 한다.
      queryClient.setQueryData<StageDocumentResponse>(
        stageKeys.document(projectId, stageType),
        (prev) => (prev ? { ...prev, status: 'CONFIRMED' } : prev),
      )
    },
  })
}
