// 백엔드 DTO를 기준으로 수작업 정의한 API 타입.
// 백엔드 계약이 바뀌면 이 파일을 함께 갱신한다.

// ─────────────────────────────────────────
// 공통 응답 래퍼
// ─────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean
  data: T
  message: string | null
}

export interface ErrorBody {
  code: string
  message: string
}

// ─────────────────────────────────────────
// enum
// ─────────────────────────────────────────

export type ProjectMemberRole = 'LEADER' | 'MEMBER'
export type ProjectStatus = 'ACTIVE' | 'ARCHIVED'
export type StageType = 'PLAN' | 'FEATURE_SPEC' | 'SCREEN_SPEC' | 'WIREFRAME'
export type StageDocumentStatus = 'DRAFT' | 'CONFIRMED'
export type SourceType = 'MEETING_NOTE' | 'MEETING_FILE' | 'STAGE_DOCUMENT'
export type MeetingFileStatus = 'TRANSCRIBING' | 'COMPLETED' | 'FAILED'
export type WireframeRegenerationRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

// ─────────────────────────────────────────
// auth
// ─────────────────────────────────────────

export interface SignupRequest {
  loginId: string
  password: string
  name: string
}

export interface SignupResponse {
  id: number
  loginId: string
  name: string
}

export interface LoginRequest {
  loginId: string
  password: string
}

export interface LoginResponse {
  id: number
  loginId: string
  name: string
}

export interface MeResponse {
  userId: number
  loginId: string
  name: string
}

// ─────────────────────────────────────────
// project
// ─────────────────────────────────────────

export interface ProjectCreateRequest {
  title: string
  description?: string
  goal?: string
  startDate?: string // ISO date (yyyy-MM-dd)
  endDate?: string
}

export interface ProjectCreateResponse {
  projectId: number
  title: string
  role: ProjectMemberRole
  status: ProjectStatus
}

export interface ProjectListItem {
  projectId: number
  title: string
  description: string | null
  role: ProjectMemberRole
  status: ProjectStatus
}

export interface ProjectListResponse {
  projects: ProjectListItem[]
}

export interface ProjectDetailResponse {
  projectId: number
  title: string
  description: string | null
  startDate: string | null
  endDate: string | null
  goal: string | null
  myRole: ProjectMemberRole
  status: ProjectStatus
}

export interface ProjectMember {
  userId: number
  name: string
  loginId: string
  role: ProjectMemberRole
}

export interface ProjectMemberListResponse {
  members: ProjectMember[]
}

export interface ProjectInviteLinkResponse {
  inviteToken: string
  inviteUrl: string
}

export interface ProjectJoinRequest {
  inviteToken: string
}

export interface ProjectJoinResponse {
  projectId: number
  title: string
  role: ProjectMemberRole
}

export interface ProjectTransferLeaderRequest {
  newLeaderId: number
}

export interface ProjectTransferLeaderResponse {
  projectId: number
  message: string
}

export interface ProjectRemoveMemberResponse {
  message: string
}

// ─────────────────────────────────────────
// stage document
// ─────────────────────────────────────────

export interface PlanGenerateRequest {
  sourceType: SourceType
  sourceId: number
}

export interface FeatureGenerateRequest {
  previousDocumentId: number
}

export interface ScreenGenerateRequest {
  previousDocumentId: number
}

export interface SnapshotUpdateRequest {
  content: string
}

// content 는 PLAN/FEATURE_SPEC/SCREEN_SPEC 별로 형태가 달라 unknown 으로 둔다.
export interface StageDocumentResponse {
  documentId: number
  stageType: StageType
  status: StageDocumentStatus
  content: unknown
}

// stageType 별 content 실제 구조. StageDocumentResponse.content(unknown)를
// 화면에서 렌더링할 때만 stageType 기준으로 좁혀서 사용한다.
export interface PlanContent {
  problemDefinition: string
  targetUser: string
  servicePurpose: string
  coreValue: string
}

export interface FeatureSpecContent {
  features: {
    name: string
    description: string
    priority: 'HIGH' | 'MEDIUM' | 'LOW'
    includedInMvp: boolean
  }[]
}

export interface ScreenSpecContent {
  screens: {
    screenId: number
    name: string
    purpose: string
    components: { id: string; type: string; name: string; description: string }[]
    inputs: {
      id: string
      label: string
      inputType: string
      placeholder: string
      required: boolean
      validation: string
    }[]
    buttons: { id: string; label: string; action: string; role: string }[]
    navigation: {
      triggerId: string
      targetScreenId: number
      targetScreenName: string
      condition: string
    }[]
    exceptions: { type: string; condition: string; message: string; handling: string }[]
  }[]
}

// ─────────────────────────────────────────
// wireframe
// ─────────────────────────────────────────

export interface WireframeElement {
  id: string
  type: string
  text: string
  x: number
  y: number
  w: number
  h: number
}

export interface WireframeDsl {
  type: string
  width: number
  height: number
  elements: WireframeElement[]
}

export interface ScreenWireframe {
  screenId: number
  screenName: string
  wireframe: WireframeDsl | null
}

export interface WireframeGenerateRequest {
  screenIds: number[]
}

export interface WireframeRegenerationCreateRequest {
  reason: string
}

export interface WireframeRegenerationCreateResponse {
  requestId: number
  screenId: number
  status: WireframeRegenerationRequestStatus
  message: string
}

export interface WireframeRegenerationRequester {
  userId: number
  name: string
}

export interface WireframeRegenerationItem {
  requestId: number
  screenId: number
  screenName: string
  requestedBy: WireframeRegenerationRequester
  reason: string
  status: WireframeRegenerationRequestStatus
  createdAt: string
}

export interface WireframeRegenerationListResponse {
  requests: WireframeRegenerationItem[]
}

export interface WireframeRegenerationAcceptResponse {
  requestId: number
  screenId: number
  status: WireframeRegenerationRequestStatus
  message: string
  wireframe: WireframeDsl
}

export interface WireframeRegenerationRejectResponse {
  requestId: number
  status: WireframeRegenerationRequestStatus
  message: string
}

// ─────────────────────────────────────────
// meeting
// ─────────────────────────────────────────

export interface MeetingNoteCreateRequest {
  title: string
  content: string
}

export interface MeetingNoteCreateResponse {
  meetingNoteId: number
  title: string
  message: string
}

export interface MeetingFileUploadResponse {
  fileId: number
  fileName: string
  status: MeetingFileStatus
  message: string
}

export interface MeetingFileStatusResponse {
  fileId: number
  status: MeetingFileStatus
  transcript: string | null
}
