import { OFFICIAL_STYLE_PACK } from '../../config/officialStylePack'
import type { StyleCase } from '../../types/StyleCase'
import type { StylePack } from '../../types/StylePack'

const IMPORTED_PACKS_STORAGE_KEY = 'ai-wallpaper-engine.imported-style-packs'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string')

const isValidStyleCase = (value: unknown): value is StyleCase => {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.description === 'string' &&
    typeof value.previewEmoji === 'string' &&
    isStringArray(value.tags) &&
    isStringArray(value.recommendedScene) &&
    isRecord(value.camera) &&
    Array.isArray(value.layers)
  )
}

const isValidStylePack = (value: unknown): value is StylePack => {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.version === 'string' &&
    typeof value.description === 'string' &&
    isStringArray(value.categories) &&
    Array.isArray(value.styleCases) &&
    value.styleCases.every(isValidStyleCase) &&
    (value.author === undefined || typeof value.author === 'string') &&
    (value.createdAt === undefined || typeof value.createdAt === 'string')
  )
}

const loadImportedStylePacks = (): StylePack[] => {
  try {
    const rawPacks = localStorage.getItem(IMPORTED_PACKS_STORAGE_KEY)
    const parsedPacks = rawPacks ? (JSON.parse(rawPacks) as unknown) : []

    return Array.isArray(parsedPacks)
      ? parsedPacks.filter(isValidStylePack)
      : []
  } catch {
    return []
  }
}

const saveImportedStylePacks = (packs: StylePack[]) => {
  localStorage.setItem(IMPORTED_PACKS_STORAGE_KEY, JSON.stringify(packs))
}

export function getInstalledStylePacks(): StylePack[] {
  return [OFFICIAL_STYLE_PACK, ...loadImportedStylePacks()]
}

export function getAllStyleCasesFromPacks(): StyleCase[] {
  return getInstalledStylePacks().flatMap((pack) => pack.styleCases)
}

export function exportStylePack(pack: StylePack) {
  const blob = new Blob([JSON.stringify(pack, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = `${pack.id || 'style-pack'}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function importStylePackFromJson(file: File): Promise<StylePack> {
  const text = await file.text()
  const parsedPack = JSON.parse(text) as unknown

  if (!isValidStylePack(parsedPack)) {
    throw new Error('Invalid style pack JSON.')
  }

  const importedPacks = loadImportedStylePacks()
  const nextPack: StylePack = {
    ...parsedPack,
    createdAt: parsedPack.createdAt ?? new Date().toISOString(),
  }
  const nextPacks = [
    ...importedPacks.filter((pack) => pack.id !== nextPack.id),
    nextPack,
  ]

  saveImportedStylePacks(nextPacks)
  return nextPack
}
