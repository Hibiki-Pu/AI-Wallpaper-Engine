import type { RuntimeConfig, RuntimeHealthCheckResult } from '../../types/RuntimeConfig'
import type { LivePortraitCommandPreview } from '../../providers/animation/livePortrait/livePortraitTypes'
import type { RuntimeHostHealth } from '../../runtime/runtimeHostClient'
import { useI18n } from '../../i18n'

interface RuntimeSettingsPanelProps {
  config: RuntimeConfig
  health: RuntimeHealthCheckResult
  commandPreview: LivePortraitCommandPreview
  hostHealth: RuntimeHostHealth | null
  hostHealthStatus: string
  onChange: (patch: Partial<RuntimeConfig>) => void
  onReset: () => void
  onCheckHost: () => void
}

export function RuntimeSettingsPanel({
  config,
  health,
  commandPreview,
  hostHealth,
  hostHealthStatus,
  onChange,
  onReset,
  onCheckHost,
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
        <span>{t('executionMode')}</span>
        <select
          value={config.executionMode ?? (config.dryRun ? 'dryRun' : 'mock')}
          onChange={(event) =>
            onChange({
              executionMode: event.target
                .value as NonNullable<RuntimeConfig['executionMode']>,
              dryRun: event.target.value === 'dryRun',
            })
          }
        >
          <option value="mock">Mock</option>
          <option value="dryRun">Dry Run</option>
          <option
            value="realRun"
            disabled={hostHealth?.realExecutionEnabled === false}
          >
            Real Run
          </option>
        </select>
      </label>

      {(config.executionMode ?? (config.dryRun ? 'dryRun' : 'mock')) ===
        'realRun' && (
        <p className="runtime-service-note">{t('realRunWarning')}</p>
      )}

      {(config.executionMode ?? (config.dryRun ? 'dryRun' : 'mock')) ===
        'dryRun' && (
        <p className="runtime-service-note">{t('dryRunCopy')}</p>
      )}

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

      <label className="inspector-field">
        <span>{t('runtimeHostUrl')}</span>
        <input
          type="text"
          value={config.runtimeHostUrl ?? ''}
          placeholder="http://127.0.0.1:8787"
          onChange={(event) => onChange({ runtimeHostUrl: event.target.value })}
        />
      </label>

      <label className="inspector-field">
        <span>{t('runtimeHostToken')}</span>
        <input
          type="text"
          value={config.runtimeHostToken ?? ''}
          placeholder={t('optional')}
          onChange={(event) => onChange({ runtimeHostToken: event.target.value })}
        />
      </label>

      {config.mode === 'localService' && (
        <p className="runtime-service-note">{t('localServiceRuntimeCopy')}</p>
      )}

      <div className={`runtime-health-card status-${health.status}`}>
        <strong>{t('healthCheck')}</strong>
        <span>{health.message}</span>
      </div>

      <div className={`runtime-health-card status-${hostHealth?.ok ? 'available' : 'unavailable'}`}>
        <strong>{t('runtimeHostHealth')}</strong>
        <span>
          {hostHealthStatus ||
            (hostHealth?.ok
              ? `${hostHealth.host} ${hostHealth.version}`
              : t('hostNotChecked'))}
        </span>
        {hostHealth?.allowedProviders && (
          <span>{hostHealth.allowedProviders.join(', ')}</span>
        )}
        {hostHealth && (
          <span>
            {t('realExecution')}: {hostHealth.realExecutionEnabled ? t('enabled') : t('off')}
          </span>
        )}
        {hostHealth?.port && <span>port: {hostHealth.port}</span>}
        <button type="button" className="runtime-reset-button" onClick={onCheckHost}>
          {t('checkHost')}
        </button>
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
