import { Fragment, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ApiError } from '@/shared/api/client'
import { GlassCard } from '@/shared/ui/GlassCard'
import {
  useAcceptRegenerationRequest,
  useCreateRegenerationRequest,
  useGenerateWireframe,
  useProjectScreens,
  useRegenerationRequests,
  useRejectRegenerationRequest,
  useWireframe,
} from '../hooks'
import { useProjectDetail } from '@/features/project/hooks'
import { useProjectWebSocket } from '@/shared/lib/useProjectWebSocket'
import type { ScreenWireframe, WireframeDsl, WireframeRegenerationItem } from '@/shared/api/types'

const STAGE_LABELS: Record<string, string> = {
  PLAN: '기획서',
  FEATURE_SPEC: '기능 명세',
  SCREEN_SPEC: '화면 기획',
}
const STAGE_ORDER = ['PLAN', 'FEATURE_SPEC', 'SCREEN_SPEC'] as const

// ── page ───────────────────────────────────────────────────────
export function WireframePage() {
  const { projectId } = useParams<{ projectId: string }>()
  const id = Number(projectId)

  const { data: project } = useProjectDetail(id)
  const { data: screens, isPending, refetch } = useProjectScreens(id)
  const { data: regenData, refetch: refetchRegen } = useRegenerationRequests(id)
  useProjectWebSocket(id)
  const generateWireframe = useGenerateWireframe(id)

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)
  const [regenModal, setRegenModal] = useState<ScreenWireframe | null>(null)
  const [viewScreen, setViewScreen] = useState<ScreenWireframe | null>(null)

  const isLeader = project?.myRole === 'LEADER'

  const toggleSelect = (screenId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(screenId) ? next.delete(screenId) : next.add(screenId)
      return next
    })
  }

  const handleGenerate = () => {
    const ids =
      selectedIds.size > 0
        ? Array.from(selectedIds)
        : (screens ?? []).map((s) => s.screenId)
    if (ids.length === 0) return
    setGenerating(true)
    setGenError(null)
    generateWireframe.mutate(
      { screenIds: ids },
      {
        onSuccess: () => { setSelectedIds(new Set()); setGenerating(false); refetch() },
        onError: (e) => { setGenError(e instanceof ApiError ? e.message : '생성 실패'); setGenerating(false) },
      },
    )
  }

  const pendingRequests = regenData?.requests.filter((r) => r.status === 'PENDING') ?? []
  const historyRequests = regenData?.requests.filter((r) => r.status !== 'PENDING') ?? []

  return (
    <div className="space-y-8">
      {/* back link */}
      <Link
        to={`/projects/${id}`}
        className="inline-flex items-center gap-1.5 font-display text-base text-white/35 uppercase hover:text-white/65 transition-colors duration-500"
      >
        ← 프로젝트
      </Link>

      {/* stage flow nav + generate button */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-2">
          {STAGE_ORDER.map((s, i) => (
            <Fragment key={s}>
              {i > 0 && (
                <span className="font-display text-xl text-white/20 leading-none">→</span>
              )}
              <Link
                to={`/projects/${id}/stages/${s}`}
                className="font-body text-xl text-white/30 hover:text-white/60 transition-all duration-500 leading-none"
              >
                {STAGE_LABELS[s]}
              </Link>
            </Fragment>
          ))}
          <span className="font-display text-xl text-white/20 leading-none">→</span>
          <span className="font-body text-3xl font-bold tracking-tight text-white leading-none">
            와이어프레임
          </span>
        </div>

        {isLeader && (
          <div className="flex shrink-0 items-center gap-2">
            {selectedIds.size > 0 && (
              <button
                onClick={() => setSelectedIds(new Set())}
                className="h-9 rounded-2xl border border-white/[0.12] px-4 font-display text-[13px] tracking-wide text-white/40 uppercase transition-all duration-500 hover:text-white/70"
              >
                선택 해제
              </button>
            )}
            <button
              onClick={handleGenerate}
              disabled={generating || !screens?.length}
              className="h-9 rounded-2xl bg-white px-5 font-display text-[13px] font-medium tracking-wide text-black uppercase transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {generating
                ? '생성 중…'
                : selectedIds.size > 0
                ? `${selectedIds.size}개 생성`
                : '전체 생성'}
            </button>
          </div>
        )}
      </div>

      {genError && (
        <p className="font-display text-[12px] text-white/50">{genError}</p>
      )}

      {/* pending regen requests */}
      {isLeader && pendingRequests.length > 0 && (
        <div>
          <p className="mb-3 font-display text-[13px] tracking-[0.2em] text-white/25 uppercase">
            재생성 요청 대기 ({pendingRequests.length})
          </p>
          <div className="space-y-2">
            {pendingRequests.map((req) => (
              <RegenerationRequestCard
                key={req.requestId}
                req={req}
                projectId={id}
                onDone={() => { refetchRegen(); refetch() }}
              />
            ))}
          </div>
        </div>
      )}

      {/* screen list */}
      {isPending && (
        <div className="flex items-center gap-2 py-8 text-white/30">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
          <p className="font-display text-sm">화면 불러오는 중…</p>
        </div>
      )}

      {!isPending && (!screens || screens.length === 0) && (
        <GlassCard className="px-8 py-16 text-center" highlight={false}>
          <p className="font-display text-[13px] tracking-[0.2em] text-white/20 uppercase">빈 화면</p>
          <h2 className="mt-2 font-body text-xl font-bold text-white">아직 화면이 없습니다</h2>
          <p className="mt-2 font-body text-sm text-white/40">
            먼저 화면 기획(SCREEN_SPEC)을 확정한 후 와이어프레임을 생성하세요.
          </p>
          <Link
            to={`/projects/${id}/stages/SCREEN_SPEC`}
            className="mt-5 inline-block h-9 rounded-2xl border border-white/[0.12] px-5 font-display text-[13px] leading-9 tracking-wide text-white/60 uppercase transition-all duration-500 hover:bg-white/[0.05] hover:text-white hover:shadow-[0_0_18px_rgba(255,255,255,0.15),0_0_5px_rgba(255,255,255,0.08)]"
          >
            화면 기획으로 이동
          </Link>
        </GlassCard>
      )}

      {screens && screens.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="font-display text-base text-white/35 uppercase">
              화면 ({screens.length})
            </p>
            {selectedIds.size > 0 && (
              <p className="font-display text-[13px] text-white/40">
                {selectedIds.size}개 선택됨 — 생성 버튼을 눌러 와이어프레임을 만드세요
              </p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {screens.map((screen) => (
              <ScreenCard
                key={screen.screenId}
                screen={screen}
                selected={selectedIds.has(screen.screenId)}
                onSelect={() => toggleSelect(screen.screenId)}
                onView={() => setViewScreen(screen)}
                onRequestRegen={() => setRegenModal(screen)}
                isLeader={isLeader}
              />
            ))}
          </div>
        </>
      )}

      {/* regen history */}
      {historyRequests.length > 0 && (
        <div>
          <p className="mb-3 font-display text-[13px] tracking-[0.2em] text-white/25 uppercase">
            재생성 내역
          </p>
          <GlassCard className="divide-y divide-white/[0.06]" highlight={false}>
            {historyRequests.map((req) => (
              <div key={req.requestId} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="font-body text-sm text-white/70">{req.screenName}</p>
                  <p className="font-display text-xs text-white/30">
                    {req.requestedBy.name} — {req.reason}
                  </p>
                </div>
                <span className={[
                  'font-display text-xs uppercase',
                  req.status === 'APPROVED' ? 'text-white/50' : 'text-white/25',
                ].join(' ')}>
                  {req.status === 'APPROVED' ? '수락됨' : '거절됨'}
                </span>
              </div>
            ))}
          </GlassCard>
        </div>
      )}

      {/* wireframe full view modal */}
      {viewScreen && (
        <WireframeViewModal screen={viewScreen} onClose={() => setViewScreen(null)} />
      )}

      {/* regen request modal */}
      {regenModal && (
        <RegenerationRequestModal
          projectId={id}
          screen={regenModal}
          onClose={() => setRegenModal(null)}
          onSuccess={() => { setRegenModal(null); refetchRegen() }}
        />
      )}
    </div>
  )
}

