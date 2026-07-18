import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ApiError } from '@/shared/api/client'
import { GlassCard } from '@/shared/ui/GlassCard'
import { Badge } from '@/shared/ui/Badge'
import {
  useConfirmDocument,
  useGenerateFeatureSpec,
  useGeneratePlan,
  useGenerateScreenSpec,
  useStageDocument,
  useUpdateSnapshot,
} from '../hooks'
import { useCreateMeetingNote, useMeetingFileStatus, useUploadMeetingFile } from '@/features/meeting/hooks'
import { useProjectWebSocket } from '@/shared/lib/useProjectWebSocket'
import { useProjectDetail } from '@/features/project/hooks'
import type { StageType } from '@/shared/api/types'

// ── constants ──────────────────────────────────────────────────
const STAGE_ORDER: Exclude<StageType, 'WIREFRAME'>[] = ['PLAN', 'FEATURE_SPEC', 'SCREEN_SPEC']
const STAGE_LABELS: Record<string, string> = {
  PLAN: '기획서',
  FEATURE_SPEC: '기능 명세',
  SCREEN_SPEC: '화면 기획',
}
const STAGE_PREV: Partial<Record<string, Exclude<StageType, 'WIREFRAME'>>> = {
  FEATURE_SPEC: 'PLAN',
  SCREEN_SPEC: 'FEATURE_SPEC',
}

