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
import { useStageDocument } from '@/features/stage/hooks'
import { normalizeScreenSpecContent } from '@/features/stage/lib/screenSpec'
import { useProjectWebSocket } from '@/shared/lib/useProjectWebSocket'
import { useEscapeKey } from '@/shared/lib/useEscapeKey'
import type {
  ScreenSpecContent,
  ScreenWireframe,
  WireframeDsl,
  WireframeElement,
  WireframeRegenerationItem,
} from '@/shared/api/types'

const STAGE_LABELS: Record<string, string> = {
  PLAN: '기획서',
  FEATURE_SPEC: '기능 명세',
  SCREEN_SPEC: '화면 기획',
}
const STAGE_ORDER = ['PLAN', 'FEATURE_SPEC', 'SCREEN_SPEC'] as const

type ScreenSpecification = ScreenSpecContent['screens'][number]

interface ScreenDesign {
  screen: ScreenWireframe
  specification: ScreenSpecification | null
  order: number
}

// ── page ───────────────────────────────────────────────────────
export function WireframePage() {
  const { projectId } = useParams<{ projectId: string }>()
  const id = Number(projectId)

  const { data: project } = useProjectDetail(id)
  const { data: screens, isPending, refetch } = useProjectScreens(id)
  const {
    data: screenSpecDocument,
    isPending: isScreenSpecPending,
    isError: isScreenSpecError,
  } = useStageDocument(id, 'SCREEN_SPEC')
  const { data: regenData, refetch: refetchRegen } = useRegenerationRequests(id)
  useProjectWebSocket(id)
  const generateWireframe = useGenerateWireframe(id)

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)
  const [regenModal, setRegenModal] = useState<ScreenWireframe | null>(null)
  const [viewScreenId, setViewScreenId] = useState<number | null>(null)

  const isLeader = project?.myRole === 'LEADER'
  const normalizedScreenSpec = normalizeScreenSpecContent(screenSpecDocument?.content)
  const specifications = normalizedScreenSpec?.screens ?? []
  const screenSpecMatches =
    screenSpecDocument?.status === 'CONFIRMED' &&
    normalizedScreenSpec !== null &&
    specifications.length === (screens?.length ?? 0) &&
    (screens ?? []).every((screen, index) => screen.screenName === specifications[index]?.name)

  let screenSpecWarning: string | null = null
  if (!isScreenSpecPending && (screens?.length ?? 0) > 0) {
    if (isScreenSpecError || !screenSpecDocument) {
      screenSpecWarning = '확정된 화면 기획 문서를 불러오지 못해 설계 정보 연결을 중단했습니다.'
    } else if (screenSpecDocument.status !== 'CONFIRMED') {
      screenSpecWarning = '화면 기획이 아직 확정되지 않아 와이어프레임과 설계 정보를 연결하지 않았습니다.'
    } else if (!normalizedScreenSpec) {
      screenSpecWarning = '화면 기획 데이터 형식이 올바르지 않아 설계 정보 연결을 중단했습니다.'
    } else if (!screenSpecMatches) {
      screenSpecWarning = '화면 기획과 생성된 화면의 개수 또는 이름이 일치하지 않아 잘못된 설계 정보 연결을 막았습니다.'
    }
  }

  // 확정된 SCREEN_SPEC와 DB 화면의 개수·이름·순서가 모두 맞을 때만 인덱스로 결합한다.
  const screenDesigns: ScreenDesign[] = (screens ?? []).map((screen, index) => ({
    screen,
    specification: screenSpecMatches ? specifications[index] ?? null : null,
    order: index + 1,
  }))
  const viewDesign = screenDesigns.find((design) => design.screen.screenId === viewScreenId) ?? null

  const toggleSelect = (screenId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(screenId)) {
        next.delete(screenId)
      } else {
        next.add(screenId)
      }
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
        className="inline-flex items-center gap-1.5 font-display text-base text-white/60 uppercase hover:text-white/85 transition-colors duration-500"
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
                className="font-body text-xl text-white/55 hover:text-white/85 transition-all duration-500 leading-none"
              >
                {STAGE_LABELS[s]}
              </Link>
            </Fragment>
          ))}
          <span className="font-display text-xl text-white/20 leading-none">→</span>
          <span className="font-body text-3xl font-bold tracking-tight text-white leading-none">
            화면 설계 모음
          </span>
        </div>

        {isLeader && (
          <div className="flex shrink-0 items-center gap-2">
            {selectedIds.size > 0 && (
              <button
                onClick={() => setSelectedIds(new Set())}
                className="h-9 rounded-2xl border border-white/[0.18] px-4 font-display text-[13px] tracking-wide text-white/65 uppercase transition-all duration-500 hover:text-white/90"
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
          <p className="mb-3 font-display text-[13px] tracking-[0.2em] text-white/55 uppercase">
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
        <div className="flex items-center gap-2 py-8 text-white/55">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
          <p className="font-display text-sm">화면 불러오는 중…</p>
        </div>
      )}

      {!isPending && (!screens || screens.length === 0) && (
        <GlassCard className="px-8 py-16 text-center" highlight={false}>
          <p className="font-display text-[13px] tracking-[0.2em] text-white/50 uppercase">빈 화면</p>
          <h2 className="mt-2 font-body text-xl font-bold text-white">아직 화면이 없습니다</h2>
          <p className="mt-2 font-body text-sm text-white/65">
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
            <div>
              <p className="font-display text-base text-white/60 uppercase">
                개발 화면 설계 ({screens.length})
              </p>
              <p className="mt-1 font-body text-sm text-white/55">
                와이어프레임과 화면 목적, 동작, 검증 및 예외 처리를 함께 확인할 수 있습니다.
              </p>
            </div>
            {selectedIds.size > 0 && (
              <p className="font-display text-[13px] text-white/65">
                {selectedIds.size}개 선택됨 — 생성 버튼을 눌러 와이어프레임을 만드세요
              </p>
            )}
          </div>
          {screenSpecWarning && (
            <div
              role="alert"
              className="flex flex-col gap-3 rounded-2xl border border-amber-200/15 bg-amber-100/[0.05] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="font-body text-sm leading-relaxed text-amber-50/60">
                {screenSpecWarning}
              </p>
              <Link
                to={`/projects/${id}/stages/SCREEN_SPEC`}
                className="shrink-0 font-display text-xs text-amber-50/55 underline decoration-amber-50/20 underline-offset-4 hover:text-amber-50/80"
              >
                화면 기획 확인
              </Link>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {screenDesigns.map((design) => (
              <ScreenCard
                key={design.screen.screenId}
                design={design}
                selected={selectedIds.has(design.screen.screenId)}
                onSelect={() => toggleSelect(design.screen.screenId)}
                onView={() => setViewScreenId(design.screen.screenId)}
                onRequestRegen={() => setRegenModal(design.screen)}
                isLeader={isLeader}
              />
            ))}
          </div>
        </>
      )}

      {/* regen history */}
      {historyRequests.length > 0 && (
        <div>
          <p className="mb-3 font-display text-[13px] tracking-[0.2em] text-white/55 uppercase">
            재생성 내역
          </p>
          <GlassCard className="divide-y divide-white/[0.06]" highlight={false}>
            {historyRequests.map((req) => (
              <div key={req.requestId} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="font-body text-sm text-white/70">{req.screenName}</p>
                  <p className="font-display text-xs text-white/55">
                    {req.requestedBy.name} — {req.reason}
                  </p>
                </div>
                <span className={[
                  'font-display text-xs uppercase',
                  req.status === 'APPROVED' ? 'text-white/75' : 'text-white/55',
                ].join(' ')}>
                  {req.status === 'APPROVED' ? '수락됨' : '거절됨'}
                </span>
              </div>
            ))}
          </GlassCard>
        </div>
      )}

      {/* wireframe full view modal */}
      {viewDesign && (
        <ScreenDesignModal
          design={viewDesign}
          allDesigns={screenDesigns}
          onNavigate={setViewScreenId}
          onClose={() => setViewScreenId(null)}
        />
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
  design, selected, onSelect, onView, onRequestRegen, isLeader,
}: {
  design: ScreenDesign
  selected: boolean
  onSelect: () => void
  onView: () => void
  onRequestRegen: () => void
  isLeader: boolean
}) {
  const { screen, specification, order } = design

  return (
    <GlassCard
      className={[
        'p-5 transition-all duration-700',
        selected ? 'border-white/40 bg-white/[0.12]' : 'hover:border-white/30 hover:bg-white/[0.09] hover:shadow-[0_8px_40px_rgba(0,0,0,0.6),0_0_60px_rgba(255,255,255,0.18),0_0_20px_rgba(255,255,255,0.12),inset_0_1px_0_rgba(255,255,255,0.22)]',
      ].join(' ')}
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="min-w-0 pr-3">
          <p className="font-body text-sm font-bold text-white">{screen.screenName}</p>
          {specification?.purpose && (
            <p className="mt-1 line-clamp-2 font-body text-xs leading-relaxed text-white/60">
              {specification.purpose}
            </p>
          )}
        </div>
        <span className="shrink-0 font-display text-sm text-white/55">{order}</span>
      </div>

      {/* wireframe preview */}
      <div onClick={onSelect} className="cursor-pointer">
        {screen.wireframe ? (
          <WireframePreview dsl={screen.wireframe} />
        ) : (
          <div className="flex h-36 items-center justify-center rounded-lg border border-dashed border-white/[0.1] bg-white/[0.02]">
            <p className="font-display text-xs text-white/50 uppercase">와이어프레임 없음</p>
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
                : 'border-white/[0.16] text-white/60 hover:border-white/35 hover:text-white/90 hover:shadow-[0_0_18px_rgba(255,255,255,0.15),0_0_5px_rgba(255,255,255,0.08)]',
            ].join(' ')}
          >
            {selected ? '선택됨' : '선택'}
          </button>
        )}
        {(screen.wireframe || specification) && (
          <button
            onClick={onView}
            className="flex-1 h-8 rounded-2xl border border-white/[0.16] font-display text-xs tracking-wide text-white/60 uppercase transition-all duration-500 hover:border-white/35 hover:text-white/90 hover:shadow-[0_0_18px_rgba(255,255,255,0.15),0_0_5px_rgba(255,255,255,0.08)]"
          >
            설계서 보기
          </button>
        )}
        {!isLeader && screen.wireframe && (
          <button
            onClick={onRequestRegen}
            className="flex-1 h-8 rounded-2xl border border-white/[0.16] font-display text-xs tracking-wide text-white/60 uppercase transition-all duration-500 hover:border-white/35 hover:text-white/90 hover:shadow-[0_0_18px_rgba(255,255,255,0.15),0_0_5px_rgba(255,255,255,0.08)]"
          >
            재생성 요청
          </button>
        )}
      </div>
    </GlassCard>
  )
}

// ── development screen design modal ────────────────────────────
function ScreenDesignModal({
  design,
  allDesigns,
  onNavigate,
  onClose,
}: {
  design: ScreenDesign
  allDesigns: ScreenDesign[]
  onNavigate: (screenId: number) => void
  onClose: () => void
}) {
  useEscapeKey(onClose)

  const { screen, specification, order } = design
  // useWireframe fetches the latest wireframe data for this screen
  const { data: wireframe, isFetching } = useWireframe(screen.screenId, Boolean(screen.wireframe))
  const dsl = wireframe ?? screen.wireframe
  const currentIndex = allDesigns.findIndex((item) => item.screen.screenId === screen.screenId)
  const previous = currentIndex > 0 ? allDesigns[currentIndex - 1] : null
  const next = currentIndex < allDesigns.length - 1 ? allDesigns[currentIndex + 1] : null
  const navigations = specification?.navigation ?? []

  const resolveTarget = (targetScreenId: number, targetScreenName: string) =>
    allDesigns.find((item) => item.specification?.screenId === targetScreenId) ??
    allDesigns.find((item) => item.screen.screenName === targetScreenName)

  const navigateFromTrigger = (triggerId: string) => {
    const navigation = navigations.find((item) => item.triggerId === triggerId)
    if (!navigation) return
    const target = resolveTarget(navigation.targetScreenId, navigation.targetScreenName)
    if (target) onNavigate(target.screen.screenId)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-4 py-6 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex max-h-[94vh] w-full max-w-6xl flex-col gap-4 overflow-hidden">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="font-display text-xs tracking-[0.18em] text-white/55 uppercase">
              화면 {order} / {allDesigns.length}
            </p>
            <p className="mt-1 truncate font-body text-xl font-bold text-white">{screen.screenName}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => previous && onNavigate(previous.screen.screenId)}
              disabled={!previous}
              className="h-8 rounded-lg border border-white/[0.12] px-3 font-display text-xs text-white/45 transition-all hover:bg-white/10 hover:text-white disabled:opacity-20"
            >
              ← 이전
            </button>
            <button
              onClick={() => next && onNavigate(next.screen.screenId)}
              disabled={!next}
              className="h-8 rounded-lg border border-white/[0.12] px-3 font-display text-xs text-white/45 transition-all hover:bg-white/10 hover:text-white disabled:opacity-20"
            >
              다음 →
            </button>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-lg border border-white/[0.12] font-display text-[12px] text-white/50 transition-all duration-500 hover:bg-white/10 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>

        <GlassCard className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]">
            <div className="lg:sticky lg:top-0">
              <p className="mb-3 font-display text-xs tracking-[0.18em] text-white/55 uppercase">
                와이어프레임
              </p>
              {isFetching && !dsl && (
                <div className="flex h-64 items-center justify-center">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
                </div>
              )}
              {dsl && (
                <WireframeFullView
                  dsl={dsl}
                  navigationTriggerIds={new Set(navigations.map((item) => item.triggerId))}
                  onTrigger={navigateFromTrigger}
                />
              )}
              {!isFetching && !dsl && (
                <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.02]">
                  <p className="font-display text-xs text-white/55">와이어프레임이 아직 없습니다</p>
                </div>
              )}
              {dsl && (
                <p className="mt-3 text-center font-display text-xs text-white/55">
                  {dsl.width}×{dsl.height} · {dsl.elements.length}개 요소
                  {navigations.length > 0 && ' · 강조된 요소를 눌러 화면 이동'}
                </p>
              )}
            </div>

            <ScreenSpecificationPanel
              specification={specification}
              resolveTarget={resolveTarget}
              onNavigate={onNavigate}
            />
          </div>
        </GlassCard>
      </div>
    </div>
  )
}

