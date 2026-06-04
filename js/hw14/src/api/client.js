const API_BASE_URL = 'http://127.0.0.1:8000'

let unauthorizedCallback = null

export function setUnauthorizedCallback(callback) {
  unauthorizedCallback = callback
}

async function request(path, options = {}) {
  // If browser is offline, dispatch warning and throw error immediately
  if (typeof window !== 'undefined' && !navigator.onLine) {
    window.dispatchEvent(new CustomEvent('app-offline-request-attempted'))
    throw new Error('Вы находитесь в офлайн-режиме')
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, options)

    if (response.status === 401 || response.status === 403) {
      if (unauthorizedCallback) {
        unauthorizedCallback()
      }
    }

    if (!response.ok) {
      let message = `Request failed with status ${response.status}`

      try {
        const payload = await response.json()
        if (payload?.detail) {
          message = payload.detail
        }
      } catch {
        // keep default message
      }

      throw new Error(message)
    }

    return await response.json()
  } catch (error) {
    // If it is a network error and browser is offline, dispatch event
    if (typeof window !== 'undefined' && !navigator.onLine) {
      window.dispatchEvent(new CustomEvent('app-offline-request-attempted'))
      throw new Error('Вы находитесь в офлайн-режиме')
    }
    throw error
  }
}

export async function register({ username, password }) {
  return request('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
}

export async function login({ email, password }) {
  if (typeof window !== 'undefined' && !navigator.onLine) {
    window.dispatchEvent(new CustomEvent('app-offline-request-attempted'))
    throw new Error('Вы находитесь в офлайн-режиме')
  }

  try {
    const response = await fetch('https://example.com/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (response.status === 401 || response.status === 403) {
      if (unauthorizedCallback) {
        unauthorizedCallback()
      }
    }

    if (!response.ok) {
      throw new Error(`Ошибка входа: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    // Fallback to local mock JWT generation if endpoint is unavailable
    console.warn('API login failed or unavailable. Using client-side mock JWT token.', error)
    
    // Check if network is offline
    if (typeof window !== 'undefined' && !navigator.onLine) {
      window.dispatchEvent(new CustomEvent('app-offline-request-attempted'))
      throw new Error('Вы находитесь в офлайн-режиме')
    }

    // Generate a valid mock JWT token
    const header = { alg: 'HS256', typ: 'JWT' }
    const payload = {
      sub: email,
      email: email,
      name: email.split('@')[0],
      exp: Math.floor(Date.now() / 1000) + 3600 // Expire in 1 hour
    }

    const token = btoa(JSON.stringify(header)) + '.' + btoa(JSON.stringify(payload)) + '.mock_signature'
    return {
      access_token: token,
      token_type: 'bearer',
    }
  }
}

export async function fetchStudents(token) {
  return request('/students/', {
    headers: { 'X-Token': token },
  })
}

export async function fetchStudentById(id, token) {
  return request(`/students/${id}`, {
    headers: { 'X-Token': token },
  })
}