// ── page ───────────────────────────────────────────────────────
export function StagePage() {
  const { projectId, stageType } = useParams<{ projectId: string; stageType: string }>()
  const id = Number(projectId)
  const stage = stageType as Exclude<StageType, 'WIREFRAME'>

  const { data: project } = useProjectDetail(id)
  const isLeader = project?.myRole === 'LEADER'

  const { data: doc, isPending, isError, error, refetch } = useStageDocument(id, stage)
  const confirmDoc = useConfirmDocument(id)
  const updateSnapshot = useUpdateSnapshot(id)
  const { sendDocumentUpdate } = useProjectWebSocket(id)

  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [confirmError, setConfirmError] = useState<string | null>(null)

  const prevStageType = STAGE_PREV[stage] as Exclude<StageType, 'WIREFRAME'> | undefined
  const { data: prevDoc } = useStageDocument(id, prevStageType ?? 'PLAN')

  const handleStartEdit = () => {
    setEditContent(JSON.stringify(doc?.content, null, 2))
    setEditing(true)
  }

  const handleSaveEdit = () => {
    if (!doc) return
    updateSnapshot.mutate(
      { documentId: doc.documentId, content: editContent },
      {
        onSuccess: () => {
          setEditing(false)
          refetch()
          sendDocumentUpdate({ documentId: doc.documentId, stageType: stage })
        },
      },
    )
  }

  const handleConfirm = () => {
    if (!doc) return
    setConfirmError(null)
    confirmDoc.mutate(doc.documentId, {
      onSuccess: () => refetch(),
      onError: (e) => setConfirmError(e instanceof ApiError ? e.message : '확정에 실패했습니다.'),
    })
  }

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* back link */}
      <Link
        to={`/projects/${id}`}
        className="inline-flex items-center gap-1.5 font-display text-base text-white/35 uppercase hover:text-white/65 transition-colors duration-500"
      >
        ← 프로젝트
      </Link>

      {/* stage flow nav */}
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-2">
        {STAGE_ORDER.map((s, i) => (
          <span key={s} className="flex items-baseline gap-2">
            {i > 0 && (
              <span className="font-display text-xl text-white/20 leading-none">→</span>
            )}
            <Link
              to={`/projects/${id}/stages/${s}`}
              className={[
                'transition-all duration-500 leading-none',
                s === stage
                  ? 'font-body text-3xl font-bold tracking-tight text-white'
                  : 'font-body text-xl text-white/30 hover:text-white/60',
              ].join(' ')}
            >
              {STAGE_LABELS[s]}
            </Link>
          </span>
        ))}
        <span className="flex items-baseline gap-2">
          <span className="font-display text-xl text-white/20 leading-none">→</span>
          <Link
            to={`/projects/${id}/wireframes`}
            className="font-body text-xl text-white/30 hover:text-white/60 transition-all duration-500 leading-none"
          >
            와이어프레임
          </Link>
        </span>
      </div>

      {/* action bar */}
      <div className="flex items-center justify-between gap-4">
        {/* status badge */}
        <div className="flex items-center gap-2">
          {doc && (
            <Badge tone={doc.status === 'CONFIRMED' ? 'confirm' : 'draft'}>
              {doc.status === 'CONFIRMED' ? '확정됨' : '초안'}
            </Badge>
          )}
          {doc && (
            <span className="font-display text-base text-white/30">문서 #{doc.documentId}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {doc && doc.status === 'DRAFT' && !editing && (
            <>
              <button
                onClick={handleStartEdit}
                className="h-9 rounded-2xl border border-white/[0.12] bg-white/[0.05] px-4 font-display text-[13px] tracking-wide text-white/60 uppercase transition-all duration-500 hover:bg-white/10 hover:text-white hover:shadow-[0_0_18px_rgba(255,255,255,0.15),0_0_5px_rgba(255,255,255,0.08)]"
              >
                편집
              </button>
              {isLeader && (
                <button
                  onClick={handleConfirm}
                  disabled={confirmDoc.isPending}
                  className="h-9 rounded-2xl bg-white px-4 font-display text-[13px] font-medium tracking-wide text-black uppercase transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  {confirmDoc.isPending ? '확정 중…' : '확정'}
                </button>
              )}
            </>
          )}
          {(isError || !doc) && (
            <button
              onClick={() => setShowGenerateModal(true)}
              className="h-9 rounded-2xl bg-white px-5 font-display text-[13px] font-medium tracking-wide text-black uppercase transition-opacity hover:opacity-90"
            >
              AI 생성
            </button>
          )}
        </div>
      </div>

      {confirmError && <p className="font-display text-sm text-white/50">{confirmError}</p>}

      {/* empty / error state */}
      {isError && (
        <GlassCard className="px-8 py-12 text-center" highlight={false}>
          <p className="font-display text-sm text-white/40">
            {error instanceof ApiError && error.status === 404
              ? '아직 생성된 문서가 없습니다. AI 생성을 눌러 시작하세요.'
              : error instanceof ApiError
              ? error.message
              : '문서를 불러오지 못했습니다.'}
          </p>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="mt-5 h-9 rounded-2xl bg-white px-5 font-display text-[13px] font-medium tracking-wide text-black uppercase transition-opacity hover:opacity-90"
          >
            AI 생성
          </button>
        </GlassCard>
      )}

      {/* document content */}
      {doc && !editing && (
        <GlassCard className="px-8 py-8">
          <DocumentContent content={doc.content} stageType={stage} />
        </GlassCard>
      )}

      {/* editor */}
      {doc && editing && (
        <GlassCard className="px-8 py-6">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="h-[480px] w-full resize-none bg-transparent font-display text-sm leading-relaxed text-white/80 outline-none"
          />
          <div className="mt-4 flex gap-3 border-t border-white/[0.08] pt-4">
            <button
              onClick={() => setEditing(false)}
              className="h-9 rounded-2xl border border-white/[0.12] px-4 font-display text-[13px] tracking-wide text-white/50 uppercase hover:bg-white/[0.05] hover:text-white hover:shadow-[0_0_18px_rgba(255,255,255,0.15),0_0_5px_rgba(255,255,255,0.08)]"
            >
              취소
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={updateSnapshot.isPending}
              className="h-9 rounded-2xl bg-white px-5 font-display text-[13px] font-medium tracking-wide text-black uppercase hover:opacity-90 disabled:opacity-40"
            >
              {updateSnapshot.isPending ? '저장 중…' : '저장'}
            </button>
          </div>
        </GlassCard>
      )}

      {/* re-generate when confirmed — leader only */}
      {doc && doc.status === 'CONFIRMED' && isLeader && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowGenerateModal(true)}
            className="h-9 rounded-2xl border border-white/[0.12] px-5 font-display text-sm text-white/35 uppercase transition-all duration-500 hover:border-white/25 hover:text-white/60"
          >
            재생성
          </button>
        </div>
      )}

      {showGenerateModal && (
        <GenerateModal
          projectId={id}
          stageType={stage}
          prevDocumentId={prevDoc?.documentId}
          onClose={() => setShowGenerateModal(false)}
          onSuccess={() => { setShowGenerateModal(false); refetch() }}
        />
      )}
    </div>
  )
}

