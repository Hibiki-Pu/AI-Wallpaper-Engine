import type {
  RuntimeJob,
  RuntimeJobInput,
  RuntimeJobOutput,
} from '../types/RuntimeJob'
import type { RuntimeOutputMetadataResponse } from '../types/RuntimeOutputImport'

export const DEFAULT_RUNTIME_HOST_URL = 'http://127.0.0.1:8787'

export interface RuntimeHostHealth {
  ok: boolean
  host?: string
  version?: string
  mode?: string
  supportedJobModes?: string[]
  allowedProviders?: string[]
  realExecutionEnabled?: boolean
  port?: number
  error?: string
}

export interface RuntimeHostClientResult<T> {
  ok: boolean
  data?: T
  error?: string
}

export interface RuntimeUploadedAsset {
  kind: 'sourceImage' | 'drivingVideo'
  path: string
  filename: string
  mimeType: string
  size: number
}

interface RuntimeHostJobRequest {
  providerId: string
  providerKind: RuntimeJobInput['providerKind']
  mode?: RuntimeJobInput['mode']
  runtimeConfig?: RuntimeJobInput['runtimeConfig']
  input: Record<string, unknown>
}

const createHeaders = (token?: string) => ({
  'Content-Type': 'application/json',
  ...(token ? { 'x-runtime-token': token } : {}),
})

const normalizeHostUrl = (hostUrl = DEFAULT_RUNTIME_HOST_URL) =>
  hostUrl.replace(/\/+$/, '')

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('Unable to read runtime asset.'))
    reader.readAsDataURL(blob)
  })

export async function uploadRuntimeAsset(
  blob: Blob,
  kind: RuntimeUploadedAsset['kind'],
  hostUrl = DEFAULT_RUNTIME_HOST_URL,
  token?: string,
): Promise<RuntimeHostClientResult<{ asset: RuntimeUploadedAsset }>> {
  try {
    const response = await fetch(`${normalizeHostUrl(hostUrl)}/api/runtime/assets`, {
      method: 'POST',
      headers: createHeaders(token),
      body: JSON.stringify({ kind, dataUrl: await blobToDataUrl(blob) }),
    })
    const data = (await response.json()) as { asset?: RuntimeUploadedAsset; error?: string }
    if (!response.ok || !data.asset) {
      return { ok: false, error: data.error ?? `Runtime Host returned ${response.status}` }
    }
    return { ok: true, data: { asset: data.asset } }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Runtime asset upload failed.' }
  }
}

export async function checkRuntimeHostHealth(
  hostUrl = DEFAULT_RUNTIME_HOST_URL,
  token?: string,
): Promise<RuntimeHostClientResult<RuntimeHostHealth>> {
  try {
    const response = await fetch(`${normalizeHostUrl(hostUrl)}/api/runtime/health`, {
      headers: createHeaders(token),
    })
    const data = (await response.json()) as RuntimeHostHealth

    if (!response.ok) {
      return {
        ok: false,
        error: data.error ?? `Runtime Host returned ${response.status}`,
      }
    }

    return { ok: true, data }
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unable to reach Runtime Host.',
    }
  }
}

export async function submitRuntimeHostJob(
  jobInput: RuntimeJobInput,
  hostUrl = DEFAULT_RUNTIME_HOST_URL,
  token?: string,
): Promise<RuntimeHostClientResult<{ job: RuntimeJob }>> {
  const request: RuntimeHostJobRequest = {
    providerId: jobInput.providerId,
    providerKind: jobInput.providerKind,
    mode: jobInput.mode,
    runtimeConfig: jobInput.runtimeConfig,
    input: jobInput.payload,
  }

  try {
    const response = await fetch(`${normalizeHostUrl(hostUrl)}/api/runtime/jobs`, {
      method: 'POST',
      headers: createHeaders(token),
      body: JSON.stringify(request),
    })
    const data = (await response.json()) as { job?: RuntimeJob; error?: string }

    if (!response.ok || !data.job) {
      return {
        ok: false,
        error: data.error ?? `Runtime Host returned ${response.status}`,
      }
    }

    return { ok: true, data: { job: data.job } }
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unable to submit Runtime Host job.',
    }
  }
}

export async function getRuntimeHostJob(
  jobId: string,
  hostUrl = DEFAULT_RUNTIME_HOST_URL,
  token?: string,
): Promise<RuntimeHostClientResult<{ job: RuntimeJob }>> {
  try {
    const response = await fetch(
      `${normalizeHostUrl(hostUrl)}/api/runtime/jobs/${jobId}`,
      {
        headers: createHeaders(token),
      },
    )
    const data = (await response.json()) as { job?: RuntimeJob; error?: string }

    if (!response.ok || !data.job) {
      return {
        ok: false,
        error: data.error ?? `Runtime Host returned ${response.status}`,
      }
    }

    return { ok: true, data: { job: data.job } }
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unable to read Runtime Host job.',
    }
  }
}

export async function getRuntimeOutput(
  jobId: string,
  hostUrl = DEFAULT_RUNTIME_HOST_URL,
  token?: string,
): Promise<RuntimeHostClientResult<RuntimeOutputMetadataResponse>> {
  try {
    const response = await fetch(
      `${normalizeHostUrl(hostUrl)}/api/runtime/outputs/${jobId}`,
      {
        headers: createHeaders(token),
      },
    )
    const data = (await response.json()) as RuntimeOutputMetadataResponse

    if (!response.ok || !data.ok) {
      return {
        ok: false,
        error: data.error ?? `Runtime Host returned ${response.status}`,
        data,
      }
    }

    return { ok: true, data }
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unable to read Runtime Host output.',
    }
  }
}

export function getRuntimeOutputVideoUrl(
  jobId: string,
  hostUrl = DEFAULT_RUNTIME_HOST_URL,
): string {
  return `${normalizeHostUrl(hostUrl)}/api/runtime/outputs/${jobId}/video`
}

export async function checkRuntimeOutputAvailability(
  jobId: string,
  hostUrl = DEFAULT_RUNTIME_HOST_URL,
  token?: string,
): Promise<RuntimeHostClientResult<RuntimeOutputMetadataResponse>> {
  return getRuntimeOutput(jobId, hostUrl, token)
}
export async function cancelRuntimeHostJob(
  jobId: string,
  hostUrl = DEFAULT_RUNTIME_HOST_URL,
  token?: string,
): Promise<RuntimeHostClientResult<{ job: RuntimeJob }>> {
  try {
    const response = await fetch(
      `${normalizeHostUrl(hostUrl)}/api/runtime/jobs/${jobId}/cancel`,
      {
        method: 'POST',
        headers: createHeaders(token),
      },
    )
    const data = (await response.json()) as { job?: RuntimeJob; error?: string }

    if (!response.ok || !data.job) {
      return {
        ok: false,
        error: data.error ?? `Runtime Host returned ${response.status}`,
      }
    }

    return { ok: true, data: { job: data.job } }
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unable to cancel Runtime Host job.',
    }
  }
}

export type { RuntimeJobOutput }
