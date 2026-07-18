import { Link, Outlet } from 'react-router-dom'
import { useLogout, useMe } from '@/features/auth/hooks'
import { Logo } from '@/shared/ui/Logo'

export function AppLayout() {
  const { data: me } = useMe()
  const logout = useLogout()

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0c0c0c]">
      {/* purple orb */}
      <div className="orb-main pointer-events-none fixed -top-40 -right-40 h-[900px] w-[900px] rounded-full bg-violet-400/[0.09] blur-[110px]" />
      {/* pink orb */}
      <div className="orb-sub pointer-events-none fixed bottom-0 -left-32 h-[780px] w-[780px] rounded-full bg-pink-300/[0.13] blur-[90px]" />
      {/* sky orb */}
      <div className="orb-sky pointer-events-none fixed bottom-20 -right-20 h-[650px] w-[650px] rounded-full bg-sky-300/[0.11] blur-[100px]" />

      <header className="sticky top-0 z-50 border-b border-white/[0.1] bg-[#0c0c0c]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-5">
          <Link to="/projects" className="transition-opacity duration-500 hover:opacity-75">
            <Logo />
          </Link>
          <div className="flex items-center gap-5">
            {me && (
              <span className="font-body text-sm text-white/35">{me.name}</span>
            )}
            <button
              onClick={() => logout.mutate()}
              className="font-display text-[13px] tracking-[0.1em] text-white/40 uppercase transition-colors duration-500 hover:text-white/70"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-8 py-14">
        <Outlet />
      </main>
    </div>
  )
}
