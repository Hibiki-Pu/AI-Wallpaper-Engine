import { useState } from 'react'
import { CameraPanel } from './CameraPanel'
import { EffectLibrarySidebar } from './EffectLibrarySidebar'
import { StyleCaseLibrary } from './StyleCaseLibrary'
import { StylePackManager } from './StylePackManager'
import type { EffectLibraryItem } from './EffectCard'
import type {
  WallpaperEffectLayerType,
  WallpaperSpec,
} from '../../types/WallpaperSpec'
import type { EffectIntensity } from '../../config/effectPresets'
import type { StyleCase } from '../../types/StyleCase'

type StudioToolCategory =
  | 'style'
  | 'effects'
  | 'environment'
  | 'camera'
  | 'animation'
  | 'packs'
  | 'advanced'

interface StudioSidebarProps {
  effects: EffectLibraryItem[]
  spec: WallpaperSpec | null
  selectedLayerId: string | null
  activeStyleCaseId: string
  smartMatchScores: Record<string, number>
  stylePacksVersion: number
  onStylePacksChange: () => void
  onStyleCaseApply: (styleCase: StyleCase) => void
  onCameraChange: (patch: Partial<WallpaperSpec['camera']>) => void
  onEffectSelect: (type: WallpaperEffectLayerType) => void
  onEffectToggle: (
    type: WallpaperEffectLayerType,
    enabled: boolean,
    variant?: string,
  ) => void
  getEffectIntensity: (
    type: WallpaperEffectLayerType,
  ) => EffectIntensity | 'custom'
  onEffectIntensityChange: (
    type: WallpaperEffectLayerType,
    intensity: EffectIntensity,
  ) => void
  onEffectAdvanced: (type: WallpaperEffectLayerType) => void
}

const CATEGORY_ITEMS: Array<{
  id: StudioToolCategory
  icon: string
  label: string
}> = [
  { id: 'style', icon: '\uD83C\uDFA8', label: 'Style' },
  { id: 'effects', icon: '\u2728', label: 'Effects' },
  { id: 'environment', icon: '\uD83C\uDF26\uFE0F', label: 'Environment' },
  { id: 'camera', icon: '\uD83D\uDCF7', label: 'Camera' },
  { id: 'animation', icon: '\uD83C\uDFAD', label: 'Animation' },
  { id: 'packs', icon: '\uD83D\uDCE6', label: 'Style Pack' },
  { id: 'advanced', icon: '\u2699\uFE0F', label: 'Advanced' },
]

const ENVIRONMENT_TYPES: WallpaperEffectLayerType[] = ['snow', 'rain', 'fog', 'stars']
const ANIMATION_TYPES: WallpaperEffectLayerType[] = ['petals', 'fireflies', 'light_rays']

export function StudioSidebar({
  effects,
  spec,
  selectedLayerId,
  activeStyleCaseId,
  smartMatchScores,
  stylePacksVersion,
  onStylePacksChange,
  onStyleCaseApply,
  onCameraChange,
  onEffectSelect,
  onEffectToggle,
  getEffectIntensity,
  onEffectIntensityChange,
  onEffectAdvanced,
}: StudioSidebarProps) {
  const [activeCategory, setActiveCategory] =
    useState<StudioToolCategory>('style')

  const filteredEffects =
    activeCategory === 'environment'
      ? effects.filter((effect) => ENVIRONMENT_TYPES.includes(effect.type))
      : activeCategory === 'animation'
        ? effects.filter((effect) => ANIMATION_TYPES.includes(effect.type))
        : effects

  return (
    <aside className="studio-sidebar" aria-label="Studio tools">
      <nav className="studio-category-rail" aria-label="Tool categories">
        {CATEGORY_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={activeCategory === item.id ? 'active' : ''}
            onClick={() => setActiveCategory(item.id)}
          >
            <span aria-hidden="true">{item.icon}</span>
            <strong>{item.label}</strong>
          </button>
        ))}
      </nav>

      <div className="studio-sidebar-panel">
        {activeCategory === 'style' && (
          <StyleCaseLibrary
            activeStyleCaseId={activeStyleCaseId}
            disabled={!spec}
            refreshKey={stylePacksVersion}
            matchScores={smartMatchScores}
            onApply={onStyleCaseApply}
          />
        )}

        {(activeCategory === 'effects' ||
          activeCategory === 'environment' ||
          activeCategory === 'animation') && (
          <EffectLibrarySidebar
            effects={filteredEffects}
            spec={spec}
            selectedLayerId={selectedLayerId}
            onEffectSelect={onEffectSelect}
            onEffectToggle={onEffectToggle}
            getEffectIntensity={getEffectIntensity}
            onEffectIntensityChange={onEffectIntensityChange}
            onEffectAdvanced={onEffectAdvanced}
          />
        )}

        {activeCategory === 'camera' && (
          <CameraPanel
            camera={spec?.camera ?? null}
            onCameraChange={onCameraChange}
          />
        )}

        {activeCategory === 'packs' && (
          <StylePackManager
            refreshKey={stylePacksVersion}
            onPacksChange={onStylePacksChange}
          />
        )}

        {activeCategory === 'advanced' && (
          <div className="advanced-mode-note">
            <p className="panel-kicker">Advanced</p>
            <h2>Layer editing lives in the Inspector</h2>
            <p>
              Select a layer or effect, then use the right panel for z-index,
              lock, visibility, variant and precision controls.
            </p>
          </div>
        )}
      </div>
    </aside>
  )
}