function ScreenSpecificationPanel({
  specification,
  resolveTarget,
  onNavigate,
}: {
  specification: ScreenSpecification | null
  resolveTarget: (targetScreenId: number, targetScreenName: string) => ScreenDesign | undefined
  onNavigate: (screenId: number) => void
}) {
  if (!specification) {
    return (
      <div className="rounded-2xl border border-dashed border-white/[0.1] px-6 py-12 text-center">
        <p className="font-body text-sm text-white/60">연결된 화면 기획 데이터를 찾지 못했습니다.</p>
      </div>
    )
  }

  const components = specification.components ?? []
  const inputs = specification.inputs ?? []
  const buttons = specification.buttons ?? []
  const navigations = specification.navigation ?? []
  const exceptions = specification.exceptions ?? []

  return (
    <div className="min-w-0 space-y-7">
      <section>
        <p className="font-display text-xs tracking-[0.18em] text-white/55 uppercase">화면 목적</p>
        <p className="mt-2 font-body text-sm leading-7 text-white/70">{specification.purpose}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <CountBadge label="구성요소" count={components.length} />
          <CountBadge label="입력" count={inputs.length} />
          <CountBadge label="버튼" count={buttons.length} />
          <CountBadge label="화면 전환" count={navigations.length} />
          <CountBadge label="예외" count={exceptions.length} />
        </div>
      </section>

      <DesignSection title="구성 요소" empty={components.length === 0}>
        {components.map((component) => (
          <DesignItem key={component.id} title={component.name} badge={component.type} id={component.id}>
            {component.description}
          </DesignItem>
        ))}
      </DesignSection>

      <DesignSection title="입력 및 검증" empty={inputs.length === 0}>
        {inputs.map((input) => (
          <DesignItem
            key={input.id}
            title={input.label}
            badge={`${input.inputType}${input.required ? ' · 필수' : ' · 선택'}`}
            id={input.id}
          >
            {[input.placeholder && `안내: ${input.placeholder}`, input.validation && `검증: ${input.validation}`]
              .filter(Boolean)
              .join(' · ') || '별도 검증 조건 없음'}
          </DesignItem>
        ))}
      </DesignSection>

      <DesignSection title="버튼 및 동작" empty={buttons.length === 0}>
        {buttons.map((button) => {
          const navigation = navigations.find((item) => item.triggerId === button.id)
          return (
            <DesignItem key={button.id} title={button.label} badge={button.role} id={button.id}>
              {button.action}
              {navigation && ` · ${navigation.targetScreenName} 화면으로 이동`}
            </DesignItem>
          )
        })}
      </DesignSection>

      <DesignSection title="화면 전환" empty={navigations.length === 0}>
        {navigations.map((navigation, index) => {
          const target = resolveTarget(navigation.targetScreenId, navigation.targetScreenName)
          return (
            <button
              key={`${navigation.triggerId}-${index}`}
              type="button"
              onClick={() => target && onNavigate(target.screen.screenId)}
              disabled={!target}
              className="group w-full rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-3 text-left transition-all hover:border-white/20 hover:bg-white/[0.06] disabled:cursor-default disabled:hover:border-white/[0.08] disabled:hover:bg-white/[0.025]"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-body text-sm font-medium text-white/75">
                  {navigation.triggerId} → {navigation.targetScreenName}
                </span>
                <span className="font-display text-xs text-white/50 group-hover:text-white/80">
                  {target ? '설계서 열기 →' : '연결 정보 없음'}
                </span>
              </div>
              <p className="mt-1 font-body text-xs leading-5 text-white/60">
                {navigation.condition || '별도 조건 없이 이동'}
              </p>
            </button>
          )
        })}
      </DesignSection>

      <DesignSection title="예외 처리" empty={exceptions.length === 0}>
        {exceptions.map((exception, index) => (
          <DesignItem key={`${exception.type}-${index}`} title={exception.type} badge="예외">
            {exception.condition} · {exception.message} · {exception.handling}
          </DesignItem>
        ))}
      </DesignSection>
    </div>
  )
}

