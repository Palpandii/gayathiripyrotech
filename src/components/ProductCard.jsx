import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useCart } from '../hooks/useCart.js'
import { useClickSound } from '../hooks/useClickSound.js'
import QuantitySelector from './QuantitySelector.jsx'
import './ProductCard.css'

export default function ProductCard({ product }) {
  const { t, pickField } = useLanguage()
  const { qtyOf, increment, decrement, setQty } = useCart()
  const qty = qtyOf(product.id)
  const name = pickField(product, 'name')
  const playClick = useClickSound()

  // Handles either camelCase or snake_case field naming from the API
  const outOfStock = product.inStock === false || product.in_stock === false

  const handleAdd = () => {
    if (outOfStock) return
    playClick()
    setQty(product, 1)
  }

  const handleIncrement = () => {
    playClick()
    increment(product)
  }

  const handleDecrement = () => {
    playClick()
    decrement(product)
  }

  const discountPct = product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0

  return (
    <div className={`product-card${outOfStock ? ' out-of-stock' : ''}`}>
      <Link to={`/product/${product.id}`} className="thumb-wrap">
        {discountPct > 0 && !outOfStock && <span className="discount-badge">{discountPct}% OFF</span>}
        {outOfStock && <span className="oos-badge">{t('product.outOfStock') || 'Out of Stock'}</span>}
        <ImageWithFallback src={product.image} alt={name} />
        {product.youtube_id && (
          <span className="yt-badge" aria-label="Has video">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          </span>
        )}
      </Link>

      <div className="body">
        <span className="pack-tag">{product.qty_unit}</span>
        <Link to={`/product/${product.id}`} className="name">{name}</Link>

        <div className="price-row">
          <span className="price">₹{product.price}</span>
          {product.mrp > product.price && <span className="mrp">₹{product.mrp}</span>}
        </div>

        <div className="footer-row">
          {outOfStock ? (
            <button className="add-btn add-btn-disabled" disabled>
              {t('product.outOfStock') || 'Out of Stock'}
            </button>
          ) : qty === 0 ? (
            <button className="add-btn" onClick={handleAdd}>{t('cta.addToCart')}</button>
          ) : (
            <QuantitySelector
              qty={qty}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
              onChange={(v) => setQty(product, v)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function ImageWithFallback({ src, alt }) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={(e) => {
        e.currentTarget.onerror = null
        e.currentTarget.style.display = 'none'
        e.currentTarget.parentElement.insertAdjacentHTML(
          'beforeend',
          '<div class="thumb-fallback">🎆</div>'
        )
      }}
    />
  )
}