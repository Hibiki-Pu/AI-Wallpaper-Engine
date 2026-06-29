import { getAllStyleCasesFromPacks } from './stylePacks/stylePackService'
import type { StyleCase } from '../types/StyleCase'

export function findSimilarCases(
  query = '',
  limit = 3,
  styleCases: StyleCase[] = getAllStyleCasesFromPacks(),
): StyleCase[] {
  const queryTokens = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)

  if (queryTokens.length === 0) {
    return styleCases.slice(0, limit)
  }

  const scoredCases = styleCases.map((styleCase) => {
    const searchableText = [
      styleCase.name,
      styleCase.description,
      ...styleCase.tags,
      ...styleCase.recommendedScene,
    ]
      .join(' ')
      .toLowerCase()

    const score = queryTokens.reduce(
      (currentScore, token) =>
        searchableText.includes(token) ? currentScore + 1 : currentScore,
      0,
    )

    return { styleCase, score }
  })

  return scoredCases
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.styleCase)
}
