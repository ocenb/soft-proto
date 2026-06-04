import { useMemo, useState, useEffect, useCallback } from 'react'
import { AppContext } from './app-context'
import { setUnauthorizedCallback } from '../api/client'

const TOKEN_KEY = 'students_api_token'
const FAVORITES_KEY = 'students_favorites'

function decodeToken(token) {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (e) {
    return null
  }
}

export function AppProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '')
  const [students, setStudents] = useState([])
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const saveToken = useCallback((nextToken) => {
    setToken(nextToken)
    if (nextToken) {
      localStorage.setItem(TOKEN_KEY, nextToken)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
  }, [])

  // Auto-logout when token expires
  const isTokenExpired = useCallback(() => {
    if (!token) return true
    const parts = token.split('.')
    if (parts.length !== 3) {
      return false // Simple mock token from tests, never expires
    }
    const decodedPayload = decodeToken(token)
    if (!decodedPayload) return false
    if (!decodedPayload.exp) return false
    return decodedPayload.exp < Math.floor(Date.now() / 1000)
  }, [token])

  const userName = useMemo(() => {
    if (!token) return ''
    const parts = token.split('.')
    if (parts.length !== 3) {
      return 'Студент'
    }
    const decodedPayload = decodeToken(token)
    if (!decodedPayload) return 'Студент'
    return decodedPayload.name || decodedPayload.email || decodedPayload.sub || 'Студент'
  }, [token])

  // Clear expired token on load or when timer triggers
  useEffect(() => {
    if (token) {
      const parts = token.split('.')
      if (parts.length === 3) {
        const decodedPayload = decodeToken(token)
        if (decodedPayload && decodedPayload.exp) {
          const expirationTimeMs = decodedPayload.exp * 1000
          const delay = expirationTimeMs - Date.now()
          if (delay <= 0) {
            saveToken('')
          } else {
            const timer = setTimeout(() => {
              saveToken('')
            }, delay)
            return () => clearTimeout(timer)
          }
        }
      }
    }
  }, [token, saveToken])

  // Bind API unauthorized callback
  useEffect(() => {
    if (typeof setUnauthorizedCallback === 'function') {
      setUnauthorizedCallback(() => {
        saveToken('')
      })
    }
    return () => {
      if (typeof setUnauthorizedCallback === 'function') {
        setUnauthorizedCallback(null)
      }
    }
  }, [saveToken])

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
  }, [favorites])

  const toggleFavorite = useCallback((student) => {
    const studentId = typeof student === 'object' && student !== null ? student.id : student
    setFavorites((prev) => {
      const exists = prev.find((item) => item.id === studentId)
      if (exists) {
        return prev.filter((item) => item.id !== studentId)
      } else {
        const detailedStudent =
          typeof student === 'object' && student !== null
            ? student
            : students.find((s) => s.id === studentId)

        const name = detailedStudent
          ? `${detailedStudent.last_name} ${detailedStudent.first_name}`
          : `Студент #${studentId}`
        const faculty = detailedStudent ? detailedStudent.faculty : 'Не указан'
        const gradesCount = detailedStudent?.grades ? detailedStudent.grades.length : 0
        const averageScore =
          detailedStudent?.grades && detailedStudent.grades.length > 0
            ? (
                detailedStudent.grades.reduce((sum, g) => sum + g.score, 0) /
                detailedStudent.grades.length
              ).toFixed(1)
            : 'n/a'

        return [
          ...prev,
          {
            id: studentId,
            name,
            faculty,
            gradesCount,
            averageScore,
            quantity: 1,
          },
        ]
      }
    })
  }, [students])

  const removeFavorite = useCallback((studentId) => {
    setFavorites((prev) => prev.filter((item) => item.id !== studentId))
  }, [])

  const updateFavoriteQuantity = useCallback((studentId, newQuantity) => {
    if (newQuantity <= 0) {
      setFavorites((prev) => prev.filter((item) => item.id !== studentId))
    } else {
      setFavorites((prev) =>
        prev.map((item) =>
          item.id === studentId ? { ...item, quantity: newQuantity } : item,
        ),
      )
    }
  }, [])

  const value = useMemo(
    () => ({
      token,
      saveToken,
      students,
      setStudents,
      favorites,
      toggleFavorite,
      removeFavorite,
      updateFavoriteQuantity,
      userName,
      isTokenExpired,
    }),
    [
      token,
      saveToken,
      students,
      favorites,
      toggleFavorite,
      removeFavorite,
      updateFavoriteQuantity,
      userName,
      isTokenExpired,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}


