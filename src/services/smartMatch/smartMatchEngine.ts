import { STYLE_CASES } from '../../config/styleCases'
import { findSimilarCases } from '../styleCaseMatcher'
import type { SmartMatch } from '../../types/SmartMatch'
import { mockImageAnalyzer } from './mockImageAnalyzer'
import type { SmartMatchInput } from './smartMatchTypes'

export async function generateSmartMatch({
  imageUrl,
  fileName,
}: SmartMatchInput): Promise<SmartMatch> {
  const analysis = await mockImageAnalyzer(imageUrl, fileName)
  const query = [
    ...analysis.detectedTags,
    ...analysis.detectedMood,
    ...analysis.detectedColors,
  ].join(' ')

  // TODO: Replace this mock scoring with OpenCLIP / CLIP Embedding / Qdrant / Chroma / Real Vector Search.
  const matchedCases = findSimilarCases(query, 3)
  const fallbackCases = matchedCases.length > 0 ? matchedCases : STYLE_CASES.slice(0, 3)
  const confidence = Math.min(
    0.94,
    0.62 + analysis.detectedTags.length * 0.08 + matchedCases.length * 0.04,
  )

  return {
    confidence,
    matchedCases: fallbackCases,
    detectedTags: analysis.detectedTags,
    detectedMood: analysis.detectedMood,
    detectedColors: analysis.detectedColors,
    summary: analysis.summary,
  }
}
