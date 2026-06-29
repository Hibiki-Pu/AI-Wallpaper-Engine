import type { StyleCase } from './StyleCase'

export interface StylePack {
  id: string
  name: string
  version: string
  author?: string
  description: string
  categories: string[]
  styleCases: StyleCase[]
  createdAt?: string
}
