import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useContext } from 'react'
import { AppContext } from '../context/app-context'

export default function ProtectedRoute({ children }) {
  const { token, isTokenExpired } = useContext(AppContext)
  const location = useLocation()

  if (!token || isTokenExpired()) {
    // Pass the required error message to display in the login view
    return (
      <Navigate
        to="/login"
        state={{
          from: location,
          message: 'Сначала войдите на главной странице, чтобы получить токен API.',
        }}
        replace
      />
    )
  }

  return children
}
