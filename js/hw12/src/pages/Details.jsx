import { useContext, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchStudentById } from '../api/client'
import { AppContext } from '../context/app-context'

const AVATAR_PLACEHOLDER = 'https://placehold.co/640x360?text=Student'

export default function Details() {
  const { id } = useParams()
  const { token, students, favorites, toggleFavorite } = useContext(AppContext)
  const cachedStudent = useMemo(
    () => students.find((student) => String(student.id) === id),
    [id, students],
  )

  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token || cachedStudent) {
      return
    }

    let isMounted = true

    const loadStudent = async () => {
      setLoading(true)
      setError('')

      try {
        const result = await fetchStudentById(id, token)
        if (isMounted) {
          setStudent(result)
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadStudent()

    return () => {
      isMounted = false
    }
  }, [id, token, cachedStudent])

  if (!token) {
    return <p className="error">Сначала войдите на главной странице, чтобы получить токен API.</p>
  }

  if (loading) {
    return <p className="status">Загрузка деталей...</p>
  }

  if (error) {
    return <p className="error">Ошибка: {error}</p>
  }

  const selectedStudent = cachedStudent || student

  if (!selectedStudent) {
    return <p>Сущность не найдена.</p>
  }

  const isFavorite = favorites.includes(selectedStudent.id)
  const fullName = `${selectedStudent.last_name} ${selectedStudent.first_name}`

  return (
    <section className="stack">
      <h2>{fullName}</h2>
      <div className="card details-card">
        <img src={AVATAR_PLACEHOLDER} alt={fullName} className="details-image" />

        <p>
          <strong>Факультет:</strong> {selectedStudent.faculty}
        </p>
        <p>
          <strong>Полное описание:</strong> Студент обучается на факультете{' '}
          {selectedStudent.faculty}. В профиле доступно оценок: {selectedStudent.grades.length}.
        </p>

        <button type="button" onClick={() => toggleFavorite(selectedStudent.id)}>
          {isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
        </button>

        <h3>Оценки</h3>
        <ul className="grades-list">
          {selectedStudent.grades.length === 0 && <li>Оценок пока нет.</li>}
          {selectedStudent.grades.map((grade) => (
            <li key={grade.id}>
              {grade.subject}: {grade.score}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
