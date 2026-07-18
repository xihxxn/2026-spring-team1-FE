import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { MeetingNoteCreateRequest } from '@/shared/api/types'
import { meetingApi } from './api'

export const meetingKeys = {
  all: ['meeting'] as const,
  fileStatus: (fileId: number) => [...meetingKeys.all, 'file-status', fileId] as const,
}

export function useCreateMeetingNote(projectId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: MeetingNoteCreateRequest) => meetingApi.createNote(projectId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.all })
    },
  })
}

export function useUploadMeetingFile(projectId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => meetingApi.uploadFile(projectId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.all })
    },
  })
}

// STT 변환은 비동기(TRANSCRIBING → COMPLETED/FAILED)라 완료될 때까지 폴링한다.
export function useMeetingFileStatus(fileId: number, enabled = true) {
  return useQuery({
    queryKey: meetingKeys.fileStatus(fileId),
    queryFn: ({ signal }) => meetingApi.getFileStatus(fileId, signal),
    enabled: enabled && fileId > 0,
    refetchInterval: (query) => (query.state.data?.status === 'TRANSCRIBING' ? 3000 : false),
  })
}
