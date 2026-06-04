import React, { useState, useContext } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { AppContext } from '../context/app-context'
import { login } from '../api/client'

export default function Login() {
  const { token, saveToken, isTokenExpired } = useContext(AppContext)
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [emailTouched, setEmailTouched] = useState(false)
  const [passwordTouched, setPasswordTouched] = useState(false)

  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  // Determine redirect target path
  const from = location.state?.from?.pathname || '/'
  const promptMessage = location.state?.message

  // Validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const isEmailValid = emailRegex.test(email)
  const isPasswordValid = password.length >= 6

  const emailError = emailTouched && !isEmailValid ? 'Введите корректный E-mail (например, user@example.com)' : ''
  const passwordError = passwordTouched && !isPasswordValid ? 'Пароль должен быть не менее 6 символов' : ''

  const isFormValid = isEmailValid && isPasswordValid

  // Redirect if already logged in
  if (token && !isTokenExpired()) {
    return <Navigate to={from} replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setEmailTouched(true)
    setPasswordTouched(true)

    if (!isFormValid) return

    setLoading(true)
    setApiError('')

    try {
      const result = await login({ email, password })
      saveToken(result.access_token)
      navigate(from, { replace: true })
    } catch (err) {
      setApiError(err.message || 'Ошибка авторизации. Пожалуйста, проверьте данные.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="stack login-section">
      <div className="card form-card login-card">
        <h2>Вход в систему</h2>

        {promptMessage && (
          <p className="error login-prompt">
            {promptMessage}
          </p>
        )}

        {apiError && (
          <p className="error login-api-error">
            {apiError}
          </p>
        )}

        <form onSubmit={handleSubmit} className="stack login-form">
          <label className="field">
            E-mail
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setEmailTouched(true)}
              placeholder="email@example.com"
              disabled={loading}
              className={emailError ? 'input-error' : ''}
              required
            />
            {emailError && <span className="field-error-msg">{emailError}</span>}
          </label>

          <label className="field">
            Пароль
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setPasswordTouched(true)}
              placeholder="••••••••"
              disabled={loading}
              className={passwordError ? 'input-error' : ''}
              required
            />
            {passwordError && <span className="field-error-msg">{passwordError}</span>}
          </label>

          <button
            type="submit"
            disabled={loading || (!isFormValid && (emailTouched || passwordTouched))}
            className="login-btn"
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
      </div>
    </section>
  )
}
