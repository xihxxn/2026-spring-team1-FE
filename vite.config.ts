import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// 백엔드(localhost:8081)로 프록시하는 경로 접두사 목록.
// 세션 쿠키가 httpOnly + SameSite=Lax라, 개발 중에는 프론트 dev 서버와
// 동일 출처로 보이도록 프록시해서 쿠키/CORS 문제를 없앤다.
const backendPaths = [
  '/auth',
  '/projects',
  '/screens',
  '/wireframe',
  '/stage-documents',
  '/meeting-files',
  '/v3/api-docs',
  '/swagger-ui',
]

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      // WebSocket — ws: true 로 업그레이드 헤더를 올바르게 포워딩
      '/ws': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        ws: true,
      },
      // REST API — Accept: text/html 요청(브라우저 새로고침)은 SPA로 fallback
      ...Object.fromEntries(
        backendPaths.map((prefix) => [
          prefix,
          {
            target: 'http://localhost:8081',
            changeOrigin: true,
            bypass(req: { headers: Record<string, string | string[] | undefined> }) {
              if ((req.headers['accept'] as string | undefined)?.includes('text/html')) {
                return '/index.html'
              }
            },
          },
        ]),
      ),
    },
  },
})
