import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useCart } from '../hooks/useCart.js'
import { buildWhatsAppOrderUrl } from '../utils/whatsapp.js'
import './CartDrawer.css'

export default function CartDrawer() {
  const { t, pickField, lang } = useLanguage()
  const { items, isOpen, setIsOpen, increment, decrement, removeItem, clearCart, totalPrice } = useCart()

  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [fulfillment, setFulfillment] = useState('pickup')

  if (!isOpen) return null

  const detailsMissing = customerName.trim() === '' || customerPhone.trim() === ''
  const canCheckout = items.length > 0 && !detailsMissing

  const whatsappUrl = buildWhatsAppOrderUrl(items, totalPrice, lang, {
    customerName,
    customerPhone,
    fulfillment,
  })

  return (
    <>
      <div className="cart-overlay" onClick={() => setIsOpen(false)} />
      <aside className="cart-drawer" role="dialog" aria-label={t('cart.title')}>
        <div className="head">
          <h3>{t('cart.title')}</h3>
          <button onClick={() => setIsOpen(false)} aria-label="Close cart">✕</button>
        </div>

        <div className="list">
          {items.length === 0 && <p className="empty">{t('cart.empty')}</p>}
          {items.map((item) => (
            <div className="cart-line" key={item.id}>
              <img src={item.image} alt="" onError={(e) => (e.currentTarget.style.visibility = 'hidden')} />
              <div className="info">
                <div className="name">{pickField(item, 'name')}</div>
                <div className="price">₹{item.price} × {item.qty} = ₹{(item.price * item.qty).toFixed(2)}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <button className="cart-line-btn" onClick={() => decrement(item)} aria-label="Decrease" style={qtyBtnStyle}>−</button>
                  <span style={{ fontWeight: 700, minWidth: 16, textAlign: 'center' }}>{item.qty}</span>
                  <button className="cart-line-btn" onClick={() => increment(item)} aria-label="Increase" style={qtyBtnStyle}>+</button>
                </div>
                <button className="remove" onClick={() => removeItem(item.id)}>{t('cart.remove')}</button>
              </div>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <div className="cart-customer-details" style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={detailsLabelStyle}>{t('cart.nameLabel')}</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={t('cart.namePlaceholder')}
                style={detailsInputStyle}
              />
            </div>
            <div>
              <label style={detailsLabelStyle}>{t('cart.phoneLabel')}</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder={t('cart.phonePlaceholder')}
                style={detailsInputStyle}
              />
            </div>
            <div>
              <label style={detailsLabelStyle}>{t('cart.fulfillment')}</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setFulfillment('pickup')}
                  style={fulfillmentBtnStyle(fulfillment === 'pickup')}
                >
                  {t('cart.pickup')}
                </button>
                <button
                  type="button"
                  onClick={() => setFulfillment('delivery')}
                  style={fulfillmentBtnStyle(fulfillment === 'delivery')}
                >
                  {t('cart.delivery')}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="foot">
          <div className="total-row">
            <span>{t('cart.total')}</span>
            <b>₹{totalPrice.toFixed(2)}</b>
          </div>
          {items.length > 0 && detailsMissing && (
            <p className="cart-details-hint" style={{ fontSize: 12, color: '#b45309', margin: '0 0 8px' }}>
              {t('cart.fillDetails')}
            </p>
          )}
          <div className="actions">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-emerald"
              style={{ width: '100%', opacity: canCheckout ? 1 : 0.5, pointerEvents: canCheckout ? 'auto' : 'none' }}
              onClick={(e) => { if (!canCheckout) e.preventDefault() }}
            >
              {t('cart.checkout')}
            </a>
          </div>
          {items.length > 0 && (
            <button className="clear-link" onClick={clearCart}>{t('cart.clear')}</button>
          )}
        </div>
      </aside>
    </>
  )
}

const detailsLabelStyle = {
  display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4, color: 'rgba(27,19,48,0.7)',
}

const detailsInputStyle = {
  width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(27,19,48,0.2)', fontSize: 14,
}

function fulfillmentBtnStyle(active) {
  return {
    flex: 1, padding: '8px 10px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer',
    border: active ? '1px solid #0f9d78' : '1px solid rgba(27,19,48,0.2)',
    background: active ? '#0f9d78' : '#fff',
    color: active ? '#fff' : '#1b1330',
  }
}

const qtyBtnStyle = {
  width: 24, height: 24, borderRadius: '50%', border: '1px solid rgba(27,19,48,0.2)',
  background: '#fff', fontWeight: 800, lineHeight: 1, cursor: 'pointer',
}