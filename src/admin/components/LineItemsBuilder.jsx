import { useState, useRef, useEffect } from 'react'
import { formatRupees } from '../utils/format.js'

let nextRowId = 1

export function newRow() {
    return { rowId: nextRowId++, productId: '', productName: '', quantity: 1, unitPrice: 0 }
}

function NameCell({ row, products, onPick, onTyped }) {
    const [open, setOpen] = useState(false)
    const wrapRef = useRef(null)

    useEffect(() => {
        function handleClickOutside(e) {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const query = row.productName.trim().toLowerCase()
    const matches = query
        ? products
            .filter((p) => {
                const name = p.nameEn.toLowerCase()
                return name.startsWith(query) || name.split(' ').some((word) => word.startsWith(query))
            })
            .slice(0, 8)
        : []

    return (
        <div className="name-cell" ref={wrapRef}>
            <input
                type="text"
                value={row.productName}
                placeholder="Type to search item name…"
                autoComplete="off"
                onChange={(e) => { onTyped(e.target.value); setOpen(true) }}
                onFocus={() => setOpen(true)}
                required
            />
            {open && matches.length > 0 && (
                <ul className="name-suggestions">
                    {matches.map((p) => (
                        <li
                            key={p.id}
                            onMouseDown={() => { onPick(p); setOpen(false) }}
                        >
                            {p.nameEn}
                            {p.price != null && <span className="suggestion-price"> ₹{p.price}</span>}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

export default function LineItemsBuilder({ items, onChange, products }) {
    function updateRow(rowId, patch) {
        onChange(items.map((row) => (row.rowId === rowId ? { ...row, ...patch } : row)))
    }

    function addRow() {
        onChange([...items, newRow()])
    }

    function removeRow(rowId) {
        onChange(items.filter((row) => row.rowId !== rowId))
    }

    const grandTotal = items.reduce((sum, row) => sum + (Number(row.quantity) || 0) * (Number(row.unitPrice) || 0), 0)

    return (
        <div className="line-items">
            <table className="admin-table line-items-table">
                <thead>
                    <tr>
                        <th>Item name</th>
                        <th>Qty</th>
                        <th>Unit price</th>
                        <th>Line total</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((row, idx) => (
                        <tr key={row.rowId} className={idx % 2 === 0 ? 'line-row-even' : 'line-row-odd'}>
                            <td>
                                <NameCell
                                    row={row}
                                    products={products}
                                    onTyped={(value) => updateRow(row.rowId, { productName: value, productId: '' })}
                                    onPick={(product) =>
                                        updateRow(row.rowId, {
                                            productId: product.id,
                                            productName: product.nameEn,
                                            unitPrice: product.price ?? 0,
                                        })
                                    }
                                />
                            </td>
                            <td>
                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={row.quantity}
                                    onChange={(e) => updateRow(row.rowId, { quantity: e.target.value })}
                                    required
                                />
                            </td>
                            <td>
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={row.unitPrice}
                                    onChange={(e) => updateRow(row.rowId, { unitPrice: e.target.value })}
                                    required
                                />
                            </td>
                            <td className="line-total">
                                {formatRupees((Number(row.quantity) || 0) * (Number(row.unitPrice) || 0))}
                            </td>
                            <td>
                                <button
                                    type="button"
                                    className="btn-icon-danger"
                                    onClick={() => removeRow(row.rowId)}
                                    disabled={items.length === 1}
                                    title="Remove line"
                                >
                                    ✕
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="line-items-footer">
                <button type="button" className="btn-add-line" onClick={addRow}>+ Add line</button>
                <div className="grand-total">Total: <strong>{formatRupees(grandTotal)}</strong></div>
            </div>
        </div>
    )
}