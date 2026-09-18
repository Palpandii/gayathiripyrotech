import { useLanguage } from '../context/LanguageContext.jsx'

export default function LanguageToggle({ compact = false }) {
  const { lang, toggleLang } = useLanguage()

  if (compact) {
    return (
      <button
        onClick={toggleLang}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'inherit',
          font: 'inherit',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
        aria-label="Toggle language"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        {lang === 'en' ? 'தமிழ்' : 'English'}
      </button>
    )
  }

  return (
    <div className="lang-switch">
      <button
        className={lang === 'en' ? 'is-active' : ''}
        onClick={() => lang !== 'en' && toggleLang()}
      >
        EN
      </button>
      <button
        className={lang === 'ta' ? 'is-active' : ''}
        onClick={() => lang !== 'ta' && toggleLang()}
      >
        தமிழ்
      </button>
    </div>
  )
}