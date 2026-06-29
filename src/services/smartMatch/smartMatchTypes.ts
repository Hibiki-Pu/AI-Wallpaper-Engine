export interface MockImageAnalysis {
  detectedTags: string[]
  detectedMood: string[]
  detectedColors: string[]
  summary: string
}

export interface SmartMatchInput {
  imageUrl: string
  fileName?: string
}
