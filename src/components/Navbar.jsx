import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useCart } from '../hooks/useCart.js'
import LanguageToggle from './LanguageToggle.jsx'
import './Navbar.css'

export default function Navbar() {
  const { t } = useLanguage()
  const { totalCount, setIsOpen } = useCart()
  const [query, setQuery] = useState('')
  const [logoFailed, setLogoFailed] = useState(false)
  const navigate = useNavigate()

  const submitSearch = (e) => {
    e.preventDefault()
    navigate(`/products${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`)
  }

  const links = [
    { to: '/', label: t('nav.home'), end: true },
    { to: '/products', label: t('nav.products') },
    { to: '/categories', label: t('nav.categories') },
    { to: '/about', label: t('nav.about') },
    { to: '/contact', label: t('nav.contact') },
  ]

  return (
    <header>
      <style>{`
        @keyframes sheenMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .nav-main-animated {
          background: linear-gradient(120deg,
              #fff7e8 0%,
              #ffe9b3 15%,
              #ffd1a6 30%,
              #ffb8c6 45%,
              #e2b8ff 60%,
              #b8d4ff 75%,
              #fff7e8 100%);
          background-size: 300% 100%;
          animation: sheenMove 12s ease-in-out infinite;
        }
      `}</style>

      <div className="nav-topstrip">
        <div className="container">
          <div className="lang-mini"><LanguageToggle compact /></div>
        </div>
      </div>

      <div className="nav-main nav-main-animated">
        <div className="container">
          <NavLink to="/" className="nav-brand">
            <span className="mark">
              {logoFailed ? (
                'AS'
              ) : (
                <img src="gayathiri.jpeg" alt={t('brand.name')} onError={() => setLogoFailed(true)} />
              )}
            </span>
            <span className="word">
              <b>{t('brand.name')}</b>
              <span>{t('brand.sub')}</span>
            </span>
          </NavLink>

          <form className="nav-search" onSubmit={submitSearch} role="search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder={t('search.placeholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </form>

          <div className="nav-actions">
            <button className="nav-cart-btn" onClick={() => setIsOpen(true)} aria-label="Open cart">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              <span>{t('cart.title')}</span>
              {totalCount > 0 && <span className="badge">{totalCount}</span>}
            </button>
          </div>
        </div>
      </div>

      <nav className="nav-links-row">
        <div className="container">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              {l.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </header>
  )
}