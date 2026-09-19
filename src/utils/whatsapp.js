const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || ''

export function buildWhatsAppOrderUrl(items, totalPrice, lang = 'en', customer = {}) {
  const isTa = lang === 'ta'
  const { customerName = '', customerPhone = '', fulfillment = 'pickup', deliveryAddress = '' } = customer
  const lines = []

  lines.push(isTa ? 'வணக்கம் Gayathiri Pyrotech 🎆' : 'Hello Gayathiri Pyrotech 🤩')
  lines.push(isTa ? 'கீழ்க்கண்ட ஆர்டர் வேண்டும்:' : 'I would like to order:')
  lines.push('')

  if (customerName.trim()) {
    lines.push(`${isTa ? 'பெயர்' : 'Name'}: ${customerName.trim()}`)
  }
  if (customerPhone.trim()) {
    lines.push(`${isTa ? 'எண்' : 'Phone'}: ${customerPhone.trim()}`)
  }
  const fulfillmentLabel = fulfillment === 'delivery'
    ? (isTa ? 'டெலிவரி' : 'Delivery')
    : (isTa ? 'கடையில் வாங்குதல்' : 'Store pickup')
  lines.push(`${isTa ? 'முறை' : 'Fulfillment'}: ${fulfillmentLabel}`)
  if (fulfillment === 'delivery' && deliveryAddress.trim()) {
    lines.push(`${isTa ? 'முகவரி' : 'Address'}: ${deliveryAddress.trim()}`)
  }
  lines.push('')

  if (items.length === 0) {
    lines.push(isTa ? '(தயவுசெய்து பொருட்களை தேர்வு செய்யவும்)' : '(please share your product list)')
  } else {
    items.forEach((item, idx) => {
      const name = isTa ? item.name_ta || item.name_en : item.name_en
      lines.push(`${idx + 1}. ${name} — ${item.qty} x ₹${item.price} = ₹${(item.qty * item.price).toFixed(2)}`)
    })
    lines.push('')
    lines.push(`${isTa ? 'மொத்தம்' : 'Total'}: ₹${totalPrice.toFixed(2)}`)
  }

  const text = encodeURIComponent(lines.join('\n'))
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`
}

export function buildWhatsAppEnquiryUrl(productName, lang = 'en') {
  const text = encodeURIComponent(
    lang === 'ta'
      ? `வணக்கம், "${productName}" பற்றி விவரம் வேண்டும்.`
      : `Hello, I'd like details about "${productName}".`
  )
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`
}