import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ApiError } from '@/shared/api/client'
import { GlassCard } from '@/shared/ui/GlassCard'
import { Badge } from '@/shared/ui/Badge'
import {
  useCreateInviteLink,
  useProjectDetail,
  useProjectMembers,
  useRemoveMember,
  useTransferLeader,
} from '../hooks'
import { useExportMarkdown } from '@/features/export/hooks'
import { stageApi } from '@/features/stage/api'
import { stageKeys } from '@/features/stage/hooks'
import { useProjectScreens } from '@/features/wireframe/hooks'
import { useProjectWebSocket } from '@/shared/lib/useProjectWebSocket'
import { useEscapeKey } from '@/shared/lib/useEscapeKey'
import type { ProjectMember, StageType } from '@/shared/api/types'

// ── pipeline config ────────────────────────────────────────────
const STAGE_STEPS: { type: StageType; label: string; sublabel: string }[] = [
  { type: 'PLAN', label: '기획서', sublabel: '회의록 → AI 기획' },
  { type: 'FEATURE_SPEC', label: '기능 명세', sublabel: '기획 → 기능 목록' },
  { type: 'SCREEN_SPEC', label: '화면 기획', sublabel: '기능 → 화면 구성' },
  { type: 'WIREFRAME', label: '와이어프레임', sublabel: '화면 → 레이아웃' },
]

type DocStatus = 'loading' | 'none' | 'draft' | 'confirmed'

