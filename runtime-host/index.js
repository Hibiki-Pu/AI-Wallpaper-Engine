import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import {
  cancelRuntimeHostJob,
  createRuntimeHostJob,
  getRuntimeHostJob,
  getRuntimeJobOutput,
  getRuntimeJobOutputStatus,
  getRuntimeJobOutputVideoPath,
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

const getRuntimeOutputAssetUrl = (jobId) =>
  `http://${HOST}:${PORT}/api/runtime/outputs/${jobId}/video`

const isPathInsideDirectory = (filePath, directoryPath) => {
  const resolvedFile = path.resolve(filePath)
  const resolvedDirectory = path.resolve(directoryPath)
  const relativePath = path.relative(resolvedDirectory, resolvedFile)

  return Boolean(relativePath) && !relativePath.startsWith('..') && !path.isAbsolute(relativePath)
}

const getSafeVideoPath = (jobId) => {
  const output = getRuntimeJobOutput(jobId)
  const outputPlan = output?.payload?.outputPlan
  const videoPath = getRuntimeJobOutputVideoPath(jobId)

  if (!output || !outputPlan || !videoPath) {
    return { ok: false, statusCode: 404, error: 'Runtime output video not found.' }
  }

  if (output.payload?.dryRun) {
    return { ok: false, statusCode: 404, error: 'Runtime output is planned only.' }
  }

  if (path.extname(videoPath).toLowerCase() !== '.mp4') {
    return { ok: false, statusCode: 403, error: 'Only mp4 runtime output videos are allowed.' }
  }

  if (!isPathInsideDirectory(videoPath, outputPlan.outputDir)) {
    return { ok: false, statusCode: 403, error: 'Runtime output path is outside outputDir.' }
  }

  if (!fs.existsSync(videoPath)) {
    return { ok: false, statusCode: 404, error: 'Runtime output video file is missing.' }
  }

  return { ok: true, videoPath, outputPlan, job: output.job }
}

const sendRuntimeOutputMetadata = (response, jobId, corsHeaders) => {
  const statusInfo = getRuntimeJobOutputStatus(jobId)
  const output = getRuntimeJobOutput(jobId)

  if (!output) {
    sendJson(response, 404, { ok: false, error: 'Job not found.' }, corsHeaders)
    return
  }

  const outputPlan = statusInfo.outputPlan
  let status = statusInfo.status
  let asset = null

  if (status === 'checking') {
    const video = getSafeVideoPath(jobId)
    status = video.ok ? 'available' : video.statusCode === 404 ? 'missing' : 'failed'
  }

  if (status === 'available' && outputPlan) {
    asset = {
      type: 'video',
      mimeType: 'video/mp4',
      filename: outputPlan.outputFilename,
      url: getRuntimeOutputAssetUrl(jobId),
    }
  }

  sendJson(
    response,
    200,
    {
      ok: true,
      jobId,
      providerId: output.job.input.providerId,
      status,
      outputPlan,
      asset,
    },
    corsHeaders,
  )
}

const streamRuntimeOutputVideo = (request, response, jobId, corsHeaders) => {
  const video = getSafeVideoPath(jobId)

  if (!video.ok) {
    sendJson(response, video.statusCode, { ok: false, error: video.error }, corsHeaders)
    return
  }

  const stat = fs.statSync(video.videoPath)
  const range = request.headers.range
  const headers = {
    ...corsHeaders,
    'Content-Type': 'video/mp4',
    'Accept-Ranges': 'bytes',
  }

  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range)

    if (match) {
      const start = match[1] ? Number(match[1]) : 0
      const end = match[2] ? Number(match[2]) : stat.size - 1
      const safeEnd = Math.min(end, stat.size - 1)

      if (start <= safeEnd && start < stat.size) {
        response.writeHead(206, {
          ...headers,
          'Content-Length': safeEnd - start + 1,
          'Content-Range': `bytes ${start}-${safeEnd}/${stat.size}`,
        })
        fs.createReadStream(video.videoPath, { start, end: safeEnd }).pipe(response)
        return
      }
    }
  }

  response.writeHead(200, {
    ...headers,
    'Content-Length': stat.size,
  })
  fs.createReadStream(video.videoPath).pipe(response)
}
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

  if (request.method === 'GET' && /^\/api\/runtime\/outputs\/[^/]+$/.test(url.pathname)) {
    sendRuntimeOutputMetadata(response, getJobIdFromPath(url.pathname), corsHeaders)
    return
  }

  if (
    request.method === 'GET' &&
    /^\/api\/runtime\/outputs\/[^/]+\/video$/.test(url.pathname)
  ) {
    streamRuntimeOutputVideo(request, response, getJobIdFromPath(url.pathname), corsHeaders)
    return
  }

  if (request.method === 'GET' && /^\/api\/runtime\/jobs\/[^/]+$/.test(url.pathname)) {    const job = getRuntimeHostJob(getJobIdFromPath(url.pathname))
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
