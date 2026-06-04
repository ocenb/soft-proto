import { useEffect, useState, useMemo } from 'react'
import { fetchStudents } from '../api/client'
import { useContext } from 'react'
import { AppContext } from '../context/app-context'
import { StudentCard } from '../components/StudentCard'

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

  const studentsWithGrades = useMemo(() => {
    return students.map((student) => {
      const averageScore =
        student.grades.length > 0
          ? (
              student.grades.reduce((sum, grade) => sum + grade.score, 0) /
              student.grades.length
            ).toFixed(1)
          : 'n/a'
      return {
        ...student,
        averageScore,
      }
    })
  }, [students])

  if (!token) {
    return <p className="error">Сначала войдите на главной странице, чтобы получить токен API.</p>
  }

  return (
    <section className="stack">
      <h2>Список сущностей</h2>

      {loading && <p className="status">Загрузка списка...</p>}
      {error && <p className="error">Ошибка: {error}</p>}

      <div className="grid">
        {studentsWithGrades.map((student) => (
          <StudentCard
            key={student.id}
            student={student}
            averageScore={student.averageScore}
          />
        ))}
      </div>
    </section>
  )
}

