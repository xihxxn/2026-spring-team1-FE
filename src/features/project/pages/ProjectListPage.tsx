import { ApiError } from '@/shared/api/client'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Logo } from '@/shared/ui/Logo'
import { useLogout, useMe } from '@/features/auth/hooks'
import { useProjectList } from '../hooks'
import type { ProjectListItem } from '@/shared/api/types'

export function ProjectListPage() {
  const { data: me } = useMe()
  const logout = useLogout()
  const { data, isPending, isError, error } = useProjectList()

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink">
      {/* subtle background glow */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-paper/5 blur-3xl" />

      {/* navbar */}
      <header className="relative border-b border-paper/10 px-6 py-5 lg:px-12">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            {me && (
              <span className="font-body text-sm text-paper/60">{me.name}</span>
            )}
            <Button
              variant="secondary"
              className="border-paper/20 text-paper/80 hover:bg-paper/10"
              onClick={() => logout.mutate()}
            >
              로그아웃
            </Button>
          </div>
        </div>
      </header>

      {/* main */}
      <main className="relative mx-auto max-w-5xl px-6 py-10 lg:px-12">
        <div className="mb-8 space-y-0.5">
          <p className="font-display text-[11px] tracking-[0.2em] text-draft uppercase">
            내 프로젝트
          </p>
          <h1 className="font-body text-xl font-bold tracking-tight text-paper">
            참여 중인 프로젝트
          </h1>
        </div>

        {isPending && (
          <p className="font-display text-sm text-draft">불러오는 중…</p>
        )}

        {isError && (
          <p className="font-display text-sm text-danger">
            {error instanceof ApiError ? error.message : '프로젝트를 불러오지 못했습니다.'}
          </p>
        )}

        {data && data.projects.length === 0 && <EmptyState />}

        {data && data.projects.length > 0 && (
          <ul className="grid gap-4 sm:grid-cols-2">
            {data.projects.map((project) => (
              <ProjectCard key={project.projectId} project={project} />
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}

function ProjectCard({ project }: { project: ProjectListItem }) {
  return (
    <li className="rounded-2xl bg-paper p-6 shadow-lg transition-shadow hover:shadow-xl">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-body text-base font-bold tracking-tight text-ink">
          {project.title}
        </h2>
        <Badge tone={project.role === 'LEADER' ? 'confirm' : 'neutral'}>
          {project.role === 'LEADER' ? '리더' : '멤버'}
        </Badge>
      </div>
      {project.description && (
        <p className="mt-2 font-body text-sm leading-relaxed text-ink-soft">
          {project.description}
        </p>
      )}
      <div className="mt-4 flex items-center justify-between">
        <Badge tone={project.status === 'ACTIVE' ? 'draft' : 'neutral'}>
          {project.status === 'ACTIVE' ? '진행 중' : '보관됨'}
        </Badge>
        <span className="coord-label text-draft">#{project.projectId}</span>
      </div>
    </li>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-paper/10 bg-paper/5 px-8 py-16 text-center backdrop-blur-sm">
      <p className="font-display text-[11px] tracking-[0.2em] text-draft uppercase">
        x:0 y:0 — 빈 화면
      </p>
      <h2 className="font-body text-lg font-bold tracking-tight text-paper">
        아직 참여 중인 프로젝트가 없습니다
      </h2>
      <p className="max-w-xs font-body text-sm text-paper/60">
        팀 리더로부터 초대 링크를 받아 참여해보세요.
      </p>
    </div>
  )
}
