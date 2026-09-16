import { getStoredToken } from './auth';

const API_BASE = '/api';

function authHeaders() {
  const token = getStoredToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Token ${token}` } : {}),
  };
}

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      data.detail ||
      (data.non_field_errors && data.non_field_errors[0]) ||
      'An error occurred. Please try again.';
    throw new Error(msg);
  }
  return data;
}

/** Fetch all students (optionally search by name/email) */
export async function fetchStudents(search = '') {
  const url = search
    ? `${API_BASE}/students/?search=${encodeURIComponent(search)}`
    : `${API_BASE}/students/`;
  const res = await fetch(url, { headers: authHeaders() });
  return handleResponse(res);
}

/** Create a new student (admin only) */
export async function createStudent(payload) {
  const res = await fetch(`${API_BASE}/students/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

/** Update a student by ID */
export async function updateStudent(id, payload) {
  const res = await fetch(`${API_BASE}/students/${id}/`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

/** Deactivate (soft-delete) a student */
export async function deleteStudent(id) {
  const res = await fetch(`${API_BASE}/students/${id}/`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse(res);
}
