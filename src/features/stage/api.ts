import { api } from '@/shared/api/client'
import type {
  FeatureGenerateRequest,
  PlanGenerateRequest,
  ScreenGenerateRequest,
  SnapshotUpdateRequest,
  StageDocumentResponse,
  StageType,
} from '@/shared/api/types'

export const stageApi = {
  generatePlan: (projectId: number, body: PlanGenerateRequest) =>
    api.post<StageDocumentResponse>(`/projects/${projectId}/stages/plan/generate`, body),

  generateFeatureSpec: (projectId: number, body: FeatureGenerateRequest) =>
    api.post<StageDocumentResponse>(`/projects/${projectId}/stages/features/generate`, body),

  generateScreenSpec: (projectId: number, body: ScreenGenerateRequest) =>
    api.post<StageDocumentResponse>(`/projects/${projectId}/stages/screens/generate`, body),

  // WIREFRAME 은 stage-documents 로 조회되지 않는 별도 엔티티라 백엔드가 STAGE_TYPE_INVALID 로 거부한다.
  getDocument: (projectId: number, stageType: Exclude<StageType, 'WIREFRAME'>, signal?: AbortSignal) =>
    api.get<StageDocumentResponse>(`/projects/${projectId}/stage-documents/${stageType}`, signal),

  updateSnapshot: (documentId: number, body: SnapshotUpdateRequest) =>
    api.patch<void>(`/stage-documents/${documentId}/snapshot`, body),

  confirm: (documentId: number) => api.post<void>(`/stage-documents/${documentId}/confirm`),
}
