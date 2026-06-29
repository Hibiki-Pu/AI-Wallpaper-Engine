import { useEffect, useRef, useState } from 'react'
import { OFFICIAL_STYLE_PACK } from '../../config/officialStylePack'
import {
  exportStylePack,
  getInstalledStylePacks,
  importStylePackFromJson,
} from '../../services/stylePacks/stylePackService'
import type { StylePack } from '../../types/StylePack'

interface StylePackManagerProps {
  refreshKey: number
  onPacksChange: () => void
}

export function StylePackManager({
  refreshKey,
  onPacksChange,
}: StylePackManagerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [packs, setPacks] = useState<StylePack[]>(getInstalledStylePacks)
  const [status, setStatus] = useState('')

  useEffect(() => {
    setPacks(getInstalledStylePacks())
  }, [refreshKey])

  const handleImport = async (file: File | undefined) => {
    if (!file) {
      return
    }

    try {
      const importedPack = await importStylePackFromJson(file)
      setStatus(`Imported ${importedPack.name}.`)
      setPacks(getInstalledStylePacks())
      onPacksChange()
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : 'Failed to import style pack.',
      )
    } finally {
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  return (
    <section className="style-pack-manager" aria-label="Style Pack Manager">
      <div className="style-pack-manager-header">
        <div>
          <p className="panel-kicker">Style Packs</p>
          <h3>Pack Manager</h3>
        </div>
        <div className="style-pack-actions">
          <button type="button" onClick={() => inputRef.current?.click()}>
            Import JSON
          </button>
          <button
            type="button"
            className="ghost-button"
            onClick={() => exportStylePack(OFFICIAL_STYLE_PACK)}
          >
            Export Official
          </button>
        </div>
      </div>

      <input
        ref={inputRef}
        className="upload-input"
        type="file"
        accept="application/json,.json"
        onChange={(event) => void handleImport(event.target.files?.[0])}
      />

      <div className="style-pack-list">
        {packs.map((pack) => (
          <article className="style-pack-card" key={pack.id}>
            <div>
              <h4>{pack.name}</h4>
              <p>{pack.description}</p>
            </div>
            <dl>
              <div>
                <dt>Version</dt>
                <dd>{pack.version}</dd>
              </div>
              <div>
                <dt>Cases</dt>
                <dd>{pack.styleCases.length}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>

      {status && <p className="style-pack-status">{status}</p>}
    </section>
  )
}
