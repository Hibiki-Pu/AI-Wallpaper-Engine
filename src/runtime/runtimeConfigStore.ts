import type { RuntimeConfig } from '../types/RuntimeConfig'

const STORAGE_KEY = 'ai-wallpaper-engine.runtime-configs'

const now = () => new Date().toISOString()

const createDefaultRuntimeConfig = (providerId: string): RuntimeConfig => {
  const timestamp = now()

  return {
    providerId,
    mode: 'disabled',
    enabled: false,
    runtimePath: '',
    pythonCommand: 'python',
    entryFile: 'inference.py',
    outputDir: '',
    executionMode: 'dryRun',
    runtimeHostUrl: 'http://127.0.0.1:8787',
    runtimeHostToken: '',
    dryRun: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

const canUseLocalStorage = () => typeof localStorage !== 'undefined'

const loadConfigs = (): Record<string, RuntimeConfig> => {
  if (!canUseLocalStorage()) {
    return {}
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    const parsed = stored ? (JSON.parse(stored) as unknown) : {}

    return parsed && typeof parsed === 'object'
      ? (parsed as Record<string, RuntimeConfig>)
      : {}
  } catch {
    return {}
  }
}

const saveConfigs = (configs: Record<string, RuntimeConfig>) => {
  if (!canUseLocalStorage()) {
    return
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(configs))
}

export function getRuntimeConfig(providerId: string): RuntimeConfig {
  return loadConfigs()[providerId] ?? createDefaultRuntimeConfig(providerId)
}

export function setRuntimeConfig(
  providerId: string,
  config: RuntimeConfig,
): RuntimeConfig {
  const configs = loadConfigs()
  const current = configs[providerId]
  const nextConfig: RuntimeConfig = {
    ...config,
    providerId,
    createdAt: current?.createdAt ?? config.createdAt ?? now(),
    updatedAt: now(),
  }

  configs[providerId] = nextConfig
  saveConfigs(configs)
  return nextConfig
}

export function updateRuntimeConfig(
  providerId: string,
  partialConfig: Partial<RuntimeConfig>,
): RuntimeConfig {
  const current = getRuntimeConfig(providerId)

  return setRuntimeConfig(providerId, {
    ...current,
    ...partialConfig,
    providerId,
  })
}

export function resetRuntimeConfig(providerId: string): RuntimeConfig {
  const configs = loadConfigs()
  const nextConfig = createDefaultRuntimeConfig(providerId)
  configs[providerId] = nextConfig
  saveConfigs(configs)
  return nextConfig
}

export function listRuntimeConfigs(): RuntimeConfig[] {
  return Object.values(loadConfigs())
}
