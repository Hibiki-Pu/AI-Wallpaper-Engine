import type { RuntimeConfig, RuntimeHealthCheckResult } from '../../types/RuntimeConfig'
import type { LivePortraitCommandPreview } from '../../providers/animation/livePortrait/livePortraitTypes'
import { useI18n } from '../../i18n'

interface RuntimeSettingsPanelProps {
  config: RuntimeConfig
  health: RuntimeHealthCheckResult
  commandPreview: LivePortraitCommandPreview
  onChange: (patch: Partial<RuntimeConfig>) => void
  onReset: () => void
}

export function RuntimeSettingsPanel({
  config,
  health,
  commandPreview,
  onChange,
  onReset,
}: RuntimeSettingsPanelProps) {
  const { t } = useI18n()
  const commandText = [
    commandPreview.command,
    ...commandPreview.args.map((arg) =>
      /\s/.test(arg) ? `"${arg}"` : arg,
    ),
  ].join(' ')

  return (
    <section className="runtime-settings-panel">
      <div>
        <p className="panel-kicker">{t('runtimeSettings')}</p>
        <h3>{t('livePortraitRuntime')}</h3>
      </div>

      <label className="inspector-field">
        <span>{t('runtimeMode')}</span>
        <select
          value={config.mode}
          onChange={(event) =>
            onChange({
              mode: event.target.value as RuntimeConfig['mode'],
              enabled: event.target.value !== 'disabled',
            })
          }
        >
          <option value="disabled">disabled</option>
          <option value="mock">mock</option>
          <option value="localCli">localCli</option>
          <option value="localService">localService</option>
          <option value="docker">docker</option>
        </select>
      </label>

      <label className="inspector-toggle">
        <input
          type="checkbox"
          checked={config.enabled}
          onChange={(event) => onChange({ enabled: event.target.checked })}
        />
        <span>{t('enabled')}</span>
      </label>

      <label className="inspector-field">
        <span>{t('runtimePath')}</span>
        <input
          type="text"
          value={config.runtimePath ?? ''}
          placeholder="D:\\LivePortrait"
          onChange={(event) => onChange({ runtimePath: event.target.value })}
        />
      </label>

      <label className="inspector-field">
        <span>{t('pythonCommand')}</span>
        <input
          type="text"
          value={config.pythonCommand ?? ''}
          placeholder="python"
          onChange={(event) => onChange({ pythonCommand: event.target.value })}
        />
      </label>

      <label className="inspector-field">
        <span>{t('entryFile')}</span>
        <input
          type="text"
          value={config.entryFile ?? ''}
          placeholder="inference.py"
          onChange={(event) => onChange({ entryFile: event.target.value })}
        />
      </label>

      <label className="inspector-field">
        <span>{t('outputDir')}</span>
        <input
          type="text"
          value={config.outputDir ?? ''}
          placeholder="D:\\LivePortrait\\outputs"
          onChange={(event) => onChange({ outputDir: event.target.value })}
        />
      </label>

      <div className={`runtime-health-card status-${health.status}`}>
        <strong>{t('healthCheck')}</strong>
        <span>{health.message}</span>
      </div>

      <div className="runtime-requirement-list">
        <strong>{t('missingRequirements')}</strong>
        {health.requirements.map((requirement) => (
          <p key={requirement.id}>
            <span>{requirement.label}</span>
            <small>{requirement.status}</small>
          </p>
        ))}
      </div>

      <div className="runtime-command-preview">
        <strong>{t('commandPreview')}</strong>
        <code>{commandText}</code>
        {commandPreview.cwd && <span>cwd: {commandPreview.cwd}</span>}
      </div>

      <button type="button" className="runtime-reset-button" onClick={onReset}>
        {t('resetRuntimeConfig')}
      </button>
    </section>
  )
}
