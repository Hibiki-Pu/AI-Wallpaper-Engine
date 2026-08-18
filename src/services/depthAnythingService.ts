import { DEFAULT_RUNTIME_HOST_URL } from '../runtime/runtimeHostClient'

export interface DepthAnythingHealth {
  ok: boolean
  providerId: 'depth_anything'
  runtimePath: string
  checkpointPath: string
  missing: string[]
}

export interface DepthAnythingResult {
  jobId: string
  depthMapDataUrl: string
  outputPath: string
}

const imageUrlToDataUrl = async (imageUrl: string) => {
  if (imageUrl.startsWith('data:')) return imageUrl
  const response = await fetch(imageUrl)
  if (!response.ok) throw new Error('无法读取当前壁纸图片。')
  const blob = await response.blob()
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('图片编码失败。'))
    reader.readAsDataURL(blob)
  })
}

export async function checkDepthAnythingHealth(
  hostUrl = DEFAULT_RUNTIME_HOST_URL,
  token?: string,
): Promise<DepthAnythingHealth> {
  const response = await fetch(`${hostUrl.replace(/\/+$/, '')}/api/depth-anything/health`, {
    headers: token ? { 'x-runtime-token': token } : undefined,
  })
  const data = (await response.json()) as DepthAnythingHealth & { error?: string }
  if (!response.ok) throw new Error(data.error ?? `Runtime Host returned ${response.status}`)
  return data
}

export async function generateDepthMap(
  imageUrl: string,
  hostUrl = DEFAULT_RUNTIME_HOST_URL,
  token?: string,
): Promise<DepthAnythingResult> {
  const response = await fetch(`${hostUrl.replace(/\/+$/, '')}/api/depth-anything/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'x-runtime-token': token } : {}),
    },
    body: JSON.stringify({ imageDataUrl: await imageUrlToDataUrl(imageUrl) }),
  })
  const data = (await response.json()) as DepthAnythingResult & { error?: string }
  if (!response.ok || !data.depthMapDataUrl) {
    throw new Error(data.error ?? `Depth Anything returned ${response.status}`)
  }
  return data
}
