import { useState } from 'react'
import { CameraPanel } from './CameraPanel'
import { EffectLibrarySidebar } from './EffectLibrarySidebar'
import { StyleCaseLibrary } from './StyleCaseLibrary'
import { StylePackManager } from './StylePackManager'
import { WallpaperAssetPanel } from './WallpaperAssetPanel'
import { MotionPanel } from './MotionPanel'
import { ImageGenerationPanel } from './ImageGenerationPanel'
import { useI18n } from '../../i18n'
import type { EffectLibraryItem } from './EffectCard'
import type { SeedreamAspectRatio } from '../../services/seedreamImageService'
import type {
  WallpaperEffectLayerType,
  WallpaperSpec,
} from '../../types/WallpaperSpec'
import type { EffectIntensity } from '../../config/effectPresets'
import type { StyleCase } from '../../types/StyleCase'

type StudioToolCategory =
  | 'assets'
  | 'generate'
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
  activeImageFileName: string
  activeImageDimensions: { width: number; height: number } | null
  canvasAspectRatio: SeedreamAspectRatio
  activeStyleCaseId: string
  smartMatchScores: Record<string, number>
  stylePacksVersion: number
  onStylePacksChange: () => void
  onStyleCaseApply: (styleCase: StyleCase) => void
  onImageReplace: (file: File) => void
  onImageGenerated: (file: File) => void
  onImageDelete: () => void
  onResetCanvasPosition: () => void
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
  labelKey:
    | 'assets'
    | 'aiGenerate'
    | 'style'
    | 'effects'
    | 'environment'
    | 'camera'
    | 'animation'
    | 'stylePack'
    | 'advanced'
}> = [
  { id: 'assets', icon: '\uD83D\uDDBC\uFE0F', labelKey: 'assets' },
  { id: 'generate', icon: '\u2726', labelKey: 'aiGenerate' },
  { id: 'style', icon: '\uD83C\uDFA8', labelKey: 'style' },
  { id: 'effects', icon: '\u2728', labelKey: 'effects' },
  { id: 'environment', icon: '\uD83C\uDF26\uFE0F', labelKey: 'environment' },
  { id: 'camera', icon: '\uD83D\uDCF7', labelKey: 'camera' },
  { id: 'animation', icon: '\uD83C\uDFAD', labelKey: 'animation' },
  { id: 'packs', icon: '\uD83D\uDCE6', labelKey: 'stylePack' },
  { id: 'advanced', icon: '\u2699\uFE0F', labelKey: 'advanced' },
]

const ENVIRONMENT_TYPES: WallpaperEffectLayerType[] = ['snow', 'rain', 'fog', 'stars']

export function StudioSidebar({
  effects,
  spec,
  selectedLayerId,
  activeImageFileName,
  activeImageDimensions,
  canvasAspectRatio,
  activeStyleCaseId,
  smartMatchScores,
  stylePacksVersion,
  onStylePacksChange,
  onStyleCaseApply,
  onImageReplace,
  onImageGenerated,
  onImageDelete,
  onResetCanvasPosition,
  onCameraChange,
  onEffectSelect,
  onEffectToggle,
  getEffectIntensity,
  onEffectIntensityChange,
  onEffectAdvanced,
}: StudioSidebarProps) {
  const { t } = useI18n()
  const [activeCategory, setActiveCategory] =
    useState<StudioToolCategory>('style')

  const filteredEffects =
    activeCategory === 'environment'
      ? effects.filter((effect) => ENVIRONMENT_TYPES.includes(effect.type))
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
            <strong>{t(item.labelKey)}</strong>
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

        {activeCategory === 'assets' && (
          <WallpaperAssetPanel
            spec={spec}
            fileName={activeImageFileName}
            dimensions={activeImageDimensions}
            onReplaceImage={onImageReplace}
            onDeleteImage={onImageDelete}
            onResetPosition={onResetCanvasPosition}
          />
        )}

        {activeCategory === 'generate' && (
          <ImageGenerationPanel
            hasCurrentWallpaper={Boolean(spec)}
            canvasAspectRatio={canvasAspectRatio}
            onImageGenerated={onImageGenerated}
          />
        )}

        {(activeCategory === 'effects' ||
          activeCategory === 'environment') && (
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

        {activeCategory === 'animation' && (
          <MotionPanel imageUrl={spec?.imageUrl ?? null} />
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
            <p className="panel-kicker">{t('advanced')}</p>
            <h2>{t('advancedModeTitle')}</h2>
            <p>{t('advancedModeCopy')}</p>
          </div>
        )}
      </div>
    </aside>
  )
}
