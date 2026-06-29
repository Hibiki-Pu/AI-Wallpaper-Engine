import type { StyleCase } from './StyleCase'

export interface SmartMatch {
  confidence: number
  matchedCases: StyleCase[]
  detectedTags: string[]
  detectedMood: string[]
  detectedColors: string[]
  summary: string
}
