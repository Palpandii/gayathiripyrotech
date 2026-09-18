import { useParams, Link, Navigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useCart } from '../hooks/useCart.js'
import { useProducts } from '../hooks/useProducts.js'
import { useCategories } from '../hooks/useCategories.js'
import ProductCard from '../components/ProductCard.jsx'
import QuantitySelector from '../components/QuantitySelector.jsx'
import { buildWhatsAppEnquiryUrl } from '../utils/whatsapp.js'
import './ProductDetail.css'

export default function ProductDetail() {
  const { id } = useParams()
  const { t, pickField, lang } = useLanguage()
  const { qtyOf, increment, decrement, setQty } = useCart()
  const { products, loading: productsLoading } = useProducts()
  const { categories, loading: categoriesLoading } = useCategories()

  if (productsLoading || categoriesLoading) {
    return (
      <div className="page-shell">
        <div className="container" style={{ padding: '60px 0' }}>
          <p>Loading…</p>
        </div>
      </div>
    )
  }

  const product = products.find((p) => String(p.id) === id)
  if (!product) return <Navigate to="/products" replace />

  const category = categories.find((c) => c.id === product.category)
  const qty = qtyOf(product.id)
  const related = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4)
  const enquiryUrl = buildWhatsAppEnquiryUrl(pickField(product, 'name'), lang)

  return (
    <div className="page-shell">
      <div className="page-banner" style={{ padding: '28px 0' }}>
        <div className="container">
          <span className="crumb">
            {t('nav.home')} / <Link to="/products">{t('nav.products')}</Link> /{' '}
            {category && <Link to={`/products?category=${category.id}`}>{pickField(category, 'name')}</Link>}
          </span>
        </div>
      </div>

      <div className="container detail-layout">
        <div>
          <div className="detail-media">
            <img
              src={product.image}
              alt={pickField(product, 'name')}
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                e.currentTarget.parentElement.innerHTML = '<div class="fallback">🎆</div>'
              }}
            />
          </div>
          {product.youtube_id && (
            <div className="detail-video">
              <p style={{ fontWeight: 700, marginBottom: 8 }}>{t('detail.video')}</p>
              <iframe
                src={`https://www.youtube.com/embed/${product.youtube_id}`}
                title={pickField(product, 'name')}
                allowFullScreen
              />
            </div>
          )}
        </div>

        <div className="detail-info">
          <span className="pack-tag">{product.qty_unit}</span>
          <h1>{pickField(product, 'name')}</h1>

          <div className="detail-price-box">
            <span className="now">₹{product.price}</span>
            {product.mrp > product.price && <span className="was">₹{product.mrp}</span>}
          </div>

          <div className="detail-row"><span>{t('detail.pack')}</span><span>{product.qty_unit}</span></div>
          <div className="detail-row"><span>{t('detail.mrp')}</span><span>₹{product.mrp}</span></div>
          <div className="detail-row"><span>{t('detail.rate')}</span><span>₹{product.price}</span></div>

          <div style={{ marginTop: 22 }}>
            <p style={{ fontWeight: 700, marginBottom: 10, fontSize: '0.85rem', color: 'rgba(27,19,48,0.6)' }}>
              {t('detail.qty')}
            </p>
            <QuantitySelector
              qty={qty}
              size="lg"
              onIncrement={() => increment(product)}
              onDecrement={() => decrement(product)}
              onChange={(v) => setQty(product, v)}
            />
          </div>

          <div className="detail-actions">
            <button className="btn btn-gold" onClick={() => qty === 0 && setQty(product, 1)}>
              {t('cta.addToCart')}
            </button>
            <a href={enquiryUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline-ink">
              {t('cta.enquire')}
            </a>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="container related-section">
          <div className="section-head">
            <h2>{t('detail.related')}</h2>
          </div>
          <div className="product-grid">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}