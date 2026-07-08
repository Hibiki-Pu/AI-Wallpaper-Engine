import http from 'node:http'
import {
  cancelRuntimeHostJob,
  createRuntimeHostJob,
  getRuntimeHostJob,
} from './runtimeHostJobManager.js'
import {
  allowedProviders,
  getCorsHeaders,
  isAllowedApiPath,
  isAllowedOrigin,
  validateRuntimeJobRequest,
  validateRuntimeToken,
} from './runtimeHostSecurity.js'

const HOST = '127.0.0.1'
const PORT = Number(process.env.RUNTIME_HOST_PORT ?? 8787)
const VERSION = '0.1.0'
const realExecutionEnabled = process.env.RUNTIME_ENABLE_REAL_EXECUTION === 'true'

const sendJson = (response, statusCode, payload, corsHeaders = {}) => {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    ...corsHeaders,
  })
  response.end(JSON.stringify(payload))
}

const readJsonBody = (request) =>
  new Promise((resolve, reject) => {
    let body = ''

    request.on('data', (chunk) => {
      body += chunk

      if (body.length > 1024 * 1024) {
        reject(new Error('Request body too large.'))
        request.destroy()
      }
    })

    request.on('end', () => {
      if (!body) {
        resolve({})
        return
      }

      try {
        resolve(JSON.parse(body))
      } catch {
        reject(new Error('Invalid JSON body.'))
      }
    })
  })

const getJobIdFromPath = (pathname) => pathname.split('/')[4]

const server = http.createServer(async (request, response) => {
  const origin = request.headers.origin
  const corsHeaders = getCorsHeaders(origin)
  const url = new URL(request.url ?? '/', `http://${HOST}:${PORT}`)

  if (request.method === 'OPTIONS') {
    if (!isAllowedOrigin(origin)) {
      sendJson(response, 403, { error: 'Origin not allowed.' }, corsHeaders)
      return
    }

    response.writeHead(204, corsHeaders)
    response.end()
    return
  }

  if (!isAllowedOrigin(origin)) {
    sendJson(response, 403, { error: 'Origin not allowed.' }, corsHeaders)
    return
  }

  if (!isAllowedApiPath(url.pathname)) {
    sendJson(response, 404, { error: 'API path not found.' }, corsHeaders)
    return
  }

  const tokenResult = validateRuntimeToken(request)

  if (!tokenResult.ok) {
    sendJson(response, 401, { error: tokenResult.message }, corsHeaders)
    return
  }

  if (request.method === 'GET' && url.pathname === '/api/runtime/health') {
    sendJson(
      response,
      200,
      {
        ok: true,
        host: 'ai-wallpaper-runtime-host',
        version: VERSION,
        mode: 'mock',
        supportedJobModes: ['mock', 'dryRun', 'realRun'],
        allowedProviders,
        realExecutionEnabled,
        port: PORT,
      },
      corsHeaders,
    )
    return
  }

  if (request.method === 'POST' && url.pathname === '/api/runtime/jobs') {
    try {
      const body = await readJsonBody(request)
      const validation = validateRuntimeJobRequest(body)

      if (!validation.ok) {
        sendJson(response, 400, { error: validation.message }, corsHeaders)
        return
      }

      const job = createRuntimeHostJob(body, { realExecutionEnabled })
      sendJson(response, 202, { job }, corsHeaders)
    } catch (error) {
      sendJson(
        response,
        400,
        { error: error instanceof Error ? error.message : 'Invalid request.' },
        corsHeaders,
      )
    }
    return
  }

  if (request.method === 'GET' && /^\/api\/runtime\/jobs\/[^/]+$/.test(url.pathname)) {
    const job = getRuntimeHostJob(getJobIdFromPath(url.pathname))
    sendJson(response, job ? 200 : 404, job ? { job } : { error: 'Job not found.' }, corsHeaders)
    return
  }

  if (
    request.method === 'POST' &&
    /^\/api\/runtime\/jobs\/[^/]+\/cancel$/.test(url.pathname)
  ) {
    const job = cancelRuntimeHostJob(getJobIdFromPath(url.pathname))
    sendJson(response, job ? 200 : 404, job ? { job } : { error: 'Job not found.' }, corsHeaders)
    return
  }

  sendJson(response, 405, { error: 'Method not allowed.' }, corsHeaders)
})

server.listen(PORT, HOST, () => {
  console.log(`AI Wallpaper Runtime Host running at http://${HOST}:${PORT}`)
})
