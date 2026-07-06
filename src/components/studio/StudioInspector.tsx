import { ExportPanel } from '../ExportPanel'
import { AccordionSection } from './AccordionSection'
import { InspectorPanel } from './InspectorPanel'
import { LayerPanel } from './LayerPanel'
import { SmartMatchPanel } from './SmartMatchPanel'
import type { EffectLibraryItem } from './EffectCard'
import type { SmartMatch } from '../../types/SmartMatch'
import type { StyleCase } from '../../types/StyleCase'
import type {
  WallpaperLayer,
  WallpaperSpec,
} from '../../types/WallpaperSpec'
import { useI18n } from '../../i18n'

type InspectorSection = 'current' | 'smartMatch' | 'layers' | 'export'

interface StudioInspectorProps {
  openSections: Record<InspectorSection, boolean>
  spec: WallpaperSpec | null
  selectedLayer: WallpaperLayer | null
  selectedEffectMetadata: EffectLibraryItem | null
  selectedLayerId: string | null
  smartMatch: SmartMatch | null
  isSmartMatchAnalyzing: boolean
  activeImageFileName: string
  onToggleSection: (section: InspectorSection) => void
  onSmartMatch: (match: SmartMatch) => void
  onSmartMatchAnalyzingChange: (analyzing: boolean) => void
  onStyleCaseApply: (styleCase: StyleCase) => void
  onLayerSelect: (id: string) => void
  onLayerChange: (id: string, patch: Partial<WallpaperLayer>) => void
  onLayerDelete: (id: string) => void
  onMoveLayer: (id: string, direction: 'up' | 'down') => void
  onInspectorLayerChange: (id: string, patch: Partial<WallpaperLayer>) => void
}

export function StudioInspector({
  openSections,
  spec,
  selectedLayer,
  selectedEffectMetadata,
  selectedLayerId,
  smartMatch,
  isSmartMatchAnalyzing,
  activeImageFileName,
  onToggleSection,
  onSmartMatch,
  onSmartMatchAnalyzingChange,
  onStyleCaseApply,
  onLayerSelect,
  onLayerChange,
  onLayerDelete,
  onMoveLayer,
  onInspectorLayerChange,
}: StudioInspectorProps) {
  const { t } = useI18n()

  return (
    <aside className="studio-inspector-column" aria-label={t('inspector')}>
      <div className="inspector-content">
        <AccordionSection
          title={t('currentEdit')}
          open={openSections.current}
          onToggle={() => onToggleSection('current')}
        >
          <InspectorPanel
            layer={selectedLayer}
            metadata={selectedEffectMetadata}
            onEffectChange={onInspectorLayerChange}
          />
        </AccordionSection>

        <AccordionSection
          title={t('smartMatch')}
          open={openSections.smartMatch}
          onToggle={() => onToggleSection('smartMatch')}
        >
          <SmartMatchPanel
            imageUrl={spec?.imageUrl ?? null}
            imageFileName={activeImageFileName}
            match={smartMatch}
            analyzing={isSmartMatchAnalyzing}
            onMatch={onSmartMatch}
            onAnalyzingChange={onSmartMatchAnalyzingChange}
            onApply={onStyleCaseApply}
          />
        </AccordionSection>

        <AccordionSection
          title={t('advancedLayers')}
          open={openSections.layers}
          onToggle={() => onToggleSection('layers')}
        >
          {spec && (
            <LayerPanel
              layers={spec.layers}
              selectedLayerId={selectedLayerId}
              onLayerSelect={onLayerSelect}
              onLayerChange={onLayerChange}
              onLayerDelete={onLayerDelete}
              onMoveLayer={onMoveLayer}
            />
          )}
        </AccordionSection>

        <AccordionSection
          title={t('export')}
          open={openSections.export}
          onToggle={() => onToggleSection('export')}
        >
          <ExportPanel spec={spec} />
        </AccordionSection>
      </div>
    </aside>
  )
}

export type { InspectorSection as StudioInspectorSection }
