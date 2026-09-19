// Central fetch wrapper for the admin panel.
//
// Every admin write call (POST/PUT/DELETE) needs the Bearer token from login;
// GET calls work without it too, but we send it anyway when we have one.
//
// IMPORTANT: there are two kinds of write calls in this app —
//   1. JSON calls        -> use apiSend()      (Content-Type: application/json)
//   2. File upload calls -> use apiSendForm()  (NO Content-Type header —
//                            the browser sets the multipart boundary itself)
// Never send a FormData body through apiSend(); it forces JSON headers and
// the server will reject it with 415 Unsupported Media Type.

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
const TOKEN_KEY = 'as_crackers_admin_token'

export function getToken() {
    return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
    localStorage.removeItem(TOKEN_KEY)
}

export class UnauthorizedError extends Error {
    constructor() {
        super('Unauthorized')
        this.name = 'UnauthorizedError'
    }
}

export class UnsupportedMediaTypeError extends Error {
    constructor(message = 'Unsupported request format') {
        super(message)
        this.name = 'UnsupportedMediaTypeError'
    }
}

async function handle(res) {
    if (res.status === 401) {
        clearToken()
        throw new UnauthorizedError()
    }

    if (res.status === 415) {
        throw new UnsupportedMediaTypeError()
    }

    if (!res.ok) {
        let message = `Request failed (${res.status})`
        try {
            const body = await res.json()
            message = body.error || message
        } catch {
            // response wasn't JSON, keep the generic message
        }
        throw new Error(message)
    }

    if (res.status === 204) return null

    const contentType = res.headers.get('content-type') || ''
    if (contentType.includes('application/json')) return res.json()
    return res
}

function authHeaders() {
    const token = getToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function apiGet(path) {
    const res = await fetch(`${API_BASE}${path}`, {
        headers: { ...authHeaders() },
    })
    return handle(res)
}

export async function apiSend(method, path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(body),
    })
    return handle(res)
}

export async function apiSendForm(method, path, formData) {
    const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers: { ...authHeaders() },
        body: formData,
    })
    return handle(res)
}

export async function apiDelete(path) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'DELETE',
        headers: { ...authHeaders() },
    })
    return handle(res)
}

export async function apiUpload(file) {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        headers: { ...authHeaders() },
        body: form,
    })
    return handle(res) // { url }
}

// Same endpoint as apiUpload, but reports progress (0-100). Used for videos,
// which take long enough on a phone connection that people need to see it moving.
export function apiUploadWithProgress(file, onProgress) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', `${API_BASE}/api/upload`)
        const token = getToken()
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)

        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
        }
        xhr.onload = () => {
            if (xhr.status === 401) {
                clearToken()
                return reject(new UnauthorizedError())
            }
            if (xhr.status === 413) return reject(new Error('File is too large for the server'))
            if (xhr.status < 200 || xhr.status >= 300) {
                let message = `Upload failed (${xhr.status})`
                try { message = JSON.parse(xhr.responseText).error || message } catch { /* keep generic */ }
                return reject(new Error(message))
            }
            try {
                resolve(JSON.parse(xhr.responseText)) // { url }
            } catch {
                reject(new Error('Unexpected response from server'))
            }
        }
        xhr.onerror = () => reject(new Error('Upload failed — check your internet connection (or the video may be too large)'))

        const form = new FormData()
        form.append('file', file)
        xhr.send(form)
    })
}

export async function apiLogin(password) {
    const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
    })
    return handle(res) // { token }
}

export async function apiDownloadPdf(path, filename) {
    const res = await fetch(`${API_BASE}${path}`, { headers: { ...authHeaders() } })

    if (res.status === 401) {
        clearToken()
        throw new UnauthorizedError()
    }
    if (!res.ok) throw new Error(`Download failed (${res.status})`)

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
}

export { API_BASE }