import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppProvider } from '../context/AppContext'
import App from '../App'

// Mock the API client
jest.mock('../api/client', () => ({
  login: jest.fn(),
  register: jest.fn(),
  fetchStudents: jest.fn(),
  fetchStudentById: jest.fn(),
}))

describe('App Routing and Layout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  test('renders navigation layout and default home page', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppProvider>
          <App />
        </AppProvider>
      </MemoryRouter>
    )

    // Wait for the lazy loaded Layout/Home components to mount
    await waitFor(() => {
      expect(screen.getByText('Students Catalog')).toBeInTheDocument()
    })

    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'List' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Favourites' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'About' })).toBeInTheDocument()

    // Verify welcome text
    expect(screen.getByText('Добро пожаловать')).toBeInTheDocument()
  })

  test('renders about page when navigating to /about', async () => {
    render(
      <MemoryRouter initialEntries={['/about']}>
        <AppProvider>
          <App />
        </AppProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('О проекте')).toBeInTheDocument()
    })
  })

  test('shows login prompt on List page when token is missing', async () => {
    render(
      <MemoryRouter initialEntries={['/list']}>
        <AppProvider>
          <App />
        </AppProvider>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/Сначала войдите на главной странице/i)).toBeInTheDocument()
    })
  })
})
