import { STYLE_CASES } from './styleCases'
import type { StylePack } from '../types/StylePack'

export const OFFICIAL_STYLE_PACK: StylePack = {
  id: 'official-ai-wallpaper-style-pack',
  name: 'Official AI Wallpaper Style Pack',
  version: '1.0.0',
  author: 'AI Wallpaper Engine',
  description: 'The default official style case collection for AI Wallpaper Engine.',
  categories: ['official', 'starter', 'dynamic-wallpaper'],
  styleCases: STYLE_CASES,
  createdAt: '2026-06-29',
}