function CountBadge({ label, count }: { label: string; count: number }) {
  return (
    <span className="rounded-full border border-white/[0.14] bg-white/[0.05] px-3 py-1 font-display text-xs text-white/60">
      {label} {count}
    </span>
  )
}

function DesignSection({
  title,
  empty,
  children,
}: {
  title: string
  empty: boolean
  children: React.ReactNode
}) {
  return (
    <section>
      <p className="mb-3 font-display text-xs tracking-[0.18em] text-white/55 uppercase">{title}</p>
      {empty ? (
        <p className="rounded-xl border border-dashed border-white/[0.14] px-4 py-5 font-body text-xs text-white/55">
          해당 항목 없음
        </p>
      ) : (
        <div className="space-y-2">{children}</div>
      )}
    </section>
  )
}

function DesignItem({
  title,
  badge,
  id,
  children,
}: {
  title: string
  badge?: string
  id?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-body text-sm font-medium text-white/75">{title}</p>
        {badge && (
          <span className="rounded-full bg-white/[0.09] px-2 py-0.5 font-display text-[10px] uppercase text-white/65">
            {badge}
          </span>
        )}
        {id && <span className="ml-auto font-display text-[10px] text-white/50">{id}</span>}
      </div>
      <p className="mt-1 font-body text-xs leading-5 text-white/60">{children}</p>
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
          <span className="truncate px-0.5 text-white/55" style={{ fontSize: Math.max(7, 9 * scale) }}>
            {el.text || el.type}
          </span>
        </div>
      ))}
    </div>
  )
}

