import type { SmartMatch } from '../../types/SmartMatch'
import type { StyleCase } from '../../types/StyleCase'
import { generateSmartMatch } from '../../services/smartMatch/smartMatchEngine'
import { useI18n } from '../../i18n'

interface SmartMatchPanelProps {
  imageUrl: string | null
  imageFileName: string
  match: SmartMatch | null
  analyzing: boolean
  onMatch: (match: SmartMatch) => void
  onAnalyzingChange: (analyzing: boolean) => void
  onApply: (styleCase: StyleCase) => void
}

const percent = (value: number) => `${Math.round(value * 100)}%`

export function SmartMatchPanel({
  imageUrl,
  imageFileName,
  match,
  analyzing,
  onMatch,
  onAnalyzingChange,
  onApply,
}: SmartMatchPanelProps) {
  const { t } = useI18n()
  const handleAnalyze = async () => {
    if (!imageUrl || analyzing) {
      return
    }

    onAnalyzingChange(true)

    try {
      const nextMatch = await generateSmartMatch({
        imageUrl,
        fileName: imageFileName,
      })
      onMatch(nextMatch)
    } finally {
      onAnalyzingChange(false)
    }
  }

  return (
    <section className="smart-match-panel" aria-label={t('smartMatch')}>
      <div className="smart-match-heading">
        <div>
          <p className="panel-kicker">{t('smartMatch')}</p>
          <h3>{t('intelligentStyleMatch')}</h3>
        </div>
        <button
          type="button"
          disabled={!imageUrl || analyzing}
          onClick={handleAnalyze}
        >
          {analyzing ? t('analyzing') : t('analyzeCurrentWallpaper')}
        </button>
      </div>

      {!imageUrl && (
        <p className="smart-match-empty">
          {t('smartMatchEmpty')}
        </p>
      )}

      {match && (
        <div className="smart-match-result">
          <div className="recommended-style-list">
            <h4>{t('recommendedFirst')}</h4>
            {match.matchedCases.map((styleCase, index) => {
              const itemConfidence = Math.max(
                0.52,
                match.confidence - index * 0.08,
              )

              return (
                <article className="recommended-style-card" key={styleCase.id}>
                  <div className="recommended-style-main">
                    <span aria-hidden="true">{styleCase.previewEmoji}</span>
                    <div>
                      <h5>{styleCase.name}</h5>
                      <p>{styleCase.tags.join(' ')}</p>
                    </div>
                  </div>
                  <strong>{percent(itemConfidence)}</strong>
                  <button type="button" onClick={() => onApply(styleCase)}>
                    {t('apply')}
                  </button>
                </article>
              )
            })}
          </div>

          <p className="smart-match-summary">{match.summary}</p>

          <div className="smart-match-meta">
            <p>
              <strong>{t('detectedColors')}</strong>
              <span>{match.detectedColors.join(', ')}</span>
            </p>
            <p>
              <strong>{t('detectedTags')}</strong>
              <span>{match.detectedTags.join(', ')}</span>
            </p>
            <p>
              <strong>{t('detectedMood')}</strong>
              <span>{match.detectedMood.join(', ')}</span>
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
