import React from 'react'
import { Link } from 'react-router-dom'

export const StudentCard = React.memo(function StudentCard({ student, averageScore }) {
  return (
    <article className="card" data-testid={`student-card-${student.id}`}>
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
})
