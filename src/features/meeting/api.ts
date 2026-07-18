import { api, postFormData } from '@/shared/api/client'
import type {
  MeetingFileStatusResponse,
  MeetingFileUploadResponse,
  MeetingNoteCreateRequest,
  MeetingNoteCreateResponse,
} from '@/shared/api/types'

export const meetingApi = {
  createNote: (projectId: number, body: MeetingNoteCreateRequest) =>
    api.post<MeetingNoteCreateResponse>(`/projects/${projectId}/meeting-notes`, body),

  uploadFile: (projectId: number, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return postFormData<MeetingFileUploadResponse>(
      `/projects/${projectId}/meeting-files`,
      formData,
    )
  },

  getFileStatus: (fileId: number, signal?: AbortSignal) =>
    api.get<MeetingFileStatusResponse>(`/meeting-files/${fileId}`, signal),
}
