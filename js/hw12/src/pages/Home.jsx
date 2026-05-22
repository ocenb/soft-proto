import { useState } from 'react'
import { login, register } from '../api/client'
import { useContext } from 'react'
import { AppContext } from '../context/app-context'

export default function Home() {
  const { saveToken } = useContext(AppContext)
  const [username, setUsername] = useState('student')
  const [password, setPassword] = useState('student')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAuth = async (mode) => {
    setLoading(true)
    setError('')

    try {
      if (mode === 'register') {
        await register({ username, password })
      }

      const result = await login({ username, password })
      saveToken(result.access_token)
    } catch (authError) {
      setError(authError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="stack">
      <h2>Добро пожаловать</h2>
      <p>
        Это учебный каталог студентов с маршрутизацией, загрузкой данных и избранным.
      </p>
      <p>
        Для доступа к API нужен токен. Можно войти существующим пользователем или
        зарегистрировать нового.
      </p>

      <div className="card form-card">
        <label className="field">
          Логин
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="username"
          />
        </label>

        <label className="field">
          Пароль
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="password"
          />
        </label>

        <div className="row">
          <button type="button" onClick={() => handleAuth('login')} disabled={loading}>
            Войти
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => handleAuth('register')}
            disabled={loading}
          >
            Зарегистрироваться
          </button>
        </div>

        {loading && <p className="status">Загрузка...</p>}
        {error && <p className="error">Ошибка: {error}</p>}
      </div>
    </section>
  )
}
