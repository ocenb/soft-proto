import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchStudents } from '../api/client'
import { useContext } from 'react'
import { AppContext } from '../context/app-context'

export default function List() {
  const { token, students, setStudents } = useContext(AppContext)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token || students.length > 0) {
      return
    }

    let isMounted = true

    const loadStudents = async () => {
      setLoading(true)
      setError('')

      try {
        const result = await fetchStudents(token)
        if (isMounted) {
          setStudents(result)
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

    loadStudents()

    return () => {
      isMounted = false
    }
  }, [token, students.length, setStudents])

  if (!token) {
    return <p className="error">Сначала войдите на главной странице, чтобы получить токен API.</p>
  }

  return (
    <section className="stack">
      <h2>Список сущностей</h2>

      {loading && <p className="status">Загрузка списка...</p>}
      {error && <p className="error">Ошибка: {error}</p>}

      <div className="grid">
        {students.map((student) => {
          const averageScore =
            student.grades.length > 0
              ? (
                  student.grades.reduce((sum, grade) => sum + grade.score, 0) /
                  student.grades.length
                ).toFixed(1)
              : 'n/a'

          return (
            <article key={student.id} className="card">
              <h3>
                {student.last_name} {student.first_name}
              </h3>
              <p>Факультет: {student.faculty}</p>
              <p>Курсов с оценками: {student.grades.length}</p>
              <p>Средний балл: {averageScore}</p>
              <Link className="link-button" to={`/list/${student.id}`}>
                Подробнее
              </Link>
            </article>
          )
        })}
      </div>
    </section>
  )
}
