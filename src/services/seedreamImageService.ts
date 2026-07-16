export const SEEDREAM_MODEL = 'doubao-seedream-5-0-pro-260628'
export const SEEDREAM_API_KEY_STORAGE_KEY = 'ai-wallpaper-engine.seedream-api-key'
export const SEEDREAM_HISTORY_STORAGE_KEY = 'ai-wallpaper-engine.seedream-history'
export const DEFAULT_RUNTIME_HOST_URL = 'http://127.0.0.1:8787'

export interface SeedreamAspectRatio {
  id: string
  label: string
  ratio: string
}

export interface SeedreamHistoryItem {
  id: string
  dataUrl: string
  prompt: string
  mode: 'text' | 'image'
  aspectRatio: string
  aspectRatioLabel: string
  model: string
  createdAt: string
  referenceFileName?: string
}

interface SeedreamRequestOptions {
  apiKey: string
  runtimeHostUrl?: string
  runtimeHostToken?: string
}

const request = async <T>(
  path: string,
  body: Record<string, unknown>,
  options: SeedreamRequestOptions,
): Promise<T> => {
  const response = await fetch(
    `${(options.runtimeHostUrl || DEFAULT_RUNTIME_HOST_URL).replace(/\/$/, '')}${path}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(options.runtimeHostToken
          ? { 'x-runtime-token': options.runtimeHostToken }
          : {}),
      },
      body: JSON.stringify({ ...body, apiKey: options.apiKey }),
    },
  )
  const payload = (await response.json().catch(() => ({}))) as {
    error?: string
    message?: string
  }

  if (!response.ok) {
    throw new Error(payload.message || payload.error || `Request failed (${response.status})`)
  }

  return payload as T
}

export const testSeedreamConnection = (options: SeedreamRequestOptions) =>
  request<{ ok: true; model: string; message: string }>(
    '/api/images/seedream/test',
    {},
    options,
  )

export const generateSeedreamImage = (
  prompt: string,
  options: SeedreamRequestOptions,
  referenceImage?: string,
  aspectRatio?: string,
) =>
  request<{ ok: true; model: string; dataUrl: string }>(
    '/api/images/seedream/generate',
    { prompt, ...(referenceImage ? { referenceImage } : {}), ...(aspectRatio ? { aspectRatio } : {}) },
    options,
  )

export const imageFileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () =>
      typeof reader.result === 'string'
        ? resolve(reader.result)
        : reject(new Error('Unable to read the reference image.'))
    reader.onerror = () => reject(reader.error ?? new Error('Unable to read the reference image.'))
    reader.readAsDataURL(file)
  })

export const dataUrlToImageFile = async (dataUrl: string) => {
  const response = await fetch(dataUrl)
  const blob = await response.blob()
  const extension = blob.type.includes('jpeg') ? 'jpg' : blob.type.includes('webp') ? 'webp' : 'png'
  return new File([blob], `seedream-${Date.now()}.${extension}`, { type: blob.type })
}

export const readSeedreamHistory = (): SeedreamHistoryItem[] => {
  try {
    const rawHistory = localStorage.getItem(SEEDREAM_HISTORY_STORAGE_KEY)
    if (!rawHistory) return []
    const parsed = JSON.parse(rawHistory)
    return Array.isArray(parsed) ? parsed.slice(0, 12) as SeedreamHistoryItem[] : []
  } catch {
    return []
  }
}

export const writeSeedreamHistory = (history: SeedreamHistoryItem[]) => {
  localStorage.setItem(SEEDREAM_HISTORY_STORAGE_KEY, JSON.stringify(history.slice(0, 12)))
}
