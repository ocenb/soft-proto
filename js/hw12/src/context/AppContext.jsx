import { useMemo, useState } from 'react'
import { AppContext } from './app-context'

const TOKEN_KEY = 'students_api_token'

export function AppProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '')
  const [students, setStudents] = useState([])
  const [favorites, setFavorites] = useState([])

  const saveToken = (nextToken) => {
    setToken(nextToken)
    if (nextToken) {
      localStorage.setItem(TOKEN_KEY, nextToken)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
  }

  const toggleFavorite = (studentId) => {
    setFavorites((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId],
    )
  }

  const value = useMemo(
    () => ({
      token,
      saveToken,
      students,
      setStudents,
      favorites,
      toggleFavorite,
    }),
    [token, students, favorites],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
