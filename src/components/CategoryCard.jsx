import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useProducts } from '../hooks/useProducts.js'
import './CategoryCard.css'

function playClickSound() {
  try {
    const audio = new Audio('/sounds/product-pop.mp3')
    audio.volume = 0.5
    audio.play().catch(() => { })
  } catch {
    // no-op: audio not supported / blocked
  }
}

export default function CategoryCard({ category }) {
  const { pickField } = useLanguage()
  const [imgFailed, setImgFailed] = useState(false)
  const { products } = useProducts()
  const count = products.filter((p) => p.category === category.id).length
  const initials = category.name_en
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const name = pickField(category, 'name')

  const showImage = category.image && !imgFailed

  return (
    <Link
      to={`/products?category=${category.id}`}
      className="cat-card"
      onClick={playClickSound}
    >
      <span className="badge">
        {showImage ? (
          <img
            src={category.image}
            alt={name}
            onError={() => setImgFailed(true)}
          />
        ) : (
          initials
        )}
      </span>
      <span className="label">{name}</span>
      <span className="count">{count} items</span>
    </Link>
  )
}