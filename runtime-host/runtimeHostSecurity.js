export const allowedProviders = ['liveportrait', 'depth_anything']

const allowedOrigins = new Set([
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://localhost:5173',
  'http://localhost:5174',
])

const forbiddenCommandKeys = new Set([
  'rawCommand',
  'shellCommand',
  'executeCommand',
  'outputFilename',
  'runtimeOutputPath',
])
const dangerousShellTokens = ['&&', '||', ';', '|', '>', '<']
const runtimeConfigStringKeys = [
  'runtimePath',
  'pythonCommand',
  'entryFile',
  'outputDir',
]

export function getCorsHeaders(origin) {
  const headers = {
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,x-runtime-token',
  }

  if (origin && allowedOrigins.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
  }

  return headers
}

export function isAllowedOrigin(origin) {
  return !origin || allowedOrigins.has(origin)
}

export function isAllowedApiPath(pathname) {
  if (pathname === '/api/images/seedream/test' || pathname === '/api/images/seedream/generate') {
    return true
  }
  if (pathname === '/api/runtime/health') {
    return true
  }

  if (pathname === '/api/runtime/assets') {
    return true
  }

  if (
    pathname === '/api/depth-anything/health' ||
    pathname === '/api/depth-anything/generate'
  ) {
    return true
  }

  if (pathname === '/api/runtime/jobs') {
    return true
  }

  if (/^\/api\/runtime\/jobs\/[^/]+$/.test(pathname)) {
    return true
  }

  if (/^\/api\/runtime\/jobs\/[^/]+\/cancel$/.test(pathname)) {
    return true
  }

  if (/^\/api\/runtime\/outputs\/[^/]+$/.test(pathname)) {
    return true
  }

  return /^\/api\/runtime\/outputs\/[^/]+\/video$/.test(pathname)
}

export function validateRuntimeToken(request) {
  const expectedToken = process.env.RUNTIME_HOST_TOKEN

  if (!expectedToken) {
    return { ok: true }
  }

  const actualToken = request.headers['x-runtime-token']

  return actualToken === expectedToken
    ? { ok: true }
    : { ok: false, message: 'Invalid runtime host token.' }
}

const containsForbiddenCommandKey = (value) => {
  if (!value || typeof value !== 'object') {
    return false
  }

  return Object.entries(value).some(([key, childValue]) => {
    if (forbiddenCommandKeys.has(key)) {
      return true
    }

    return containsForbiddenCommandKey(childValue)
  })
}

const containsDangerousShellToken = (value) =>
  typeof value === 'string' &&
  dangerousShellTokens.some((token) => value.includes(token))

const containsDirectoryTraversal = (value) =>
  typeof value === 'string' && /(^|[\\/])\.\.([\\/]|$)/.test(value)

const validateRuntimeConfig = (runtimeConfig) => {
  if (runtimeConfig === undefined) {
    return { ok: true }
  }

  if (!runtimeConfig || typeof runtimeConfig !== 'object' || Array.isArray(runtimeConfig)) {
    return { ok: false, message: 'runtimeConfig must be an object.' }
  }

  const invalidKey = runtimeConfigStringKeys.find((key) => {
    const value = runtimeConfig[key]
    return value !== undefined && typeof value !== 'string'
  })

  if (invalidKey) {
    return { ok: false, message: `runtimeConfig.${invalidKey} must be a string.` }
  }

  const dangerousKey = runtimeConfigStringKeys.find((key) =>
    containsDangerousShellToken(runtimeConfig[key]),
  )

  if (dangerousKey) {
    return {
      ok: false,
      message: `runtimeConfig.${dangerousKey} contains unsafe shell characters.`,
    }
  }

  const traversalKey = runtimeConfigStringKeys.find((key) =>
    containsDirectoryTraversal(runtimeConfig[key]),
  )

  if (traversalKey) {
    return {
      ok: false,
      message: `runtimeConfig.${traversalKey} contains directory traversal.`,
    }
  }

  return { ok: true }
}

export function validateRuntimeJobRequest(body) {
  if (!body || typeof body !== 'object') {
    return { ok: false, message: 'Request body must be an object.' }
  }

  if (!allowedProviders.includes(body.providerId)) {
    return { ok: false, message: 'Provider is not allowed.' }
  }

  if (
    body.mode !== undefined &&
    body.mode !== 'mock' &&
    body.mode !== 'dryRun' &&
    body.mode !== 'realRun'
  ) {
    return { ok: false, message: 'Runtime job mode must be mock, dryRun or realRun.' }
  }

  if (containsForbiddenCommandKey(body)) {
    return {
      ok: false,
      message:
        'Raw command execution fields and frontend-defined output paths are not allowed.',
    }
  }

  return validateRuntimeConfig(body.runtimeConfig)
}