// ── screen card ────────────────────────────────────────────────
function ScreenCard({
  screen, selected, onSelect, onView, onRequestRegen, isLeader,
}: {
  screen: ScreenWireframe
  selected: boolean
  onSelect: () => void
  onView: () => void
  onRequestRegen: () => void
  isLeader: boolean
}) {
  return (
    <GlassCard
      className={[
        'p-5 transition-all duration-700',
        selected ? 'border-white/40 bg-white/[0.12]' : 'hover:border-white/30 hover:bg-white/[0.09] hover:shadow-[0_8px_40px_rgba(0,0,0,0.6),0_0_60px_rgba(255,255,255,0.18),0_0_20px_rgba(255,255,255,0.12),inset_0_1px_0_rgba(255,255,255,0.22)]',
      ].join(' ')}
    >
      <div className="mb-4 flex items-start justify-between">
        <p className="font-body text-sm font-bold text-white">{screen.screenName}</p>
        <span className="font-display text-sm text-white/30">#{screen.screenId}</span>
      </div>

      {/* wireframe preview */}
      <div onClick={onSelect} className="cursor-pointer">
        {screen.wireframe ? (
          <WireframePreview dsl={screen.wireframe} />
        ) : (
          <div className="flex h-36 items-center justify-center rounded-lg border border-dashed border-white/[0.1] bg-white/[0.02]">
            <p className="font-display text-xs text-white/20 uppercase">와이어프레임 없음</p>
          </div>
        )}
      </div>

      {/* action buttons */}
      <div className="mt-3 flex gap-2">
        {isLeader && (
          <button
            onClick={onSelect}
            className={[
              'flex-1 h-8 rounded-2xl border font-display text-xs tracking-wide uppercase transition-all duration-500',
              selected
                ? 'border-white/30 bg-white/10 text-white'
                : 'border-white/[0.1] text-white/30 hover:border-white/30 hover:text-white/60 hover:shadow-[0_0_18px_rgba(255,255,255,0.15),0_0_5px_rgba(255,255,255,0.08)]',
            ].join(' ')}
          >
            {selected ? '선택됨' : '선택'}
          </button>
        )}
        {screen.wireframe && (
          <button
            onClick={onView}
            className="flex-1 h-8 rounded-2xl border border-white/[0.1] font-display text-xs tracking-wide text-white/30 uppercase transition-all duration-500 hover:border-white/30 hover:text-white/60 hover:shadow-[0_0_18px_rgba(255,255,255,0.15),0_0_5px_rgba(255,255,255,0.08)]"
          >
            전체 보기
          </button>
        )}
        {!isLeader && screen.wireframe && (
          <button
            onClick={onRequestRegen}
            className="flex-1 h-8 rounded-2xl border border-white/[0.1] font-display text-xs tracking-wide text-white/30 uppercase transition-all duration-500 hover:border-white/30 hover:text-white/60 hover:shadow-[0_0_18px_rgba(255,255,255,0.15),0_0_5px_rgba(255,255,255,0.08)]"
          >
            재생성 요청
          </button>
        )}
      </div>
    </GlassCard>
  )
}

