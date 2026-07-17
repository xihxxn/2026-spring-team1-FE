import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '@/shared/api/client'
import { Button } from '@/shared/ui/Button'
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
        setFormError(
          error instanceof ApiError ? error.message : '회원가입에 실패했습니다.',
        )
      },
    })
  })

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 rounded-xl border border-gray-200 bg-white p-8 shadow-sm"
      >
        <h1 className="text-xl font-semibold text-gray-900">회원가입</h1>

        <div className="space-y-1">
          <label className="text-sm text-gray-700" htmlFor="loginId">
            아이디
          </label>
          <Input id="loginId" autoComplete="username" {...register('loginId')} />
          {errors.loginId && (
            <p className="text-xs text-red-500">{errors.loginId.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm text-gray-700" htmlFor="password">
            비밀번호
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register('password')}
          />
          {errors.password && (
            <p className="text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm text-gray-700" htmlFor="name">
            이름
          </label>
          <Input id="name" {...register('name')} />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>

        {formError && <p className="text-sm text-red-500">{formError}</p>}

        <Button type="submit" className="w-full" disabled={signup.isPending}>
          {signup.isPending ? '가입 중…' : '회원가입'}
        </Button>

        <p className="text-center text-sm text-gray-500">
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="text-violet-600 hover:underline">
            로그인
          </Link>
        </p>
      </form>
    </div>
  )
}
