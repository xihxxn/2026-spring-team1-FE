import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { ApiError } from '@/shared/api/client'
import { Badge } from '@/shared/ui/Badge'
import { GlassCard } from '@/shared/ui/GlassCard'
import { useCreateProject, useJoinProject, useProjectList } from '../hooks'
import type { ProjectListItem } from '@/shared/api/types'

// ── create schema ──────────────────────────────────────────────
const createSchema = z.object({
  title: z.string().min(1, '프로젝트 이름을 입력해주세요.'),
  description: z.string().optional(),
  goal: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})
type CreateValues = z.infer<typeof createSchema>

// ── join schema ────────────────────────────────────────────────
const joinSchema = z.object({
  inviteToken: z.string().min(1, '초대 토큰을 입력해주세요.'),
})
type JoinValues = z.infer<typeof joinSchema>

// ── page ───────────────────────────────────────────────────────
export function ProjectListPage() {
  const { data, isPending, isError, error } = useProjectList()
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)

  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <div className="space-y-1">
          <p className="font-display text-[11px] tracking-[0.2em] text-white/30 uppercase">
            내 프로젝트
          </p>
          <h1 className="font-body text-2xl font-bold tracking-tight text-white">
            참여 중인 프로젝트
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowJoin(true)}
            className="h-9 rounded-xl border border-white/[0.12] bg-white/[0.05] px-4 font-display text-[12px] tracking-wide text-white/60 uppercase transition-all duration-500 hover:bg-white/10 hover:text-white hover:shadow-[0_0_18px_rgba(255,255,255,0.15),0_0_5px_rgba(255,255,255,0.08)]"
          >
            초대 링크 참여
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="h-9 rounded-xl bg-white px-4 font-display text-[12px] font-medium tracking-wide text-black uppercase transition-opacity hover:opacity-90"
          >
            새 프로젝트
          </button>
        </div>
      </div>

      {isPending && (
        <p className="font-display text-sm text-white/30">불러오는 중…</p>
      )}

      {isError && (
        <p className="font-display text-sm text-white/60">
          {error instanceof ApiError ? error.message : '프로젝트를 불러오지 못했습니다.'}
        </p>
      )}

      {data && data.projects.length === 0 && <EmptyState onCreateClick={() => setShowCreate(true)} />}

      {data && data.projects.length > 0 && (
        <ul className="columns-1 gap-7 sm:columns-2 lg:columns-3">
          {data.projects.map((project) => (
            <ProjectCard key={project.projectId} project={project} />
          ))}
        </ul>
      )}

      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} />}
      {showJoin && <JoinProjectModal onClose={() => setShowJoin(false)} />}
    </div>
  )
}

// ── project card ───────────────────────────────────────────────
function ProjectCard({ project }: { project: ProjectListItem }) {
  return (
    <li className="mb-7 break-inside-avoid">
      <Link to={`/projects/${project.projectId}`}>
        <GlassCard className="p-6 transition-all duration-700 hover:bg-white/[0.1] hover:border-white/30 hover:shadow-[0_8px_40px_rgba(0,0,0,0.6),0_0_60px_rgba(255,255,255,0.18),0_0_20px_rgba(255,255,255,0.12),inset_0_1px_0_rgba(255,255,255,0.22)]">
          <div className="flex items-start justify-between gap-3">
            <h2 className="min-w-0 flex-1 font-body text-base font-bold tracking-tight text-white">
              {project.title}
            </h2>
            <Badge tone={project.role === 'LEADER' ? 'confirm' : 'neutral'} className="shrink-0 whitespace-nowrap">
              {project.role === 'LEADER' ? '리더' : '멤버'}
            </Badge>
          </div>
          {project.description && (
            <p className="mt-2 line-clamp-2 font-body text-sm leading-relaxed text-white/50">
              {project.description}
            </p>
          )}
          <div className="mt-4 flex items-center justify-between">
            <Badge tone={project.status === 'ACTIVE' ? 'draft' : 'neutral'}>
              {project.status === 'ACTIVE' ? '진행 중' : '보관됨'}
            </Badge>
            <span className="font-display text-[10px] text-white/20">#{project.projectId}</span>
          </div>
        </GlassCard>
      </Link>
    </li>
  )
}

// ── empty state ────────────────────────────────────────────────
function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <GlassCard className="flex flex-col items-center gap-4 px-8 py-20 text-center" highlight={false}>
      <p className="font-display text-[11px] tracking-[0.2em] text-white/20 uppercase">
        빈 화면
      </p>
      <h2 className="font-body text-xl font-bold tracking-tight text-white">
        아직 참여 중인 프로젝트가 없습니다
      </h2>
      <p className="max-w-sm font-body text-sm text-white/40">
        새 프로젝트를 만들거나 팀 리더에게 초대 링크를 받아 참여하세요.
      </p>
      <button
        onClick={onCreateClick}
        className="mt-2 h-10 rounded-xl bg-white px-6 font-display text-[12px] font-medium tracking-wide text-black uppercase transition-opacity hover:opacity-90"
      >
        첫 프로젝트 만들기
      </button>
    </GlassCard>
  )
}

// ── glass modal wrapper ────────────────────────────────────────
function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {children}
    </div>
  )
}