// ── page ───────────────────────────────────────────────────────
export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const id = Number(projectId)

  const { data: project, isPending, isError, error } = useProjectDetail(id)
  const { data: membersData } = useProjectMembers(id)
  const createInviteLink = useCreateInviteLink()
  const { onlineCount } = useProjectWebSocket(id)

  const [inviteToken, setInviteToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showExport, setShowExport] = useState(false)

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/15 border-t-white/60" />
      </div>
    )
  }

  if (isError || !project) {
    return (
      <GlassCard className="px-8 py-14 text-center">
        <p className="font-display text-sm text-white/40">
          {error instanceof ApiError ? error.message : '프로젝트를 불러오지 못했습니다.'}
        </p>
      </GlassCard>
    )
  }

  const isLeader = project.myRole === 'LEADER'

  const handleInvite = () => {
    if (inviteToken) { copyToClipboard(inviteToken); return }
    createInviteLink.mutate(id, {
      onSuccess: (res) => { setInviteToken(res.inviteToken); copyToClipboard(res.inviteToken) },
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-12">

      {/* ── project header ─────────────────────────────────────── */}
      <div>
        <p className="mb-3 font-display text-[13px] tracking-[0.25em] text-white/25 uppercase">
          프로젝트
        </p>
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-3">
            <h1 className="font-body text-5xl font-bold tracking-tight text-white">
              {project.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={project.status === 'ACTIVE' ? 'confirm' : 'neutral'}>
                {project.status === 'ACTIVE' ? '진행 중' : '보관됨'}
              </Badge>
              <Badge tone="neutral">
                {isLeader ? '리더' : '멤버'}
              </Badge>
              {onlineCount > 0 && (
                <span className="flex items-center gap-1.5 font-display text-sm text-white/35 uppercase">
                  <span className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
                  {onlineCount}명 접속 중
                </span>
              )}
            </div>
            {project.description && (
              <p className="max-w-xl font-body text-base leading-relaxed text-white/50">
                {project.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowExport(true)}
              className="h-11 rounded-2xl border border-white/[0.18] bg-white/[0.05] px-5 font-display text-[13px] tracking-wide text-white/50 uppercase transition-all duration-500 hover:bg-white/10 hover:text-white hover:shadow-[0_0_18px_rgba(255,255,255,0.15),0_0_5px_rgba(255,255,255,0.08)]"
            >
              내보내기
            </button>
            {isLeader && (
              <button
                onClick={handleInvite}
                disabled={createInviteLink.isPending}
                className="h-11 rounded-2xl border border-white/[0.18] bg-white/[0.05] px-5 font-display text-[13px] tracking-wide text-white/50 uppercase transition-all hover:bg-white/10 hover:text-white hover:shadow-[0_0_18px_rgba(255,255,255,0.15),0_0_5px_rgba(255,255,255,0.08)] disabled:opacity-40"
              >
                {copied ? '복사됨 ✓' : createInviteLink.isPending ? '…' : '초대 코드 복사'}
              </button>
            )}
          </div>
        </div>

        {/* invite token */}
        {inviteToken && (
          <div className="mt-4 flex max-w-xl items-center gap-4 rounded-2xl border border-white/[0.12] bg-white/[0.04] px-5 py-3">
            <p className="font-display text-[13px] text-white/25 shrink-0 uppercase">초대 코드</p>
            <p className="min-w-0 flex-1 truncate font-mono text-sm font-medium text-white/80 select-all">
              {inviteToken}
            </p>
            <button
              onClick={() => copyToClipboard(inviteToken)}
              className="shrink-0 font-display text-xs text-white/40 uppercase hover:text-white transition-colors duration-500"
            >
              {copied ? '복사됨' : '복사'}
            </button>
          </div>
        )}
      </div>

      {/* ── meta ───────────────────────────────────────────────── */}
      {(project.goal || project.startDate || project.endDate) && (
        <div className="flex flex-wrap gap-8">
          {project.goal && (
            <div>
              <p className="mb-1 font-display text-xs tracking-[0.15em] text-white/25 uppercase">목표</p>
              <p className="font-body text-sm text-white/60">{project.goal}</p>
            </div>
          )}
          {project.startDate && (
            <div>
              <p className="mb-1 font-display text-xs tracking-[0.15em] text-white/25 uppercase">시작일</p>
              <p className="font-body text-sm text-white/60">{project.startDate}</p>
            </div>
          )}
          {project.endDate && (
            <div>
              <p className="mb-1 font-display text-xs tracking-[0.15em] text-white/25 uppercase">종료일</p>
              <p className="font-body text-sm text-white/60">{project.endDate}</p>
            </div>
          )}
        </div>
      )}

      {/* ── pipeline ───────────────────────────────────────────── */}
      <div>
        <p className="mb-6 font-display text-[13px] tracking-[0.25em] text-white/25 uppercase">
          파이프라인
        </p>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {STAGE_STEPS.map((step, i) =>
            step.type === 'WIREFRAME' ? (
              <WireframeStepCard key={step.type} projectId={id} step={step} index={i} />
            ) : (
              <StageStepCard
                key={step.type}
                projectId={id}
                step={step}
                index={i}
                stageType={step.type as Exclude<StageType, 'WIREFRAME'>}
              />
            ),
          )}
        </div>
      </div>

      {/* ── members ────────────────────────────────────────────── */}
      {membersData && membersData.members.length > 0 && (
        <div>
          <p className="mb-4 font-display text-[13px] tracking-[0.25em] text-white/25 uppercase">
            멤버 {membersData.members.length}명
          </p>
          <div className="flex flex-wrap gap-3">
            {membersData.members.map((m) => (
              <MemberCard
                key={m.userId}
                member={m}
                projectId={id}
                isCurrentLeader={isLeader}
              />
            ))}
          </div>
        </div>
      )}

      {showExport && <ExportModal projectId={id} onClose={() => setShowExport(false)} />}
    </div>
  )
}

// ── member card with … dropdown ────────────────────────────────
function MemberCard({
  member: m,
  projectId,
  isCurrentLeader,
}: {
  member: ProjectMember
  projectId: number
  isCurrentLeader: boolean
}) {
  const transferLeader = useTransferLeader(projectId)
  const removeMember = useRemoveMember(projectId)

  const [menuOpen, setMenuOpen] = useState(false)
  const [confirm, setConfirm] = useState<'transfer' | 'remove' | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const handleTransfer = () => {
    transferLeader.mutate(m.userId, { onSuccess: () => setConfirm(null) })
  }

  const handleRemove = () => {
    removeMember.mutate(m.userId, { onSuccess: () => setConfirm(null) })
  }

  const canManage = isCurrentLeader && m.role !== 'LEADER'

  return (
    <>
      {/* wrapper는 overflow-hidden 없이 relative만 — 드롭다운이 GlassCard 바깥에 렌더링됨 */}
      <div ref={menuRef} className="relative">
        <GlassCard className="flex items-center gap-4 px-5 py-4" highlight={false}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 font-body text-sm font-bold text-white">
            {m.name[0]}
          </div>
          <div className="min-w-0">
            <p className="font-body text-sm font-medium text-white">{m.name}</p>
            <p className="font-display text-xs text-white/30">{m.loginId}</p>
          </div>
          <Badge tone={m.role === 'LEADER' ? 'confirm' : 'neutral'}>
            {m.role === 'LEADER' ? '리더' : '멤버'}
          </Badge>

          {canManage && (
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-white/[0.1] font-display text-[13px] leading-none text-white/35 transition-all duration-500 hover:border-white/25 hover:text-white/70"
            >
              ···
            </button>
          )}
        </GlassCard>

        {/* GlassCard 바깥에 렌더 → overflow-hidden에 의해 잘리지 않음 */}
        {canManage && menuOpen && (
          <div className="absolute right-0 top-full z-20 mt-1.5 min-w-[140px] overflow-hidden rounded-2xl border border-white/[0.14] bg-[#1c1c1c] shadow-xl backdrop-blur-xl">
            <button
              onClick={() => { setMenuOpen(false); setConfirm('transfer') }}
              className="block w-full px-4 py-2.5 text-left font-display text-[13px] tracking-wide text-white/60 uppercase hover:bg-white/[0.06] hover:text-white transition-colors duration-300"
            >
              권한 넘기기
            </button>
            <div className="mx-3 h-px bg-white/[0.06]" />
            <button
              onClick={() => { setMenuOpen(false); setConfirm('remove') }}
              className="block w-full px-4 py-2.5 text-left font-display text-[13px] tracking-wide text-white/40 uppercase hover:bg-white/[0.06] hover:text-white/70 transition-colors"
            >
              멤버 제거
            </button>
          </div>
        )}
      </div>

      {/* transfer confirmation modal */}
      {confirm === 'transfer' && (
        <ConfirmModal
          title={`${m.name}님을 리더로 지정하시겠습니까?`}
          description="현재 리더 권한이 해당 멤버에게 넘어가며 되돌릴 수 없습니다."
          confirmLabel="리더로 지정"
          loading={transferLeader.isPending}
          onConfirm={handleTransfer}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* remove confirmation modal */}
      {confirm === 'remove' && (
        <ConfirmModal
          title={`${m.name}님을 프로젝트에서 제거하시겠습니까?`}
          description="제거된 멤버는 다시 초대받아야 참여할 수 있습니다."
          confirmLabel="제거"
          loading={removeMember.isPending}
          onConfirm={handleRemove}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  )
}

// ── confirm modal ──────────────────────────────────────────────
function ConfirmModal({
  title,
  description,
  confirmLabel,
  loading,
  onConfirm,
  onCancel,
}: {
  title: string
  description: string
  confirmLabel: string
  loading: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  useEscapeKey(onCancel)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <GlassCard className="w-full max-w-sm px-8 py-8">
        <p className="font-body text-base font-bold text-white">{title}</p>
        <p className="mt-2 mb-7 font-body text-sm text-white/45 leading-relaxed">{description}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="h-10 flex-1 rounded-2xl border border-white/[0.12] font-display text-[12px] tracking-wide text-white/50 uppercase hover:bg-white/[0.05] hover:text-white disabled:opacity-30"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="h-10 flex-1 rounded-2xl bg-white font-display text-[12px] font-medium tracking-wide text-black uppercase hover:opacity-90 disabled:opacity-40"
          >
            {loading ? '처리 중…' : confirmLabel}
          </button>
        </div>
      </GlassCard>
    </div>
  )
}

// ── stage step card ────────────────────────────────────────────
function StageStepCard({
  projectId, step, index, stageType,
}: {
  projectId: number
  step: { type: StageType; label: string; sublabel: string }
  index: number
  stageType: Exclude<StageType, 'WIREFRAME'>
}) {
  const { data, isPending, isError } = useQuery({
    queryKey: stageKeys.document(projectId, stageType),
    queryFn: ({ signal }) => stageApi.getDocument(projectId, stageType, signal),
    retry: false,
  })

  const status: DocStatus = isPending
    ? 'loading'
    : isError
    ? 'none'
    : data?.status === 'CONFIRMED'
    ? 'confirmed'
    : 'draft'

  return (
    <Link to={`/projects/${projectId}/stages/${step.type}`} className={status === 'none' ? 'opacity-55' : ''}>
      <div className={[
        'relative overflow-hidden rounded-2xl backdrop-blur-2xl',
        'border group flex h-full flex-col p-6 transition-all duration-700',
        status === 'confirmed'
          ? 'border-white/[0.38] bg-white/[0.09] shadow-[0_8px_40px_rgba(0,0,0,0.55),0_0_24px_rgba(255,255,255,0.06),inset_0_1px_0_rgba(255,255,255,0.18)]'
          : status === 'draft'
          ? 'border-white/[0.22] bg-white/[0.07] shadow-[0_8px_40px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.12)]'
          : 'border-white/[0.12] bg-white/[0.04] shadow-[0_8px_40px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.08)]',
        'hover:border-white/35 hover:bg-white/[0.09] hover:shadow-[0_8px_40px_rgba(0,0,0,0.6),0_0_60px_rgba(255,255,255,0.18),0_0_20px_rgba(255,255,255,0.12),inset_0_1px_0_rgba(255,255,255,0.22)]',
      ].join(' ')}>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b from-white/20 via-white/5 to-transparent" />
        <div className="mb-6 flex items-center justify-between">
          <span className="font-display text-xs text-white/25">
            {String(index + 1).padStart(2, '0')}
          </span>
          <StatusDot status={status} />
        </div>
        <p className="mb-1 font-body text-base font-bold text-white">{step.label}</p>
        <p className="mb-5 font-body text-sm text-white/35">{step.sublabel}</p>
        <div className="mt-auto flex items-center justify-between">
          <StatusLabel status={status} />
          <span className="font-display text-base text-white/20 transition-colors duration-700 group-hover:text-white/55">→</span>
        </div>
      </div>
    </Link>
  )
}

// ── wireframe step card ────────────────────────────────────────
function WireframeStepCard({
  projectId, step, index,
}: {
  projectId: number
  step: { type: StageType; label: string; sublabel: string }
  index: number
}) {
  const { data: screens, isPending } = useProjectScreens(projectId)
  const hasWireframe = screens?.some((s) => s.wireframe !== null)

  const status: DocStatus = isPending
    ? 'loading'
    : hasWireframe
    ? 'confirmed'
    : screens?.length
    ? 'draft'
    : 'none'

  return (
    <Link to={`/projects/${projectId}/wireframes`} className={status === 'none' ? 'opacity-55' : ''}>
      <div className={[
        'relative overflow-hidden rounded-2xl backdrop-blur-2xl',
        'border group flex h-full flex-col p-6 transition-all duration-700',
        status === 'confirmed'
          ? 'border-white/[0.38] bg-white/[0.09] shadow-[0_8px_40px_rgba(0,0,0,0.55),0_0_24px_rgba(255,255,255,0.06),inset_0_1px_0_rgba(255,255,255,0.18)]'
          : status === 'draft'
          ? 'border-white/[0.22] bg-white/[0.07] shadow-[0_8px_40px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.12)]'
          : 'border-white/[0.12] bg-white/[0.04] shadow-[0_8px_40px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.08)]',
        'hover:border-white/35 hover:bg-white/[0.09] hover:shadow-[0_8px_40px_rgba(0,0,0,0.6),0_0_60px_rgba(255,255,255,0.18),0_0_20px_rgba(255,255,255,0.12),inset_0_1px_0_rgba(255,255,255,0.22)]',
      ].join(' ')}>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b from-white/20 via-white/5 to-transparent" />
        <div className="mb-6 flex items-center justify-between">
          <span className="font-display text-xs text-white/25">
            {String(index + 1).padStart(2, '0')}
          </span>
          <StatusDot status={status} />
        </div>
        <p className="mb-1 font-body text-base font-bold text-white">{step.label}</p>
        <p className="mb-5 font-body text-sm text-white/35">{step.sublabel}</p>
        <div className="mt-auto flex items-center justify-between">
          <StatusLabel status={status} />
          <span className="font-display text-base text-white/20 transition-colors duration-700 group-hover:text-white/55">→</span>
        </div>
      </div>
    </Link>
  )
}

// ── status ui ──────────────────────────────────────────────────
function StatusDot({ status }: { status: DocStatus }) {
  if (status === 'loading') return <div className="h-2 w-2 animate-pulse rounded-full bg-white/20" />
  if (status === 'confirmed') return (
    <span className="h-2 w-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
  )
  if (status === 'draft') return <span className="h-2 w-2 rounded-full border border-white/40 bg-transparent" />
  return <span className="h-2 w-2 rounded-full bg-white/15" />
}

function StatusLabel({ status }: { status: DocStatus }) {
  const map: Record<DocStatus, { text: string; cls: string }> = {
    loading: { text: '…', cls: 'text-white/20' },
    none: { text: '미생성', cls: 'text-white/20' },
    draft: { text: '초안', cls: 'text-white/45' },
    confirmed: { text: '확정됨', cls: 'text-white/80' },
  }
  const { text, cls } = map[status]
  return <span className={`font-display text-xs uppercase ${cls}`}>{text}</span>
}

// ── export modal ───────────────────────────────────────────────
function ExportModal({ projectId, onClose }: { projectId: number; onClose: () => void }) {
  useEscapeKey(onClose)

  const { data, isPending, isError, error, refetch } = useExportMarkdown(projectId, true)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (!data) return
    navigator.clipboard.writeText(data)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    if (!data) return
    const blob = new Blob([data], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `project-${projectId}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* 직접 glass 스타일 적용 — GlassCard의 overflow-hidden이 스크롤을 방해하므로 raw div 사용 */}
      <div className="relative flex w-full max-w-lg flex-col max-h-[78vh] overflow-hidden rounded-2xl border border-white/[0.18] bg-white/[0.06] backdrop-blur-2xl shadow-[0_8px_40px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.14)]">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b from-white/20 via-white/5 to-transparent" />

        {/* header */}
        <div className="shrink-0 flex items-center justify-between border-b border-white/[0.1] px-6 py-4">
          <div>
            <p className="font-display text-xs tracking-[0.15em] text-white/30 uppercase">내보내기</p>
            <p className="font-body text-base font-bold text-white">Markdown 문서</p>
          </div>
          <div className="flex items-center gap-2">
            {data && (
              <>
                <button onClick={handleCopy} className="h-8 rounded-2xl border border-white/[0.15] px-3 font-display text-[13px] tracking-wide text-white/50 uppercase hover:bg-white/[0.05] hover:text-white">
                  {copied ? '복사됨 ✓' : '복사'}
                </button>
                <button onClick={handleDownload} className="h-8 rounded-2xl bg-white px-3 font-display text-[13px] font-semibold tracking-wide text-black uppercase hover:opacity-90">
                  다운로드
                </button>
              </>
            )}
            <button onClick={onClose} className="h-8 w-8 rounded-2xl border border-white/[0.15] text-white/40 transition-all duration-500 hover:bg-white/[0.05] hover:text-white">
              ✕
            </button>
          </div>
        </div>

        {/* scrollable content */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {isPending && (
            <div className="flex h-40 items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/15 border-t-white/60" />
              <p className="font-display text-sm text-white/30">생성 중…</p>
            </div>
          )}
          {isError && (
            <div className="flex h-40 flex-col items-center justify-center gap-4">
              <p className="text-center font-display text-sm text-white/40">
                {error instanceof ApiError && error.status === 409
                  ? '아직 확정된 문서가 부족합니다.'
                  : error instanceof ApiError ? error.message : '내보내기 실패'}
              </p>
              <button onClick={() => refetch()} className="h-8 rounded-2xl border border-white/[0.15] px-4 font-display text-[13px] tracking-wide text-white/50 uppercase hover:text-white">
                다시 시도
              </button>
            </div>
          )}
          {data && (
            <pre className="whitespace-pre-wrap font-display text-[12px] leading-relaxed text-white/60">{data}</pre>
          )}
        </div>
      </div>
    </div>
  )
}