// ── document content renderer ──────────────────────────────────
function DocumentContent({ content, stageType }: { content: unknown; stageType: string }) {
  if (typeof content === 'string') {
    return <p className="whitespace-pre-wrap font-body text-sm leading-relaxed text-white/75">{content}</p>
  }
  if (content && typeof content === 'object') {
    return (
      <pre className="whitespace-pre-wrap font-display text-sm leading-relaxed text-white/70 overflow-x-auto">
        {JSON.stringify(content, null, 2)}
      </pre>
    )
  }
  return <p className="font-display text-sm text-white/30">(내용 없음)</p>
}

// ── generate modal ─────────────────────────────────────────────
const noteSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요.'),
  content: z.string().min(1, '회의 내용을 입력해주세요.'),
})
type NoteValues = z.infer<typeof noteSchema>

function GenerateModal({
  projectId,
  stageType,
  prevDocumentId,
  onClose,
  onSuccess,
}: {
  projectId: number
  stageType: Exclude<StageType, 'WIREFRAME'>
  prevDocumentId?: number
  onClose: () => void
  onSuccess: () => void
}) {
  const generatePlan = useGeneratePlan(projectId)
  const generateFeature = useGenerateFeatureSpec(projectId)
  const generateScreen = useGenerateScreenSpec(projectId)
  const createNote = useCreateMeetingNote(projectId)
  const uploadFile = useUploadMeetingFile(projectId)

  const [tab, setTab] = useState<'note' | 'file'>('note')
  const [file, setFile] = useState<File | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [phase, setPhase] = useState<'idle' | 'uploading' | 'transcribing' | 'generating'>('idle')
  const [transcribingFileId, setTranscribingFileId] = useState<number | null>(null)

  const isLoading = phase !== 'idle'

  const { register, handleSubmit, formState: { errors } } = useForm<NoteValues>({
    resolver: zodResolver(noteSchema),
  })

  // ── non-plan stages ──────────────────────────────────────────
  if (stageType !== 'PLAN') {
    const prevLabel = stageType === 'FEATURE_SPEC' ? '기획서' : '기능 명세'
    const generate = stageType === 'FEATURE_SPEC' ? generateFeature : generateScreen

    const handleGenerate = () => {
      if (!prevDocumentId) { setApiError(`먼저 ${prevLabel}를 확정해주세요.`); return }
      setPhase('generating')
      setApiError(null)
      generate.mutate(
        { previousDocumentId: prevDocumentId },
        {
          onSuccess,
          onError: (e) => { setApiError(e instanceof ApiError ? e.message : '생성에 실패했습니다.'); setPhase('idle') },
        },
      )
    }

    return (
      <Modal onClose={onClose}>
        <GlassCard className="w-full max-w-sm px-8 py-8">
          <h2 className="mb-2 font-body text-xl font-bold text-white">
            {STAGE_LABELS[stageType]} 생성
          </h2>
          <p className="mb-6 font-body text-sm text-white/40">
            확정된 {prevLabel}를 기반으로 AI가 자동 생성합니다.
          </p>
          {!prevDocumentId && (
            <div className="mb-4 rounded-2xl border border-white/[0.1] bg-white/[0.04] px-4 py-3">
              <p className="font-display text-[13px] text-white/50">
                {prevLabel}가 아직 확정되지 않았습니다.
              </p>
            </div>
          )}
          {apiError && <p className="mb-4 font-display text-sm text-white/50">{apiError}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="h-10 flex-1 rounded-2xl border border-white/[0.12] font-display text-sm tracking-wide text-white/50 uppercase hover:bg-white/[0.05] hover:text-white hover:shadow-[0_0_18px_rgba(255,255,255,0.15),0_0_5px_rgba(255,255,255,0.08)]">취소</button>
            <button
              onClick={handleGenerate}
              disabled={!prevDocumentId || isLoading}
              className="h-10 flex-1 rounded-2xl bg-white font-display text-sm font-medium tracking-wide text-black uppercase hover:opacity-90 disabled:opacity-40"
            >
              {phase === 'generating' ? '생성 중…' : 'AI 생성'}
            </button>
          </div>
        </GlassCard>
      </Modal>
    )
  }

  // ── PLAN: note or file ───────────────────────────────────────
  const triggerGeneratePlan = (sourceType: 'MEETING_NOTE' | 'MEETING_FILE', sourceId: number) => {
    setPhase('generating')
    generatePlan.mutate(
      { sourceType, sourceId },
      {
        onSuccess,
        onError: (e) => { setApiError(e instanceof ApiError ? e.message : '기획서 생성 실패'); setPhase('idle') },
      },
    )
  }

  const onSubmitNote = handleSubmit((values) => {
    setPhase('generating')
    setApiError(null)
    createNote.mutate(values, {
      onSuccess: (res) => triggerGeneratePlan('MEETING_NOTE', res.meetingNoteId),
      onError: (e) => { setApiError(e instanceof ApiError ? e.message : '회의록 저장 실패'); setPhase('idle') },
    })
  })

  const onSubmitFile = () => {
    if (!file) return
    setApiError(null)
    setPhase('uploading')
    uploadFile.mutate(file, {
      onSuccess: (res) => {
        if (res.status === 'COMPLETED') {
          triggerGeneratePlan('MEETING_FILE', res.fileId)
        } else if (res.status === 'FAILED') {
          setApiError('파일 변환에 실패했습니다.')
          setPhase('idle')
        } else {
          setTranscribingFileId(res.fileId)
          setPhase('transcribing')
        }
      },
      onError: (e) => { setApiError(e instanceof ApiError ? e.message : '파일 업로드 실패'); setPhase('idle') },
    })
  }

  const phaseLabel: Record<typeof phase, string> = {
    idle: 'AI 생성',
    uploading: '업로드 중…',
    transcribing: '음성 인식 중…',
    generating: '기획서 생성 중…',
  }

  return (
    <Modal onClose={onClose}>
      {/* STT poller — rendered only while transcribing */}
      {phase === 'transcribing' && transcribingFileId && (
        <TranscriptionPoller
          fileId={transcribingFileId}
          onComplete={() => { triggerGeneratePlan('MEETING_FILE', transcribingFileId) }}
          onFailed={() => { setApiError('음성 인식에 실패했습니다.'); setPhase('idle'); setTranscribingFileId(null) }}
        />
      )}

      <GlassCard className="w-full max-w-lg px-8 py-8">
        <h2 className="mb-6 font-body text-xl font-bold text-white">기획서 생성</h2>

        <div className="mb-6 flex rounded-2xl border border-white/[0.1] bg-white/[0.03] p-1">
          {(['note', 'file'] as const).map((t) => (
            <button
              key={t}
              type="button"
              disabled={isLoading}
              onClick={() => setTab(t)}
              className={[
                'flex-1 rounded-lg py-2 font-display text-[13px] tracking-wide uppercase transition-all duration-300',
                tab === t ? 'bg-white/[0.12] text-white' : 'text-white/40 hover:text-white/60',
              ].join(' ')}
            >
              {t === 'note' ? '회의록 텍스트' : '파일 업로드'}
            </button>
          ))}
        </div>

        {/* generating overlay */}
        {isLoading && (
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-white/[0.1] bg-white/[0.04] px-4 py-3">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
            <p className="font-display text-[13px] text-white/60">{phaseLabel[phase]}</p>
          </div>
        )}

        {tab === 'note' && (
          <form onSubmit={onSubmitNote} className="space-y-4">
            <GlassField label="회의 제목" error={errors.title?.message}>
              <input
                disabled={isLoading}
                className="h-11 w-full bg-transparent font-body text-sm text-white outline-none placeholder:text-white/20 disabled:opacity-40"
                placeholder="2026년 7월 18일 기획 회의"
                {...register('title')}
              />
            </GlassField>
            <GlassField label="회의 내용" error={errors.content?.message}>
              <textarea
                disabled={isLoading}
                className="min-h-[160px] w-full resize-none bg-transparent py-3 font-body text-sm text-white outline-none placeholder:text-white/20 disabled:opacity-40"
                placeholder="회의에서 나눈 내용을 자유롭게 입력하세요."
                {...register('content')}
              />
            </GlassField>
            {apiError && <p className="font-display text-sm text-white/50">{apiError}</p>}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} disabled={isLoading} className="h-10 flex-1 rounded-2xl border border-white/[0.12] font-display text-sm tracking-wide text-white/50 uppercase transition-all duration-500 hover:bg-white/[0.05] hover:text-white hover:shadow-[0_0_18px_rgba(255,255,255,0.15),0_0_5px_rgba(255,255,255,0.08)] disabled:opacity-30">취소</button>
              <button type="submit" disabled={isLoading} className="h-10 flex-1 rounded-2xl bg-white font-display text-sm font-medium tracking-wide text-black uppercase hover:opacity-90 disabled:opacity-40">
                {isLoading ? phaseLabel[phase] : 'AI 생성'}
              </button>
            </div>
          </form>
        )}

        {tab === 'file' && (
          <div className="space-y-4">
            <div
              className={[
                'flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-10 transition-all duration-500',
                file ? 'border-white/20 bg-white/[0.07]' : 'border-white/[0.12] bg-white/[0.03]',
                isLoading ? 'pointer-events-none opacity-50' : '',
              ].join(' ')}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setFile(f) }}
            >
              {file ? (
                <>
                  <p className="font-body text-sm text-white">{file.name}</p>
                  <p className="font-display text-[10px] text-white/30">
                    {(file.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                  <button onClick={() => setFile(null)} className="font-display text-[13px] text-white/40 uppercase hover:text-white/60">제거</button>
                </>
              ) : (
                <>
                  <p className="font-body text-sm text-white/40">파일을 드래그하거나</p>
                  <label className="cursor-pointer rounded-lg border border-white/[0.12] px-4 py-2 font-display text-[13px] tracking-wide text-white/60 uppercase hover:bg-white/[0.05] hover:text-white hover:shadow-[0_0_18px_rgba(255,255,255,0.15),0_0_5px_rgba(255,255,255,0.08)]">
                    파일 선택
                    <input type="file" className="hidden" accept="audio/*,video/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f) }} />
                  </label>
                  <p className="font-display text-[10px] text-white/25">음성 / 영상 파일 지원</p>
                </>
              )}
            </div>
            {apiError && <p className="font-display text-sm text-white/50">{apiError}</p>}
            <div className="flex gap-3">
              <button type="button" onClick={onClose} disabled={isLoading} className="h-10 flex-1 rounded-2xl border border-white/[0.12] font-display text-sm tracking-wide text-white/50 uppercase transition-all duration-500 hover:bg-white/[0.05] hover:text-white hover:shadow-[0_0_18px_rgba(255,255,255,0.15),0_0_5px_rgba(255,255,255,0.08)] disabled:opacity-30">취소</button>
              <button onClick={onSubmitFile} disabled={!file || isLoading} className="h-10 flex-1 rounded-2xl bg-white font-display text-sm font-medium tracking-wide text-black uppercase hover:opacity-90 disabled:opacity-40">
                {isLoading ? phaseLabel[phase] : 'AI 생성'}
              </button>
            </div>
          </div>
        )}
      </GlassCard>
    </Modal>
  )
}

// ── STT transcription poller ───────────────────────────────────
// 별도 컴포넌트로 분리해 hooks 조건부 호출 문제를 회피
function TranscriptionPoller({
  fileId,
  onComplete,
  onFailed,
}: {
  fileId: number
  onComplete: () => void
  onFailed: () => void
}) {
  const { data } = useMeetingFileStatus(fileId, true)

  useEffect(() => {
    if (data?.status === 'COMPLETED') onComplete()
    if (data?.status === 'FAILED') onFailed()
  }, [data?.status])

  return null
}

// ── shared sub-components ──────────────────────────────────────
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

function GlassField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="font-display text-[10px] tracking-[0.15em] text-white/35 uppercase">{label}</label>
      <div className="rounded-2xl border border-white/[0.12] bg-white/[0.05] px-4 transition-all focus-within:border-white/50 focus-within:ring-1 focus-within:ring-white/20">
        {children}
      </div>
      {error && <p className="font-display text-[13px] text-white/50">{error}</p>}
    </div>
  )
}
