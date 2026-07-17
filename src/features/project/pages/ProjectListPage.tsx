import { ApiError } from '@/shared/api/client'
import { Button } from '@/shared/ui/Button'
import { useLogout, useMe } from '@/features/auth/hooks'
import { useProjectList } from '../hooks'

export function ProjectListPage() {
  const { data: me } = useMe()
  const logout = useLogout()
  const { data, isPending, isError, error } = useProjectList()

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">프로젝트</h1>
          {me && <p className="text-sm text-gray-500">{me.name}님 환영합니다.</p>}
        </div>
        <Button variant="secondary" onClick={() => logout.mutate()}>
          로그아웃
        </Button>
      </header>

      {isPending && <p className="text-sm text-gray-500">불러오는 중…</p>}

      {isError && (
        <p className="text-sm text-red-500">
          {error instanceof ApiError ? error.message : '프로젝트를 불러오지 못했습니다.'}
        </p>
      )}

      {data && data.projects.length === 0 && (
        <p className="text-sm text-gray-500">아직 참여 중인 프로젝트가 없습니다.</p>
      )}

      {data && data.projects.length > 0 && (
        <ul className="space-y-3">
          {data.projects.map((project) => (
            <li
              key={project.projectId}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
            >
              <div>
                <p className="font-medium text-gray-900">{project.title}</p>
                {project.description && (
                  <p className="text-sm text-gray-500">{project.description}</p>
                )}
              </div>
              <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs text-violet-700">
                {project.role}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
