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
import { executeCommandPlan } from './runtimeCommandExecutor.js'
import { createDepthAnythingPlan } from './providers/depth-anything/depthAnythingHostAdapter.js'

const HOST = '127.0.0.1'
const PORT = Number(process.env.RUNTIME_HOST_PORT ?? 8787)
const VERSION = '0.1.0'
const realExecutionEnabled = process.env.RUNTIME_ENABLE_REAL_EXECUTION === 'true'
const SEEDREAM_MODEL = 'doubao-seedream-5-0-pro-260628'
const SEEDREAM_BASE_URL = process.env.SEEDREAM_BASE_URL ?? 'https://ark.cn-beijing.volces.com/api/v3'
const RUNTIME_INPUT_DIR = process.env.RUNTIME_INPUT_DIR ?? 'D:/ai-wallpaper-runtime-inputs/liveportrait/web'

const sendJson = (response, statusCode, payload, corsHeaders = {}) => {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    ...corsHeaders,
  })
  response.end(JSON.stringify(payload))
}

const readJsonBody = (request, maxBytes = 1024 * 1024) =>
  new Promise((resolve, reject) => {
    let body = ''

    request.on('data', (chunk) => {
      body += chunk

      if (body.length > maxBytes) {
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

const readSeedreamError = (payload, fallback) =>
  payload?.error?.message ?? payload?.message ?? payload?.detail ?? fallback

const callSeedream = async (pathname, options) => {
  const response = await fetch(`${SEEDREAM_BASE_URL}${pathname}`, options)
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(readSeedreamError(payload, `Seedream request failed (${response.status}).`))
  return payload
}

const getGeneratedImage = (payload) => Array.isArray(payload?.data) ? payload.data[0] : null

const getGeneratedImageDataUrl = async (image) => {
  const base64 = image?.b64_json ?? image?.b64Json ?? image?.base64
  if (base64) return `data:${image?.mime_type ?? 'image/png'};base64,${base64}`
  const imageUrl = image?.url ?? image?.image_url
  if (!imageUrl) throw new Error('Seedream response did not include image data.')
  const response = await fetch(imageUrl)
  if (!response.ok) throw new Error(`Generated image download failed (${response.status}).`)
  const mimeType = response.headers.get('content-type') ?? 'image/png'
  const buffer = Buffer.from(await response.arrayBuffer())
  return `data:${mimeType};base64,${buffer.toString('base64')}`
}

const normalizeSeedreamAspectRatio = (value) =>
  typeof value === 'string' && /^\d+:\d+$/.test(value) ? value : null

const normalizeSeedreamReferenceImages = (body) => {
  if (Array.isArray(body.referenceImages)) {
    const images = body.referenceImages.filter((image) => typeof image === 'string' && image)
    return images.length ? images.slice(0, 2) : null
  }

  return typeof body.referenceImage === 'string' && body.referenceImage
    ? body.referenceImage
    : null
}

const runtimeAssetKinds = {
  sourceImage: new Map([
    ['image/png', '.png'],
    ['image/jpeg', '.jpg'],
    ['image/webp', '.webp'],
  ]),
  drivingVideo: new Map([
    ['video/mp4', '.mp4'],
    ['video/webm', '.webm'],
    ['video/quicktime', '.mov'],
  ]),
}

const saveRuntimeAsset = (body) => {
  const allowedTypes = runtimeAssetKinds[body.kind]
  if (!allowedTypes) throw new Error('Unsupported runtime asset kind.')
  if (typeof body.dataUrl !== 'string') throw new Error('Runtime asset dataUrl is required.')
  const match = /^data:([^;,]+);base64,([A-Za-z0-9+/=]+)$/.exec(body.dataUrl)
  if (!match || !allowedTypes.has(match[1])) throw new Error('Unsupported runtime asset format.')
  const buffer = Buffer.from(match[2], 'base64')
  if (!buffer.length) throw new Error('Runtime asset is empty.')
  const extension = allowedTypes.get(match[1])
  const prefix = body.kind === 'sourceImage' ? 'source' : 'driving'
  const filename = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${extension}`
  const assetDir = path.resolve(RUNTIME_INPUT_DIR, body.kind)
  fs.mkdirSync(assetDir, { recursive: true })
  const assetPath = path.join(assetDir, filename)
  fs.writeFileSync(assetPath, buffer)
  return { kind: body.kind, path: assetPath, filename, mimeType: match[1], size: buffer.length }
}

const getDepthAnythingHealth = () => {
  const probe = createDepthAnythingPlan('source.png', 'health-check')
  const entryPath = path.join(probe.runtimePath, 'run.py')
  const missing = [
    !fs.existsSync(probe.runtimePath) ? 'runtime' : null,
    !fs.existsSync(probe.commandPlan.command) ? 'python' : null,
    !fs.existsSync(entryPath) ? 'run.py' : null,
    !fs.existsSync(probe.checkpointPath) ? 'checkpoint' : null,
  ].filter(Boolean)

  return {
    ok: missing.length === 0,
    providerId: 'depth_anything',
    runtimePath: probe.runtimePath,
    pythonCommand: probe.commandPlan.command,
    checkpointPath: probe.checkpointPath,
    missing,
  }
}

const generateDepthMap = async (body) => {
  const health = getDepthAnythingHealth()
  if (!health.ok) {
    throw new Error(`Depth Anything runtime is not ready: ${health.missing.join(', ')}.`)
  }

  const asset = saveRuntimeAsset({ kind: 'sourceImage', dataUrl: body.imageDataUrl })
  const jobId = `depth-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const plan = createDepthAnythingPlan(asset.path, jobId)
  fs.mkdirSync(plan.outputDir, { recursive: true })
  const executionResult = await executeCommandPlan(plan.commandPlan)

  if (!executionResult.ok) {
    throw new Error(
      executionResult.stderr ||
        `Depth Anything exited with code ${executionResult.exitCode}.`,
    )
  }
  if (!fs.existsSync(plan.outputPath)) {
    throw new Error('Depth Anything completed but the depth map is missing.')
  }

  const data = fs.readFileSync(plan.outputPath)
  return {
    jobId,
    depthMapDataUrl: `data:image/png;base64,${data.toString('base64')}`,
    width: body.width ?? null,
    height: body.height ?? null,
    outputPath: plan.outputPath,
    executionResult,
  }
}

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

  if (request.method === 'POST' && url.pathname === '/api/runtime/assets') {
    try {
      const body = await readJsonBody(request, 64 * 1024 * 1024)
      sendJson(response, 201, { ok: true, asset: saveRuntimeAsset(body) }, corsHeaders)
    } catch (error) {
      sendJson(response, 400, { ok: false, error: error instanceof Error ? error.message : 'Runtime asset upload failed.' }, corsHeaders)
    }
    return
  }

  if (request.method === 'GET' && url.pathname === '/api/depth-anything/health') {
    const health = getDepthAnythingHealth()
    sendJson(response, health.ok ? 200 : 503, health, corsHeaders)
    return
  }

  if (request.method === 'POST' && url.pathname === '/api/depth-anything/generate') {
    try {
      const body = await readJsonBody(request, 64 * 1024 * 1024)
      if (typeof body.imageDataUrl !== 'string') {
        throw new Error('Source image is required.')
      }
      const result = await generateDepthMap(body)
      sendJson(response, 200, { ok: true, ...result }, corsHeaders)
    } catch (error) {
      sendJson(response, 400, {
        ok: false,
        error: error instanceof Error ? error.message : 'Depth generation failed.',
      }, corsHeaders)
    }
    return
  }

  if (request.method === 'POST' && url.pathname === '/api/images/seedream/test') {
    try {
      const body = await readJsonBody(request)
      if (!body.apiKey || typeof body.apiKey !== 'string') throw new Error('Seedream API Key is required.')
      await callSeedream('/models', { headers: { Authorization: `Bearer ${body.apiKey}` } })
      sendJson(response, 200, { ok: true, model: SEEDREAM_MODEL, message: 'Seedream connection succeeded.' }, corsHeaders)
    } catch (error) {
      sendJson(response, 400, { ok: false, message: error instanceof Error ? error.message : 'Seedream connection failed.' }, corsHeaders)
    }
    return
  }

  if (request.method === 'POST' && url.pathname === '/api/images/seedream/generate') {
    try {
      const body = await readJsonBody(request, 32 * 1024 * 1024)
      if (!body.apiKey || typeof body.apiKey !== 'string') throw new Error('Seedream API Key is required.')
      if (!body.prompt || typeof body.prompt !== 'string' || !body.prompt.trim()) throw new Error('Image prompt is required.')
      const aspectRatio = normalizeSeedreamAspectRatio(body.aspectRatio)
      const referenceImages = normalizeSeedreamReferenceImages(body)
      const payload = await callSeedream('/images/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${body.apiKey}` },
        body: JSON.stringify({
          model: SEEDREAM_MODEL,
          prompt: body.prompt.trim(),
          response_format: 'url',
          size: '2K',
          stream: false,
          watermark: true,
          ...(aspectRatio ? { aspect_ratio: aspectRatio } : {}),
          ...(referenceImages ? { image: referenceImages } : {}),
        }),
      })
      const dataUrl = await getGeneratedImageDataUrl(getGeneratedImage(payload))
      sendJson(response, 200, { ok: true, model: SEEDREAM_MODEL, dataUrl }, corsHeaders)
    } catch (error) {
      sendJson(response, 400, { ok: false, message: error instanceof Error ? error.message : 'Image generation failed.' }, corsHeaders)
    }
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
