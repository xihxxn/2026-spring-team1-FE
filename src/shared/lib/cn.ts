// 조건부 className 조합용 최소 유틸.
// shadcn/ui 정식 도입(clsx + tailwind-merge) 전까지 사용하는 경량 버전.
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}
