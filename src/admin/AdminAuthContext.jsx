import { createContext, useContext, useState, useCallback } from 'react'
import { apiLogin, getToken, setToken, clearToken } from './adminApi.js'

const AdminAuthContext = createContext(null)

export function AdminAuthProvider({ children }) {
    const [token, setTokenState] = useState(() => getToken())

    const login = useCallback(async (password) => {
        const { token: newToken } = await apiLogin(password)
        setToken(newToken)
        setTokenState(newToken)
    }, [])

    const logout = useCallback(() => {
        clearToken()
        setTokenState(null)
    }, [])

    return (
        <AdminAuthContext.Provider value={{ isLoggedIn: !!token, login, logout }}>
            {children}
        </AdminAuthContext.Provider>
    )
}

export function useAdminAuth() {
    const ctx = useContext(AdminAuthContext)
    if (!ctx) throw new Error('useAdminAuth must be used inside AdminAuthProvider')
    return ctx
}