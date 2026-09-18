import { useEffect, useState } from 'react'
import { apiUpload, apiSend, UnauthorizedError } from '../adminApi.js'
import { useAdminAuth } from '../AdminAuthContext.jsx'
import { fetchBanners, notifyBannersUpdated, BANNER_LIMIT } from '../../hooks/useBanners.js'

// Home page hero shows these as an auto-scrolling slider (5 max).
// Images upload through the same /api/upload endpoint Products uses;
// the ordered list is saved to the backend (banners table) so it's the
// same for every visitor and every admin device.

function makeId() {
    return `b_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

export default function BannerTab() {
    const { logout } = useAdminAuth()
    const [banners, setBanners] = useState([])
    const [loading, setLoading] = useState(true)
    const [uploadingId, setUploadingId] = useState(null)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [saved, setSaved] = useState(false)

    useEffect(() => {
        let active = true
        fetchBanners().then((data) => {
            if (!active) return
            setBanners(data.map((b) => ({ id: b.id ?? makeId(), url: b.url })))
            setLoading(false)
        })
        return () => { active = false }
    }, [])

    function handleUnauthorized() {
        logout()
    }

    async function handleFile(slotId, file) {
        if (!file) return
        setUploadingId(slotId)
        setError('')
        setSaved(false)
        try {
            const { url } = await apiUpload(file)
            setBanners((list) => list.map((b) => (b.id === slotId ? { ...b, url } : b)))
        } catch (err) {
            if (err instanceof UnauthorizedError) return handleUnauthorized()
            setError('Image upload failed: ' + err.message)
        } finally {
            setUploadingId(null)
        }
    }

    function addSlot() {
        if (banners.length >= BANNER_LIMIT) return
        setBanners((list) => [...list, { id: makeId(), url: '' }])
        setSaved(false)
    }

    function removeSlot(id) {
        setBanners((list) => list.filter((b) => b.id !== id))
        setSaved(false)
    }

    function move(id, dir) {
        setBanners((list) => {
            const i = list.findIndex((b) => b.id === id)
            const j = i + dir
            if (i < 0 || j < 0 || j >= list.length) return list
            const next = [...list]
            const [item] = next.splice(i, 1)
            next.splice(j, 0, item)
            return next
        })
        setSaved(false)
    }

    async function handleSave() {
        const withImages = banners.filter((b) => b.url)
        if (withImages.length === 0) {
            setError('Add at least one banner image before saving.')
            return
        }
        setSaving(true)
        setError('')
        try {
            const savedList = await apiSend(
                'PUT',
                '/api/banners',
                withImages.map((b) => ({ url: b.url }))
            )
            const normalized = savedList.map((b) => ({ id: b.id, url: b.url }))
            setBanners(normalized)
            notifyBannersUpdated(normalized)
            setSaved(true)
            setTimeout(() => setSaved(false), 2500)
        } catch (err) {
            if (err instanceof UnauthorizedError) return handleUnauthorized()
            setError('Save failed: ' + err.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <div className="admin-page"><p>Loading banners…</p></div>
    }

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <h2>Homepage Banner</h2>
                <div className="admin-page-actions">
                    <button className="btn-secondary" onClick={addSlot} disabled={banners.length >= BANNER_LIMIT}>
                        + Add slide ({banners.length}/{BANNER_LIMIT})
                    </button>
                    <button className="btn-primary" onClick={handleSave} disabled={uploadingId !== null || saving}>
                        {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save banner'}
                    </button>
                </div>
            </div>

            <p style={{ color: 'var(--admin-muted, #6b6480)', marginTop: -6, marginBottom: 18, fontSize: '0.9rem' }}>
                Upload up to {BANNER_LIMIT} images. They auto-scroll on the home page hero, in this order —
                use the arrows to reorder. Save to publish to the live site.
            </p>

            {error && <div className="admin-error">{error}</div>}

            <div className="banner-grid">
                {banners.map((b, i) => (
                    <div key={b.id} className="banner-slot">
                        <div className="banner-slot-num">Slide {i + 1}</div>
                        <div className="admin-image-upload banner-upload">
                            {b.url
                                ? <img src={b.url} alt={`Banner ${i + 1}`} className="admin-thumb-lg" />
                                : <div className="admin-thumb-lg admin-thumb-empty" />}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFile(b.id, e.target.files?.[0])}
                                disabled={uploadingId === b.id}
                            />
                            {uploadingId === b.id && <span>Uploading…</span>}
                        </div>
                        <div className="banner-slot-actions">
                            <button className="btn-secondary" onClick={() => move(b.id, -1)} disabled={i === 0}>↑ Up</button>
                            <button className="btn-secondary" onClick={() => move(b.id, 1)} disabled={i === banners.length - 1}>↓ Down</button>
                            <button className="btn-icon-danger" onClick={() => removeSlot(b.id)}>Remove</button>
                        </div>
                    </div>
                ))}
                {banners.length === 0 && (
                    <div className="admin-empty">No banner slides yet — click "+ Add slide" to start.</div>
                )}
            </div>
        </div>
    )
}
