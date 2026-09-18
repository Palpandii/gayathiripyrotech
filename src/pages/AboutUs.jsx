import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext.jsx'
import './ContentPages.css'

export default function AboutUs() {
  const { t } = useLanguage()
  const values = [t('about.v1'), t('about.v2'), t('about.v3'), t('about.v4')]
  const [logoFailed, setLogoFailed] = useState(false)

  return (
    <div className="page-shell">
      <div className="page-banner">
        <div className="container">
          <span className="crumb">{t('nav.home')} / <b>{t('nav.about')}</b></span>
          <h1>{t('about.title')}</h1>
          <p>{t('about.sub')}</p>
        </div>
      </div>

      <div className="container content-layout">
        <div>
          <p>{t('about.body1')}</p>
          <p>{t('about.body2')}</p>

          <h3 style={{ marginTop: 26, marginBottom: 4, color: 'var(--ink)' }}>{t('about.valuesTitle')}</h3>
          <ul className="values-list">
            {values.map((v, i) => (
              <li key={i}>
                <span className="tick">✓</span>
                <span>{v}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="about-visual">
          <div>
            <div className="fig">
              {logoFailed ? (
                '🎆'
              ) : (
                <img
                  src="gayathiri.jpeg"
                  alt={t('brand.name')}
                  onError={() => setLogoFailed(true)}
                  style={{ width: '100%', height: '100%', maxWidth: "400px", maxHeight: '400', borderRadius: '50%', objectFit: 'cover' }}
                />
              )}
            </div>
            <p style={{ margin: 0, opacity: 0.85 }}>Sivakasi, Virudhunagar<br />Fireworks Capital of India</p>
          </div>
        </div>
      </div>
    </div>
  )
}