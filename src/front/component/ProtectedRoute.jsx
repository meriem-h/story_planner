import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, roles }) {
    const { user } = useAuth()

    if (!user) return <Navigate to="/" />
    
    if (roles && !roles.includes(user.role)) return <Navigate to="/" />

    return children
}