// ── wireframe full view modal ──────────────────────────────────
function WireframeViewModal({ screen, onClose }: { screen: ScreenWireframe; onClose: () => void }) {
  // useWireframe fetches the latest wireframe data for this screen
  const { data: wireframe, isPending } = useWireframe(screen.screenId)
  const dsl = wireframe ?? screen.wireframe

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col gap-4 overflow-hidden">
        <div className="flex items-center justify-between">
          <p className="font-body text-base font-bold text-white">{screen.screenName}</p>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg border border-white/[0.12] font-display text-[12px] text-white/50 transition-all duration-500 hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>

        <GlassCard className="overflow-auto p-4">
          {isPending && (
            <div className="flex h-64 items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
            </div>
          )}
          {dsl && <WireframeFullView dsl={dsl} />}
        </GlassCard>

        {dsl && (
          <p className="text-center font-display text-xs text-white/25">
            {dsl.type} · {dsl.width}×{dsl.height} · {dsl.elements.length}개 요소
          </p>
        )}
      </div>
    </div>
  )
}

// ── wireframe renderers ────────────────────────────────────────
function WireframePreview({ dsl }: { dsl: WireframeDsl }) {
  const maxWidth = 240
  const scale = maxWidth / (dsl.width || 375)
  const height = Math.min((dsl.height || 667) * scale, 200)

  return (
    <div
      className="relative overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.03]"
      style={{ width: maxWidth, height }}
    >
      {dsl.elements.map((el) => (
        <div
          key={el.id}
          className="absolute flex items-center justify-center overflow-hidden rounded border border-white/[0.15] bg-white/[0.04]"
          style={{
            left: el.x * scale,
            top: el.y * scale,
            width: Math.max(el.w * scale, 4),
            height: Math.max(el.h * scale, 4),
          }}
        >
          <span className="truncate px-0.5 text-white/30" style={{ fontSize: Math.max(7, 9 * scale) }}>
            {el.text || el.type}
          </span>
        </div>
      ))}
    </div>
  )
}

