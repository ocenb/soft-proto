const API_BASE_URL = 'http://127.0.0.1:8000'

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options)

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

  return response.json()
}

export async function register({ username, password }) {
  return request('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
}

export async function login({ username, password }) {
  return request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
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
