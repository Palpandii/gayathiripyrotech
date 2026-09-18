import './QuantitySelector.css'

export default function QuantitySelector({ qty, onIncrement, onDecrement, onChange, size = 'md' }) {
  return (
    <div className={`qty-selector qty-${size}`}>
      <button
        type="button"
        className="qty-btn"
        onClick={onDecrement}
        disabled={qty <= 0}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <input
        type="number"
        min="0"
        value={qty}
        onChange={(e) => onChange?.(Number(e.target.value))}
        aria-label="Quantity"
      />
      <button type="button" className="qty-btn" onClick={onIncrement} aria-label="Increase quantity">
        +
      </button>
    </div>
  )
}
