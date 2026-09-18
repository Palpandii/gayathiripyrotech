import { Link } from 'react-router-dom'
import Hero from '../components/Hero.jsx'
import CategoryCard from '../components/CategoryCard.jsx'
import ProductCard from '../components/ProductCard.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useCategories } from '../hooks/useCategories.js'
import { useProducts } from '../hooks/useProducts.js'
import { buildWhatsAppOrderUrl } from '../utils/whatsapp.js'
import './Home.css'

export default function Home() {
  const { t, lang } = useLanguage()
  const { categories, loading: categoriesLoading } = useCategories()
  const { products, loading: productsLoading } = useProducts()
  const featured = products.filter((p) => [8, 55, 89, 130, 152, 191, 9, 61].includes(p.id)).slice(0, 8)
  const enquiryUrl = buildWhatsAppOrderUrl([], 0, lang)

  return (
    <div className="page-shell">
      <Hero />

      <section className="home-section">
        <div className="container">
          <div className="section-head">
            <h2>{t('home.categoriesTitle')}</h2>
            <Link to="/categories" className="see-all">{t('cta.viewAll')}</Link>
          </div>
          {categoriesLoading ? (
            <p>Loading…</p>
          ) : (
            <div className="cat-rail">
              {categories.slice(0, 12).map((c) => (
                <CategoryCard key={c.id} category={c} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="home-section tinted">
        <div className="container">
          <div className="section-head">
            <h2>{t('home.featuredTitle')}</h2>
            <Link to="/products" className="see-all">{t('cta.viewAll')}</Link>
          </div>
          {productsLoading ? (
            <p>Loading…</p>
          ) : (
            <div className="product-grid">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="home-section">
        <div className="container">
          <div className="section-head" style={{ marginBottom: 24 }}>
            <h2>{t('home.whyTitle')}</h2>
          </div>
          <div className="why-grid">
            <div className="why-card">
              <div className="num">1</div>
              <h3>{t('home.why1t')}</h3>
              <p>{t('home.why1d')}</p>
            </div>
            <div className="why-card">
              <div className="num">2</div>
              <h3>{t('home.why2t')}</h3>
              <p>{t('home.why2d')}</p>
            </div>
            <div className="why-card">
              <div className="num">3</div>
              <h3>{t('home.why3t')}</h3>
              <p>{t('home.why3d')}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="home-section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="cta-strip">
            <div>
              <h3>{t('cta.whatsapp')}</h3>
              <p>{t('home.heroSub')}</p>
            </div>
            <a href={enquiryUrl} target="_blank" rel="noopener noreferrer" className="btn btn-gold">
              {t('cta.whatsapp')}
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}