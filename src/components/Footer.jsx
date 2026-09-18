import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext.jsx'
import { categories } from '../data/categories.js'
import './Footer.css'

export default function Footer() {
  const { t, pickField } = useLanguage()
  const topCategories = categories.slice(0, 6)
  const [logoFailed, setLogoFailed] = useState(false)

  const address = import.meta.env.VITE_BUSINESS_ADDRESS || ''
  const email = import.meta.env.VITE_BUSINESS_EMAIL || ''
  const phone = import.meta.env.VITE_WHATSAPP_NUMBER || ''
  const altPhone = import.meta.env.VITE_ALT_PHONE || ''

  return (
    <footer className="site-footer">
      <div className="container footer-top">
        <div className="footer-grid">
          <div>
            <div className="brand-mark">
              <span className="mark">
                {logoFailed ? (
                  'AS'
                ) : (
                  <img
                    src="gayathiri.jpeg"
                    alt={t('brand.name')}
                    onError={() => setLogoFailed(true)}
                  />
                )}
              </span>
              <b>{t('brand.name')}</b>
            </div>
            <p>{t('footer.tagline')}</p>
            <div className="footer-social">
              <a href="https://www.facebook.com/share/1HFs1A1hY9/?mibextid=wwXIfr" aria-label="Facebook">f</a>
              <a href="https://www.instagram.com/gayathri_pyrotech" aria-label="Instagram">ig</a>
              <a href="https://youtube.com/@dharmadurai-q7d?si=n6F-c9a4Mvv_eXaf" aria-label="YouTube">yt</a>
            </div>
          </div>

          <div>
            <h4>{t('footer.quicklinks')}</h4>
            <ul>
              <li><Link to="/">{t('nav.home')}</Link></li>
              <li><Link to="/products">{t('nav.products')}</Link></li>
              <li><Link to="/categories">{t('nav.categories')}</Link></li>
              <li><Link to="/about">{t('nav.about')}</Link></li>
              <li><Link to="/contact">{t('nav.contact')}</Link></li>
            </ul>
          </div>

          <div>
            <h4>{t('footer.categories')}</h4>
            <ul>
              {topCategories.map((c) => (
                <li key={c.id}>
                  <Link to={`/products?category=${c.id}`}>{pickField(c, 'name')}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4>{t('footer.contact')}</h4>
            <div className="contact-line">📍 <span>{address}</span></div>
            <div className="contact-line">📞 <span>{phone && `+${phone}`}{altPhone && `, +${altPhone}`}</span></div>
            <div className="contact-line">✉️ <span>{email}</span></div>
          </div>
        </div>
      </div>

      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} {t('brand.name')}. {t('footer.rights')}</span>
        <span>{t('footer.note')}</span>
        <span className="footer-credit">Developed by Leno Tech</span>
        <Link to="/admin" className="footer-admin-link">Admin</Link>
      </div>
    </footer>
  )
}