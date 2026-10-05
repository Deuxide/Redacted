import { useI18n } from '../i18n/LanguageProvider';
import { PRESETS, normalizeHex } from '../theme/theme';
import { useTheme } from '../theme/ThemeProvider';
import styles from './ThemePicker.module.css';

export function ThemePicker() {
  const { theme, setTheme } = useTheme();
  const { t } = useI18n();

  return (
    <section className={styles.block} aria-label={t('appearance')}>
      <h2>{t('appearance')}</h2>
      <p>{t('accentColor')}</p>
      <div className={styles.presets}>
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={theme.preset === preset.id ? styles.selected : styles.preset}
            aria-pressed={theme.preset === preset.id}
            onClick={() => setTheme({ preset: preset.id, color: preset.color })}
          >
            <span className={styles.swatch} style={{ background: preset.color }} aria-hidden="true" />
            {t(preset.id)}
          </button>
        ))}
      </div>
      <label className={styles.custom}>
        {t('customColor')}
        <input
          type="color"
          value={theme.color}
          aria-label={t('customColor')}
          onChange={(event) => {
            const color = normalizeHex(event.target.value);
            if (color) setTheme({ preset: 'custom', color });
          }}
        />
      </label>
      <div className={styles.preview}>
        <button type="button" className={styles.sample}>{t('primaryPreview')}</button>
        <p>{t('selectedColor')}: {theme.color}</p>
      </div>
    </section>
  );
}
