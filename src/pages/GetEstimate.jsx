import { useState } from 'react'

// Public "get a free estimate" form — no login needed, mirrors how checkout
// posts an order. Hits POST /api/estimate-requests, which AdminAuthFilter
// leaves open for creation while keeping GET/PUT/DELETE admin-only.
//
// NOTE: uses a plain relative fetch() rather than adminApi.js, since this
// page lives outside AdminAuthProvider. If your checkout flow (order
// creation) builds its request URL differently — a base URL prefix, a
// shared apiPublicPost helper, etc. — swap the fetch call below to match
// that same pattern for consistency.

const emptyForm = () => ({
    customerName: '',
    customerPhone: '',
    customerCity: '',
    eventType: '',
    eventDate: '',
    requirements: '',
})

const EVENT_TYPES = ['Wedding', 'Temple festival', 'Birthday', 'Housewarming', 'Diwali', 'New Year', 'Other']

export default function GetEstimate() {
    const [form, setForm] = useState(emptyForm)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [done, setDone] = useState(false)

    async function handleSubmit(ev) {
        ev.preventDefault()
        if (!form.customerName.trim() || !form.customerPhone.trim()) {
            setError('Please share your name and phone number.')
            return
        }
        setSubmitting(true)
        setError('')
        try {
            const res = await fetch('/api/estimate-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            if (!res.ok) throw new Error('Could not submit right now. Please try again.')
            setDone(true)
        } catch (err) {
            setError(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    if (done) {
        return (
            <section className="get-estimate-page">
                <div className="get-estimate-card get-estimate-done">
                    <h1>Request received 🎉</h1>
                    <p>Thanks{form.customerName ? `, ${form.customerName}` : ''} — our team will call you at {form.customerPhone} shortly with a quote.</p>
                </div>
            </section>
        )
    }

    return (
        <section className="get-estimate-page">
            <div className="get-estimate-card">
                <h1>Get a free estimate</h1>
                <p className="get-estimate-sub">Tell us about your event and we'll call you back with a quote — no obligation.</p>

                <form onSubmit={handleSubmit} className="get-estimate-form">
                    <div className="get-estimate-row">
                        <div>
                            <label>Your name</label>
                            <input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
                        </div>
                        <div>
                            <label>Phone number</label>
                            <input value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} />
                        </div>
                    </div>

                    <div className="get-estimate-row">
                        <div>
                            <label>City / town</label>
                            <input value={form.customerCity} onChange={(e) => setForm({ ...form, customerCity: e.target.value })} />
                        </div>
                        <div>
                            <label>Event type</label>
                            <select value={form.eventType} onChange={(e) => setForm({ ...form, eventType: e.target.value })}>
                                <option value="">Select…</option>
                                {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>

                    <label>Event date (if known)</label>
                    <input type="date" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} />

                    <label>What are you looking for?</label>
                    <textarea
                        rows={4}
                        placeholder="e.g. sparklers and flower pots for a family gathering, budget around ₹5,000…"
                        value={form.requirements}
                        onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                    />

                    {error && <div className="get-estimate-error">{error}</div>}

                    <button type="submit" className="btn-primary get-estimate-submit" disabled={submitting}>
                        {submitting ? 'Sending…' : 'Send my request'}
                    </button>
                </form>
            </div>
        </section>
    )
}