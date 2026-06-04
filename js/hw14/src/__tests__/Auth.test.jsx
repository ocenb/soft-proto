import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AppProvider } from '../context/AppContext'
import Login from '../pages/Login'
import ProtectedRoute from '../components/ProtectedRoute'
import { login } from '../api/client'

// Mock the API client login call
jest.mock('../api/client', () => ({
  login: jest.fn(),
  setUnauthorizedCallback: jest.fn(),
}))

describe('Authentication Pages and Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  test('validates email format and password length in Login form', async () => {
    render(
      <MemoryRouter>
        <AppProvider>
          <Login />
        </AppProvider>
      </MemoryRouter>
    )

    // Submit button should be enabled initially, but validation triggers on blur/submit
    const emailInput = screen.getByPlaceholderText('email@example.com')
    const passwordInput = screen.getByPlaceholderText('••••••••')
    const submitBtn = screen.getByRole('button', { name: 'Войти' })

    // Input invalid email and blur
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.blur(emailInput)
    expect(screen.getByText('Введите корректный E-mail (например, user@example.com)')).toBeInTheDocument()

    // Input short password and blur
    fireEvent.change(passwordInput, { target: { value: '123' } })
    fireEvent.blur(passwordInput)
    expect(screen.getByText('Пароль должен быть не менее 6 символов')).toBeInTheDocument()

    // Submit button should be disabled
    expect(submitBtn).toBeDisabled()

    // Provide valid email and password
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } })
    fireEvent.change(passwordInput, { target: { value: '123456' } })

    // Validation messages should disappear
    expect(screen.queryByText('Введите корректный E-mail (например, user@example.com)')).not.toBeInTheDocument()
    expect(screen.queryByText('Пароль должен быть не менее 6 символов')).not.toBeInTheDocument()
    expect(submitBtn).not.toBeDisabled()
  })

  test('submits successfully and stores token', async () => {
    const mockToken = 'header.payload.signature'
    login.mockResolvedValueOnce({ access_token: mockToken })

    render(
      <MemoryRouter initialEntries={['/login']}>
        <AppProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<div>Home Page</div>} />
          </Routes>
        </AppProvider>
      </MemoryRouter>
    )

    const emailInput = screen.getByPlaceholderText('email@example.com')
    const passwordInput = screen.getByPlaceholderText('••••••••')
    const submitBtn = screen.getByRole('button', { name: 'Войти' })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password123' })
      expect(localStorage.getItem('students_api_token')).toBe(mockToken)
      expect(screen.getByText('Home Page')).toBeInTheDocument()
    })
  })

  test('ProtectedRoute redirects unauthorized user to login page', async () => {
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <AppProvider>
          <Routes>
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <div>Secret content</div>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </AppProvider>
      </MemoryRouter>
    )

    // Should redirect to Login Page because there's no token
    await waitFor(() => {
      expect(screen.queryByText('Secret content')).not.toBeInTheDocument()
      expect(screen.getByText('Login Page')).toBeInTheDocument()
    })
  })
})