function WireframeFullView({ dsl }: { dsl: WireframeDsl }) {
  const targetWidth = Math.min(dsl.width || 375, 560)
  const scale = targetWidth / (dsl.width || 375)
  const height = (dsl.height || 667) * scale

  return (
    <div
      className="relative mx-auto overflow-hidden rounded-2xl border border-white/[0.1] bg-white/[0.03]"
      style={{ width: targetWidth, height }}
    >
      {dsl.elements.map((el) => (
        <div
          key={el.id}
          className="absolute flex items-center justify-center overflow-hidden rounded-md border border-white/20 bg-white/[0.05]"
          style={{
            left: el.x * scale,
            top: el.y * scale,
            width: Math.max(el.w * scale, 2),
            height: Math.max(el.h * scale, 2),
          }}
        >
          {el.text && (
            <span
              className="truncate px-1 text-white/50"
              style={{ fontSize: Math.max(8, 11 * scale) }}
            >
              {el.text}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

// ── regeneration request card ──────────────────────────────────
function RegenerationRequestCard({ req, projectId, onDone }: {
  req: WireframeRegenerationItem
  projectId: number
  onDone: () => void
}) {
  const accept = useAcceptRegenerationRequest(projectId)
  const reject = useRejectRegenerationRequest(projectId)
  const busy = accept.isPending || reject.isPending

  return (
    <GlassCard className="flex items-center gap-4 px-5 py-4" highlight={false}>
      <div className="min-w-0 flex-1">
        <p className="truncate font-body text-sm font-medium text-white">{req.screenName}</p>
        <p className="mt-0.5 truncate font-body text-xs text-white/40">
          {req.requestedBy.name} · {req.reason}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          onClick={() => reject.mutate(req.requestId, { onSuccess: onDone })}
          disabled={busy}
          className="h-7 rounded-lg border border-white/[0.12] px-3 font-display text-xs tracking-wide text-white/40 uppercase transition-all duration-500 hover:bg-white/[0.05] hover:text-white hover:shadow-[0_0_18px_rgba(255,255,255,0.15),0_0_5px_rgba(255,255,255,0.08)] disabled:opacity-40"
        >
          거절
        </button>
        <button
          onClick={() => accept.mutate(req.requestId, { onSuccess: onDone })}
          disabled={busy}
          className="h-7 rounded-lg bg-white px-3 font-display text-xs font-medium tracking-wide text-black uppercase transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {accept.isPending ? '처리 중…' : '수락'}
        </button>
      </div>
    </GlassCard>
  )
}

// ── regeneration request modal ─────────────────────────────────
const regenSchema = z.object({ reason: z.string().min(1, '사유를 입력해주세요.') })
type RegenValues = z.infer<typeof regenSchema>

function RegenerationRequestModal({ projectId, screen, onClose, onSuccess }: {
  projectId: number
  screen: ScreenWireframe
  onClose: () => void
  onSuccess: () => void
}) {
  const createRegen = useCreateRegenerationRequest(projectId, screen.screenId)
  const [apiError, setApiError] = useState<string | null>(null)
  const { register, handleSubmit, formState: { errors } } = useForm<RegenValues>({
    resolver: zodResolver(regenSchema),
  })

  const onSubmit = handleSubmit((values) => {
    setApiError(null)
    createRegen.mutate(values, {
      onSuccess,
      onError: (e) => setApiError(e instanceof ApiError ? e.message : '요청 실패'),
    })
  })

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <GlassCard className="w-full max-w-sm px-8 py-8">
        <h2 className="mb-1 font-body text-lg font-bold text-white">재생성 요청</h2>
        <p className="mb-6 font-body text-sm text-white/40">{screen.screenName}</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="font-display text-xs tracking-[0.15em] text-white/35 uppercase">요청 사유</label>
            <div className="rounded-2xl border border-white/[0.12] bg-white/[0.05] px-4 transition-all focus-within:border-white/50 focus-within:ring-1 focus-within:ring-white/20">
              <textarea
                className="min-h-[80px] w-full resize-none bg-transparent py-3 font-body text-sm text-white outline-none placeholder:text-white/20"
                placeholder="어떤 점을 개선해주길 원하시나요?"
                {...register('reason')}
              />
            </div>
            {errors.reason && <p className="font-display text-[13px] text-white/50">{errors.reason.message}</p>}
          </div>
          {apiError && <p className="font-display text-[12px] text-white/50">{apiError}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="h-10 flex-1 rounded-2xl border border-white/[0.12] font-display text-[12px] tracking-wide text-white/50 uppercase hover:bg-white/[0.05] hover:text-white hover:shadow-[0_0_18px_rgba(255,255,255,0.15),0_0_5px_rgba(255,255,255,0.08)]">취소</button>
            <button type="submit" disabled={createRegen.isPending} className="h-10 flex-1 rounded-2xl bg-white font-display text-[12px] font-medium tracking-wide text-black uppercase hover:opacity-90 disabled:opacity-40">
              {createRegen.isPending ? '요청 중…' : '요청 보내기'}
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  )
}
