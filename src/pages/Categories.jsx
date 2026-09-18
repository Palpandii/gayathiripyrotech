import CategoryCard from '../components/CategoryCard.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useCategories } from '../hooks/useCategories.js'

export default function Categories() {
  const { t } = useLanguage()
  const { categories, loading } = useCategories()

  return (
    <div className="page-shell">
      <div className="page-banner">
        <div className="container">
          <span className="crumb">{t('nav.home')} / <b>{t('nav.categories')}</b></span>
          <h1>{t('categories.title')}</h1>
          <p>{t('categories.sub')}</p>
        </div>
      </div>

      <div className="container" style={{ padding: '34px 0 60px' }}>
        {loading ? (
          <p>Loading…</p>
        ) : (
          <div className="cat-rail">
            {categories.map((c) => (
              <CategoryCard key={c.id} category={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}