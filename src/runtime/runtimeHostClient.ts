import type {
  RuntimeJob,
  RuntimeJobInput,
  RuntimeJobOutput,
} from '../types/RuntimeJob'

export const DEFAULT_RUNTIME_HOST_URL = 'http://127.0.0.1:8787'

export interface RuntimeHostHealth {
  ok: boolean
  host?: string
  version?: string
  mode?: string
  allowedProviders?: string[]
  error?: string
}

export interface RuntimeHostClientResult<T> {
  ok: boolean
  data?: T
  error?: string
}

interface RuntimeHostJobRequest {
  providerId: string
  providerKind: RuntimeJobInput['providerKind']
  input: Record<string, unknown>
}

const createHeaders = (token?: string) => ({
  'Content-Type': 'application/json',
  ...(token ? { 'x-runtime-token': token } : {}),
})

const normalizeHostUrl = (hostUrl = DEFAULT_RUNTIME_HOST_URL) =>
  hostUrl.replace(/\/+$/, '')

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
