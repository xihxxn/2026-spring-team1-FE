import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '@/shared/api/client'
import { Button } from '@/shared/ui/Button'
import { Field } from '@/shared/ui/Field'
import { Input } from '@/shared/ui/Input'
import { useSignup } from '../hooks'

const schema = z.object({
  loginId: z.string().min(1, '아이디를 입력해주세요.'),
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
  name: z.string().min(1, '이름을 입력해주세요.'),
})

type FormValues = z.infer<typeof schema>

export function SignupPage() {
  const navigate = useNavigate()
  const signup = useSignup()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = handleSubmit((values) => {
    setFormError(null)
    signup.mutate(values, {
      onSuccess: () => navigate('/login', { replace: true }),
      onError: (error) => {
        setFormError(error instanceof ApiError ? error.message : '회원가입에 실패했습니다.')
      },
    })
  })

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-ink px-16 py-14 text-paper lg:flex lg:flex-col">
        <span className="coord-label text-draft">x:0 y:0</span>

        <div className="mt-24 max-w-md space-y-6">
          <p className="font-display text-[11px] tracking-[0.2em] text-draft uppercase">
            Team1 · 회의록에서 화면까지
          </p>
          <h1 className="font-body text-[42px] leading-[1.2] font-bold tracking-tight">
            첫 좌표를
            <br />
            찍는 순간
          </h1>
          <p className="max-w-xs font-body text-[15px] leading-relaxed text-paper/70">
            계정을 만들면 팀 프로젝트에 참여하거나, 새 프로젝트를 만들어 회의록
            등록부터 시작할 수 있습니다.
          </p>
        </div>

        <ol className="mt-auto flex gap-6 border-t border-paper/10 pt-6 font-display text-[11px] tracking-wide text-draft uppercase">
          {['기획서', '기능 명세', '화면 기획', '와이어프레임'].map((s, i) => (
            <li key={s} className="flex items-center gap-2">
              <span className="text-paper/40">{String(i).padStart(2, '0')}</span>
              {s}
            </li>
          ))}
        </ol>

        <span className="absolute right-16 bottom-14 coord-label text-draft">
          x:560 y:640
        </span>
      </div>

      <div className="flex items-center justify-center px-6 py-16">
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-7">
          <div className="space-y-1.5">
            <h2 className="font-body text-[28px] font-bold tracking-tight text-ink">
              회원가입
            </h2>
            <p className="font-body text-sm text-ink-soft">
              몇 가지만 입력하면 바로 시작할 수 있어요.
            </p>
          </div>

          <div className="space-y-4">
            <Field label="아이디" error={errors.loginId?.message} coord="field:01">
              <Input autoComplete="username" {...register('loginId')} />
            </Field>

            <Field label="비밀번호" error={errors.password?.message} coord="field:02">
              <Input
                type="password"
                autoComplete="new-password"
                {...register('password')}
              />
            </Field>

            <Field label="이름" error={errors.name?.message} coord="field:03">
              <Input {...register('name')} />
            </Field>
          </div>

          {formError && (
            <p className="font-display text-[13px] text-danger" role="alert">
              {formError}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={signup.isPending}>
            {signup.isPending ? '만드는 중…' : '회원가입'}
          </Button>

          <p className="text-center font-body text-sm text-ink-soft">
            이미 계정이 있나요?{' '}
            <Link to="/login" className="text-ink underline underline-offset-4">
              로그인
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
