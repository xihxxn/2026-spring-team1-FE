import { fetchText } from '@/shared/api/client'

export const exportApi = {
  // ApiResponse 래퍼가 아닌 text/markdown raw 응답.
  getMarkdown: (projectId: number) => fetchText(`/projects/${projectId}/export/markdown`),
}
