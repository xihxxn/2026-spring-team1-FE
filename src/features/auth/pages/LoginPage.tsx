import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '@/shared/api/client'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { useLogin } from '../hooks'

const schema = z.object({
  loginId: z.string().min(1, '아이디를 입력해주세요.'),
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
})

type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const login = useLogin()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = handleSubmit((values) => {
    setFormError(null)
    login.mutate(values, {
      onSuccess: () => navigate('/projects', { replace: true }),
      onError: (error) => {
        setFormError(
          error instanceof ApiError ? error.message : '로그인에 실패했습니다.',
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
        <h1 className="text-xl font-semibold text-gray-900">로그인</h1>

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
            autoComplete="current-password"
            {...register('password')}
          />
          {errors.password && (
            <p className="text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        {formError && <p className="text-sm text-red-500">{formError}</p>}

        <Button type="submit" className="w-full" disabled={login.isPending}>
          {login.isPending ? '로그인 중…' : '로그인'}
        </Button>

        <p className="text-center text-sm text-gray-500">
          계정이 없으신가요?{' '}
          <Link to="/signup" className="text-violet-600 hover:underline">
            회원가입
          </Link>
        </p>
      </form>
    </div>
  )
}
