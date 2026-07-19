function normalizeBaseUrl(value: string | undefined): string {
  return value?.trim().replace(/\/+$/, '') ?? ''
}

const apiBaseUrl = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL)
const configuredWebSocketBaseUrl = normalizeBaseUrl(import.meta.env.VITE_WS_BASE_URL)

function withLeadingSlash(path: string): string {
  return path.startsWith('/') ? path : `/${path}`
}

export function apiUrl(path: string): string {
  return `${apiBaseUrl}${withLeadingSlash(path)}`
}

export function webSocketUrl(path: string): string {
  if (configuredWebSocketBaseUrl) {
    return `${configuredWebSocketBaseUrl}${withLeadingSlash(path)}`
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}${withLeadingSlash(path)}`
}
