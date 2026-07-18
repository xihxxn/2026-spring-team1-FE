import type { ScreenSpecContent } from '@/shared/api/types'

type ScreenSpecification = ScreenSpecContent['screens'][number]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value)
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function optionalString(value: unknown): string | null {
  if (value == null) return ''
  return isString(value) ? value : null
}

function normalizeArray<T>(
  value: unknown,
  normalizeItem: (item: unknown) => T | null,
): T[] | null {
  if (value == null) return []
  if (!Array.isArray(value)) return null

  const result: T[] = []
  for (const item of value) {
    const normalized = normalizeItem(item)
    if (normalized === null) return null
    result.push(normalized)
  }
  return result
}

function normalizeComponent(
  value: unknown,
): ScreenSpecification['components'][number] | null {
  if (
    !isRecord(value) ||
    !isString(value.id) ||
    !isString(value.type) ||
    !isString(value.name) ||
    !isString(value.description)
  ) {
    return null
  }

  return {
    id: value.id,
    type: value.type,
    name: value.name,
    description: value.description,
  }
}

function normalizeInput(value: unknown): ScreenSpecification['inputs'][number] | null {
  if (
    !isRecord(value) ||
    !isString(value.id) ||
    !isString(value.label) ||
    !isString(value.inputType) ||
    typeof value.required !== 'boolean'
  ) {
    return null
  }

  const placeholder = optionalString(value.placeholder)
  const validation = optionalString(value.validation)
  if (placeholder === null || validation === null) return null

  return {
    id: value.id,
    label: value.label,
    inputType: value.inputType,
    placeholder,
    required: value.required,
    validation,
  }
}

function normalizeButton(value: unknown): ScreenSpecification['buttons'][number] | null {
  if (
    !isRecord(value) ||
    !isString(value.id) ||
    !isString(value.label) ||
    !isString(value.action) ||
    !isString(value.role)
  ) {
    return null
  }

  return {
    id: value.id,
    label: value.label,
    action: value.action,
    role: value.role,
  }
}

function normalizeNavigation(
  value: unknown,
): ScreenSpecification['navigation'][number] | null {
  if (
    !isRecord(value) ||
    !isString(value.triggerId) ||
    !isInteger(value.targetScreenId) ||
    !isString(value.targetScreenName)
  ) {
    return null
  }

  const condition = optionalString(value.condition)
  if (condition === null) return null

  return {
    triggerId: value.triggerId,
    targetScreenId: value.targetScreenId,
    targetScreenName: value.targetScreenName,
    condition,
  }
}

function normalizeException(
  value: unknown,
): ScreenSpecification['exceptions'][number] | null {
  if (
    !isRecord(value) ||
    !isString(value.type) ||
    !isString(value.condition) ||
    !isString(value.message) ||
    !isString(value.handling)
  ) {
    return null
  }

  return {
    type: value.type,
    condition: value.condition,
    message: value.message,
    handling: value.handling,
  }
}

function normalizeScreen(value: unknown): ScreenSpecification | null {
  if (
    !isRecord(value) ||
    !isInteger(value.screenId) ||
    !isString(value.name) ||
    !isString(value.purpose)
  ) {
    return null
  }

  const components = normalizeArray(value.components, normalizeComponent)
  const inputs = normalizeArray(value.inputs, normalizeInput)
  const buttons = normalizeArray(value.buttons, normalizeButton)
  const navigation = normalizeArray(value.navigation, normalizeNavigation)
  const exceptions = normalizeArray(value.exceptions, normalizeException)

  if (!components || !inputs || !buttons || !navigation || !exceptions) return null

  return {
    screenId: value.screenId,
    name: value.name,
    purpose: value.purpose,
    components,
    inputs,
    buttons,
    navigation,
    exceptions,
  }
}

/**
 * API/스냅샷의 unknown SCREEN_SPEC 데이터를 렌더링 가능한 형태로 검증한다.
 * 누락되거나 null인 하위 목록은 빈 배열로 보정하지만, 잘못된 타입의 데이터는
 * 화면에 일부만 섞어 보여주지 않도록 문서 전체를 유효하지 않은 것으로 처리한다.
 */
export function normalizeScreenSpecContent(value: unknown): ScreenSpecContent | null {
  if (!isRecord(value) || !Array.isArray(value.screens)) return null

  const screens = normalizeArray(value.screens, normalizeScreen)
  if (!screens) return null

  const ids = new Set<number>()
  const names = new Set<string>()
  for (const screen of screens) {
    if (ids.has(screen.screenId) || names.has(screen.name)) return null
    ids.add(screen.screenId)
    names.add(screen.name)
  }

  return { screens }
}
