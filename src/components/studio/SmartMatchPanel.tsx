import type { SmartMatch } from '../../types/SmartMatch'
import type { StyleCase } from '../../types/StyleCase'
import { generateSmartMatch } from '../../services/smartMatch/smartMatchEngine'

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
    <section className="smart-match-panel" aria-label="Smart Match">
      <div className="smart-match-heading">
        <div>
          <p className="panel-kicker">Smart Match</p>
          <h3>Intelligent Style Match</h3>
        </div>
        <button
          type="button"
          disabled={!imageUrl || analyzing}
          onClick={handleAnalyze}
        >
          {analyzing ? 'Analyzing...' : 'Analyze Current Wallpaper'}
        </button>
      </div>

      {!imageUrl && (
        <p className="smart-match-empty">
          Upload a wallpaper image to generate style recommendations.
        </p>
      )}

      {match && (
        <div className="smart-match-result">
          <div className="recommended-style-list">
            <h4>Recommended first</h4>
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
                    Apply
                  </button>
                </article>
              )
            })}
          </div>

          <p className="smart-match-summary">{match.summary}</p>

          <div className="smart-match-meta">
            <p>
              <strong>Detected Colors</strong>
              <span>{match.detectedColors.join(', ')}</span>
            </p>
            <p>
              <strong>Detected Tags</strong>
              <span>{match.detectedTags.join(', ')}</span>
            </p>
            <p>
              <strong>Detected Mood</strong>
              <span>{match.detectedMood.join(', ')}</span>
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
