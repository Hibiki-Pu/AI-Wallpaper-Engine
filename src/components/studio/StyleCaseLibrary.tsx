import { useEffect, useMemo, useState } from 'react'
import { findSimilarCases } from '../../services/styleCaseMatcher'
import { getAllStyleCasesFromPacks } from '../../services/stylePacks/stylePackService'
import type { StyleCase } from '../../types/StyleCase'
import { useI18n } from '../../i18n'

const FAVORITES_STORAGE_KEY = 'ai-wallpaper-engine.style-case-favorites'

const loadFavorites = () => {
  try {
    const storedFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY)
    const parsedFavorites = storedFavorites
      ? (JSON.parse(storedFavorites) as unknown)
      : []

    return Array.isArray(parsedFavorites)
      ? parsedFavorites.filter((item): item is string => typeof item === 'string')
      : []
  } catch {
    return []
  }
}

interface StyleCaseLibraryProps {
  activeStyleCaseId: string
  disabled: boolean
  refreshKey: number
  matchScores?: Record<string, number>
  onApply: (styleCase: StyleCase) => void
}

export function StyleCaseLibrary({
  activeStyleCaseId,
  disabled,
  refreshKey,
  matchScores = {},
  onApply,
}: StyleCaseLibraryProps) {
  const { t } = useI18n()
  const [searchQuery, setSearchQuery] = useState('')
  const [favoriteIds, setFavoriteIds] = useState<string[]>(loadFavorites)
  const [previewCaseId, setPreviewCaseId] = useState<string | null>(null)
  const [styleCases, setStyleCases] = useState<StyleCase[]>(
    getAllStyleCasesFromPacks,
  )

  useEffect(() => {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteIds))
  }, [favoriteIds])

  useEffect(() => {
    setStyleCases(getAllStyleCasesFromPacks())
  }, [refreshKey])

  const visibleCases = useMemo(() => {
    const query = searchQuery.trim()

    return query
      ? findSimilarCases(query, styleCases.length, styleCases)
      : styleCases
  }, [searchQuery, styleCases])

  const toggleFavorite = (styleCaseId: string) => {
    setFavoriteIds((currentFavoriteIds) =>
      currentFavoriteIds.includes(styleCaseId)
        ? currentFavoriteIds.filter((item) => item !== styleCaseId)
        : [...currentFavoriteIds, styleCaseId],
    )
  }

  return (
    <section className="style-case-library" aria-label="Style Case Library">
      <div className="style-case-search">
        <label htmlFor="style-case-search">{t('searchStyleCases')}</label>
        <input
          id="style-case-search"
          type="search"
          placeholder="night, sakura, rain..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
      </div>

      <div className="style-case-list">
        {visibleCases.map((styleCase) => {
          const isFavorite = favoriteIds.includes(styleCase.id)
          const previewOpen = previewCaseId === styleCase.id
          const matchScore = matchScores[styleCase.id]

          return (
            <article
              className={`style-case-card ${
                activeStyleCaseId === styleCase.id ? 'active' : ''
              }`}
              key={styleCase.id}
            >
              <div className="style-case-visual">
                <span className="style-case-emoji" aria-hidden="true">
                  {styleCase.previewEmoji}
                </span>
                {matchScore !== undefined && (
                  <strong>
                    {Math.round(matchScore * 100)}% {t('match')}
                  </strong>
                )}
              </div>

              <div className="style-case-header">
                <div>
                  <h3>{styleCase.name}</h3>
                  <p>{styleCase.description}</p>
                </div>
              </div>

              <div className="style-case-tags" aria-label={t('tags')}>
                {styleCase.tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSearchQuery(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              <div className="style-case-actions">
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => toggleFavorite(styleCase.id)}
                  aria-pressed={isFavorite}
                >
                  {isFavorite ? `\u2605 ${t('favorite')}` : `\u2606 ${t('favorite')}`}
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() =>
                    setPreviewCaseId(previewOpen ? null : styleCase.id)
                  }
                >
                  {previewOpen ? t('hidePreview') : t('preview')}
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onApply(styleCase)}
                >
                  {t('apply')}
                </button>
              </div>

              {previewOpen && (
                <div className="style-case-preview">
                  <p>
                    <strong>{t('camera')}</strong>
                    <span>{styleCase.camera.type}</span>
                  </p>
                  <p>
                    <strong>{t('effects')}</strong>
                    <span>
                      {styleCase.layers
                        .map((layer) => layer.type)
                        .join(', ')}
                    </span>
                  </p>
                </div>
              )}
            </article>
          )
        })}
      </div>

      {visibleCases.length === 0 && (
        <p className="style-case-empty">{t('noMatchingStyleCases')}</p>
      )}
    </section>
  )
}
