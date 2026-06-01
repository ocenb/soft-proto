import { useMemo, useState, useEffect, useCallback } from 'react'
import { AppContext } from './app-context'

const TOKEN_KEY = 'students_api_token'
const FAVORITES_KEY = 'students_favorites'

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
    }),
    [
      token,
      saveToken,
      students,
      favorites,
      toggleFavorite,
      removeFavorite,
      updateFavoriteQuantity,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

