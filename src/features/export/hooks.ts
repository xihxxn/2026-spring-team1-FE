import { useQuery } from '@tanstack/react-query'
import { exportApi } from './api'

export const exportKeys = {
  markdown: (projectId: number) => ['export', 'markdown', projectId] as const,
}

// 확정된 산출물이 부족하면 EXPORT_NOT_READY(409)로 실패할 수 있으므로 자동 재시도하지 않는다.
export function useExportMarkdown(projectId: number, enabled: boolean) {
  return useQuery({
    queryKey: exportKeys.markdown(projectId),
    queryFn: () => exportApi.getMarkdown(projectId),
    enabled,
    retry: false,
  })
}
