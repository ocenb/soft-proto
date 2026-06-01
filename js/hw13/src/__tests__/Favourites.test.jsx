import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AppProvider } from '../context/AppContext'
import Favourites from '../pages/Favourites'
import Details from '../pages/Details'

// Mock the API client
jest.mock('../api/client', () => ({
  fetchStudentById: jest.fn()
}))

import { fetchStudentById } from '../api/client'

const mockStudent = {
  id: 42,
  first_name: 'Алексей',
  last_name: 'Смирнов',
  faculty: 'Математика',
  grades: [
    { id: 1, subject: 'Алгебра', score: 5 },
    { id: 2, subject: 'Геометрия', score: 5 }
  ]
}

describe('Favourites Component and Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  test('Favourites page shows empty state initially', () => {
    render(
      <MemoryRouter>
        <AppProvider>
          <Favourites />
        </AppProvider>
      </MemoryRouter>
    )

    expect(screen.getByText('В списке избранного пока ничего нет.')).toBeInTheDocument()
  })

  test('Allows adding to favorites from Details page and viewing on Favourites page', async () => {
    fetchStudentById.mockResolvedValue(mockStudent)

    // Set token in localStorage to bypass Auth check
    localStorage.setItem('students_api_token', 'valid-token')

    const { unmount } = render(
      <MemoryRouter initialEntries={['/list/42']}>
        <AppProvider>
          <Routes>
            <Route path="/list/:id" element={<Details />} />
            <Route path="/favourites" element={<Favourites />} />
          </Routes>
        </AppProvider>
      </MemoryRouter>
    )

    // Wait for student details to load
    await waitFor(() => {
      expect(screen.getByText('Смирнов Алексей')).toBeInTheDocument()
    })

    // Click "Добавить в избранное"
    const addBtn = screen.getByRole('button', { name: 'Добавить в избранное' })
    fireEvent.click(addBtn)

    // Button text should change
    expect(screen.getByRole('button', { name: 'Удалить из избранного' })).toBeInTheDocument()

    // Verify localStorage has saved favorites
    const savedFavs = JSON.parse(localStorage.getItem('students_favorites'))
    expect(savedFavs).toHaveLength(1)
    expect(savedFavs[0].name).toBe('Смирнов Алексей')
    expect(savedFavs[0].quantity).toBe(1)

    // Unmount and render the Favourites page to check rendering
    unmount()

    render(
      <MemoryRouter initialEntries={['/favourites']}>
        <AppProvider>
          <Routes>
            <Route path="/favourites" element={<Favourites />} />
          </Routes>
        </AppProvider>
      </MemoryRouter>
    )

    // Expect favorite card to show
    expect(screen.getByText('Смирнов Алексей')).toBeInTheDocument()
    expect(screen.getByText('Факультет: Математика')).toBeInTheDocument()
    expect(screen.getByText('Средний балл: 5.0')).toBeInTheDocument()
    expect(screen.getByTestId('quantity-42')).toHaveTextContent('1')

    // Click increase quantity
    const incBtn = screen.getByLabelText('Increase quantity')
    fireEvent.click(incBtn)

    expect(screen.getByTestId('quantity-42')).toHaveTextContent('2')

    // Click decrease quantity
    const decBtn = screen.getByLabelText('Decrease quantity')
    fireEvent.click(decBtn)

    expect(screen.getByTestId('quantity-42')).toHaveTextContent('1')

    // Click Delete
    const removeBtn = screen.getByRole('button', { name: 'Удалить' })
    fireEvent.click(removeBtn)

    // Empty state should be visible
    expect(screen.getByText('В списке избранного пока ничего нет.')).toBeInTheDocument()
  })
})
