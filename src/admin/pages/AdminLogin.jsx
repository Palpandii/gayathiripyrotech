import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAdminAuth } from '../AdminAuthContext.jsx'

export default function AdminLogin() {
    const { login } = useAdminAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const from = location.state?.from || '/admin/products'

    async function handleSubmit(e) {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            await login(password)
            navigate(from, { replace: true })
        } catch (err) {
            setError(err.message === 'Request failed (401)' ? 'Wrong password' : (err.message || 'Login failed'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="admin-login-screen">
            <form className="admin-login-card" onSubmit={handleSubmit}>
                <h1>Gayathiri Pyrotech Admin</h1>
                <p className="admin-login-sub">Enter the admin password to continue.</p>
                <label htmlFor="admin-password">Password</label>
                <input
                    id="admin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoFocus
                    required
                />
                {error && <div className="admin-error">{error}</div>}
                <button type="submit" className="btn-primary" disabled={loading || !password}>
                    {loading ? 'Checking…' : 'Log in'}
                </button>
            </form>
        </div>
    )
}