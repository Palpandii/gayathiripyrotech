import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useBanners } from '../hooks/useBanners.js'
import './Hero.css'

const AUTO_SLIDE_MS = 4500

export default function Hero() {
  const { t } = useLanguage()
  const banners = useBanners()
  const [active, setActive] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    if (active >= banners.length) setActive(0)
  }, [banners, active])

  useEffect(() => {
    if (banners.length <= 1) return undefined
    timerRef.current = setInterval(() => {
      setActive((i) => (i + 1) % banners.length)
    }, AUTO_SLIDE_MS)
    return () => clearInterval(timerRef.current)
  }, [banners.length])

  function goTo(i) {
    clearInterval(timerRef.current)
    setActive(i)
  }

  return (
    <section className="hero">
      <div className="hero-rays" aria-hidden="true" />
      <div className="hero-glow" aria-hidden="true" />
      <div className="container hero-grid">
        <div className="hero-content">
          <span className="hero-kicker">
            <span className="dot" />
            {t('home.heroKicker')}
          </span>
          <h1>{t('home.heroTitle')}</h1>
          <p className="sub">{t('home.heroSub')}</p>

          <p
            style={{
              background: '#fff3cd',
              color: '#7a5c00',
              fontWeight: 700,
              padding: '8px 14px',
              borderRadius: 8,
              display: 'inline-block',
              fontSize: 14,
              marginBottom: 12,
            }}
          >
            ⚠️ Minimum Order: ₹3000
          </p>

          <div className="hero-ctas">
            <Link to="/products" className="btn btn-gold">{t('home.heroCta1')}</Link>
            <Link to="/categories" className="btn btn-ghost">{t('home.heroCta2')}</Link>
          </div>

          <div className="hero-stats-card">
            <div className="stat">
              <b>153</b>
              <span>{t('home.statBoxes')}</span>
            </div>
            <div className="stat-divider" />
            <div className="stat">
              <b>17</b>
              <span>{t('products.items')}</span>
            </div>
            <div className="stat-divider" />
            <div className="stat">
              <b>9+</b>
              <span>{t('home.statYears')}</span>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <span className="live-chip">
            <span className="dot" />
            Live
          </span>

          <div className="frame">
            <div
              className="slide-track"
              style={{ transform: `translateX(-${active * 100}%)` }}
            >
              {banners.map((b, i) => (
                <img
                  key={b.id || i}
                  src={b.url}
                  alt={`Gayathiri Pyrotech Sivakasi — banner ${i + 1}`}
                  className="hero-image"
                  loading={i === 0 ? 'eager' : 'lazy'}
                />
              ))}
            </div>
          </div>

          {banners.length > 1 && (
            <div className="slide-dots" role="tablist" aria-label="Banner slides">
              {banners.map((b, i) => (
                <button
                  key={b.id || i}
                  type="button"
                  role="tab"
                  aria-selected={i === active}
                  aria-label={`Show banner ${i + 1}`}
                  className={`dot-btn${i === active ? ' active' : ''}`}
                  onClick={() => goTo(i)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}