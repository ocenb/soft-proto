export default function About() {
  return (
    <section className="stack">
      <h2>О проекте</h2>
      <p>
        Это учебное React-приложение с маршрутизацией, загрузкой данных из FastAPI
        backend и глобальным состоянием через Context API.
      </p>
      <p>
        Реализованы страницы списка и деталей сущностей, обработка ошибок сети,
        индикаторы загрузки и избранное.
      </p>
    </section>
  )
}
