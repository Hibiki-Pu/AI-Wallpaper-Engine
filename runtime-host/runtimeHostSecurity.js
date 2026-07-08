export const allowedProviders = ['liveportrait']

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
])

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
  if (pathname === '/api/runtime/health') {
    return true
  }

  if (pathname === '/api/runtime/jobs') {
    return true
  }

  if (/^\/api\/runtime\/jobs\/[^/]+$/.test(pathname)) {
    return true
  }

  return /^\/api\/runtime\/jobs\/[^/]+\/cancel$/.test(pathname)
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

export function validateRuntimeJobRequest(body) {
  if (!body || typeof body !== 'object') {
    return { ok: false, message: 'Request body must be an object.' }
  }

  if (!allowedProviders.includes(body.providerId)) {
    return { ok: false, message: 'Provider is not allowed.' }
  }

  if (containsForbiddenCommandKey(body)) {
    return {
      ok: false,
      message:
        'Raw command execution fields are not allowed. commandPreview is metadata only.',
    }
  }

  return { ok: true }
}