// ── input wrapper ──────────────────────────────────────────────
function GlassInput({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="font-display text-[10px] tracking-[0.15em] text-white/35 uppercase">{label}</label>
      <div className="rounded-xl border border-white/[0.12] bg-white/[0.05] px-4 transition-all focus-within:border-white/50 focus-within:bg-white/[0.08] focus-within:ring-1 focus-within:ring-white/20">
        {children}
      </div>
      {error && <p className="font-display text-[11px] text-white/50">{error}</p>}
    </div>
  )
}

// ── create project modal ───────────────────────────────────────
function CreateProjectModal({ onClose }: { onClose: () => void }) {
  const create = useCreateProject()
  const [apiError, setApiError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
  })

  const onSubmit = handleSubmit((values) => {
    setApiError(null)
    create.mutate(values, {
      onSuccess: onClose,
      onError: (e) => setApiError(e instanceof ApiError ? e.message : '프로젝트 생성에 실패했습니다.'),
    })
  })

  return (
    <Modal onClose={onClose}>
      <GlassCard className="w-full max-w-md px-8 py-8">
        <h2 className="mb-6 font-body text-xl font-bold tracking-tight text-white">새 프로젝트</h2>

        <form onSubmit={onSubmit} className="space-y-4">
          <GlassInput label="프로젝트 이름 *" error={errors.title?.message}>
            <input
              className="h-11 w-full bg-transparent font-body text-sm text-white outline-none placeholder:text-white/20"
              placeholder="프로젝트 이름"
              {...register('title')}
            />
          </GlassInput>

          <GlassInput label="설명" error={errors.description?.message}>
            <textarea
              className="min-h-[72px] w-full resize-none bg-transparent py-3 font-body text-sm text-white outline-none placeholder:text-white/20"
              placeholder="프로젝트에 대한 설명"
              {...register('description')}
            />
          </GlassInput>

          <GlassInput label="목표" error={errors.goal?.message}>
            <input
              className="h-11 w-full bg-transparent font-body text-sm text-white outline-none placeholder:text-white/20"
              placeholder="이 프로젝트의 목표"
              {...register('goal')}
            />
          </GlassInput>

          <div className="grid grid-cols-2 gap-3">
            <GlassInput label="시작일" error={errors.startDate?.message}>
              <input
                type="date"
                className="h-11 w-full bg-transparent font-body text-sm text-white outline-none [color-scheme:dark]"
                {...register('startDate')}
              />
            </GlassInput>
            <GlassInput label="종료일" error={errors.endDate?.message}>
              <input
                type="date"
                className="h-11 w-full bg-transparent font-body text-sm text-white outline-none [color-scheme:dark]"
                {...register('endDate')}
              />
            </GlassInput>
          </div>

          {apiError && <p className="font-display text-[12px] text-white/50">{apiError}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 flex-1 rounded-xl border border-white/[0.12] font-display text-[12px] tracking-wide text-white/50 uppercase transition-all duration-500 hover:bg-white/[0.05] hover:text-white hover:shadow-[0_0_18px_rgba(255,255,255,0.15),0_0_5px_rgba(255,255,255,0.08)]"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={create.isPending}
              className="h-10 flex-1 rounded-xl bg-white font-display text-[12px] font-medium tracking-wide text-black uppercase transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {create.isPending ? '만드는 중…' : '만들기'}
            </button>
          </div>
        </form>
      </GlassCard>
    </Modal>
  )
}

// ── join project modal ─────────────────────────────────────────
function JoinProjectModal({ onClose }: { onClose: () => void }) {
  const join = useJoinProject()
  const [apiError, setApiError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<JoinValues>({
    resolver: zodResolver(joinSchema),
  })

  const onSubmit = handleSubmit((values) => {
    setApiError(null)
    join.mutate(values, {
      onSuccess: onClose,
      onError: (e) => setApiError(e instanceof ApiError ? e.message : '참여에 실패했습니다.'),
    })
  })

  return (
    <Modal onClose={onClose}>
      <GlassCard className="w-full max-w-sm px-8 py-8">
        <h2 className="mb-2 font-body text-xl font-bold tracking-tight text-white">초대 링크 참여</h2>
        <p className="mb-6 font-body text-sm text-white/40">리더에게 받은 초대 토큰을 입력하세요.</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <GlassInput label="초대 토큰" error={errors.inviteToken?.message}>
            <input
              className="h-11 w-full bg-transparent font-body text-sm text-white outline-none placeholder:text-white/20"
              placeholder=""
              {...register('inviteToken')}
            />
          </GlassInput>

          {apiError && <p className="font-display text-[12px] text-white/50">{apiError}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 flex-1 rounded-xl border border-white/[0.12] font-display text-[12px] tracking-wide text-white/50 uppercase transition-all duration-500 hover:bg-white/[0.05] hover:text-white hover:shadow-[0_0_18px_rgba(255,255,255,0.15),0_0_5px_rgba(255,255,255,0.08)]"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={join.isPending}
              className="h-10 flex-1 rounded-xl bg-white font-display text-[12px] font-medium tracking-wide text-black uppercase transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {join.isPending ? '참여 중…' : '참여하기'}
            </button>
          </div>
        </form>
      </GlassCard>
    </Modal>
  )
}
