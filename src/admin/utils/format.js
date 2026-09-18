export function formatRupees(amount) {
    const n = Number(amount)
    if (Number.isNaN(n)) return '₹0'
    return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 2 })
}

export function formatDate(isoString) {
    if (!isoString) return '—'
    const d = new Date(isoString)
    if (Number.isNaN(d.getTime())) return isoString
    return d.toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    })
}

// Accepts a bare video id, a youtu.be link, or a full youtube.com watch/embed
// link and returns just the 11-character video id — or the raw input if it
// doesn't look like a URL, so the field never silently eats what's typed.
export function extractYoutubeId(input) {
    if (!input) return ''
    const trimmed = input.trim()
    const patterns = [
        /(?:youtu\.be\/)([\w-]{11})/,
        /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
        /(?:youtube\.com\/embed\/)([\w-]{11})/,
        /(?:youtube\.com\/shorts\/)([\w-]{11})/,
    ]
    for (const re of patterns) {
        const match = trimmed.match(re)
        if (match) return match[1]
    }
    return trimmed
}