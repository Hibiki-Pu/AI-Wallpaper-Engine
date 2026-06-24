import { STYLE_CASES } from '../config/styleCases'
import type { StyleCase } from '../types/StyleCase'

export function findSimilarCases(
  query = '',
  limit = 3,
): StyleCase[] {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) {
    return STYLE_CASES.slice(0, limit)
  }

  const scoredCases = STYLE_CASES.map((styleCase) => {
    const searchableText = [
      styleCase.name,
      styleCase.description,
      ...styleCase.tags,
      ...styleCase.recommendedScene,
    ]
      .join(' ')
      .toLowerCase()

    return {
      styleCase,
      score: searchableText.includes(normalizedQuery) ? 1 : 0,
    }
  })

  return scoredCases
    .filter((item) => item.score > 0)
    .slice(0, limit)
    .map((item) => item.styleCase)
}