function WireframeFullView({
  dsl,
  navigationTriggerIds,
  onTrigger,
}: {
  dsl: WireframeDsl
  navigationTriggerIds: Set<string>
  onTrigger: (triggerId: string) => void
}) {
  const targetWidth = Math.min(dsl.width || 375, 560)
  const scale = targetWidth / (dsl.width || 375)
  const height = (dsl.height || 667) * scale

  return (
    <div
      className="relative mx-auto overflow-hidden rounded-2xl border border-white/[0.1] bg-white/[0.03]"
      style={{ width: targetWidth, height }}
    >
      {dsl.elements.map((element) => (
        <WireframeElementView
          key={element.id}
          element={element}
          scale={scale}
          interactive={navigationTriggerIds.has(element.id)}
          onClick={() => onTrigger(element.id)}
        />
      ))}
    </div>
  )
}

function WireframeElementView({
  element,
  scale,
  interactive,
  onClick,
}: {
  element: WireframeElement
  scale: number
  interactive: boolean
  onClick: () => void
}) {
  const style = {
    left: element.x * scale,
    top: element.y * scale,
    width: Math.max(element.w * scale, 2),
    height: Math.max(element.h * scale, 2),
  }
  const content = element.text && (
    <span
      className="truncate px-1 text-white/50"
      style={{ fontSize: Math.max(8, 11 * scale) }}
    >
      {element.text}
    </span>
  )

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onClick}
        title="연결된 화면 설계서 열기"
        className="absolute flex items-center justify-center overflow-hidden rounded-md border border-white/55 bg-white/[0.13] shadow-[0_0_16px_rgba(255,255,255,0.12)] transition-all hover:bg-white/[0.22] hover:shadow-[0_0_24px_rgba(255,255,255,0.2)]"
        style={style}
      >
        {content}
      </button>
    )
  }

  return (
    <div
      className="absolute flex items-center justify-center overflow-hidden rounded-md border border-white/20 bg-white/[0.05]"
      style={style}
    >
      {content}
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
        <p className="mt-0.5 truncate font-body text-xs text-white/65">
          {req.requestedBy.name} · {req.reason}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          onClick={() => reject.mutate(req.requestId, { onSuccess: onDone })}
          disabled={busy}
          className="h-7 rounded-lg border border-white/[0.18] px-3 font-display text-xs tracking-wide text-white/65 uppercase transition-all duration-500 hover:bg-white/[0.08] hover:text-white hover:shadow-[0_0_18px_rgba(255,255,255,0.15),0_0_5px_rgba(255,255,255,0.08)] disabled:opacity-40"
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
  useEscapeKey(onClose)

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
        <p className="mb-6 font-body text-sm text-white/65">{screen.screenName}</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="font-display text-xs tracking-[0.15em] text-white/60 uppercase">요청 사유</label>
            <div className="rounded-2xl border border-white/[0.12] bg-white/[0.05] px-4 transition-all focus-within:border-white/50 focus-within:ring-1 focus-within:ring-white/20">
              <textarea
                className="min-h-[80px] w-full resize-none bg-transparent py-3 font-body text-sm text-white outline-none placeholder:text-white/45"
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
