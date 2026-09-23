import { apiFetch, authHeaders, handleApiResponse, API_BASE } from './client';

export { authHeaders, handleApiResponse };

/** Fetch all students (optionally search by name/email) */
export async function fetchStudents(search = '') {
  const url = search
    ? `/students/?search=${encodeURIComponent(search)}`
    : '/students/';
  return apiFetch(url);
}

/** Create a new student (admin only) */
export async function createStudent(payload) {
  return apiFetch('/students/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** Update a student by ID */
export async function updateStudent(id, payload) {
  return apiFetch(`/students/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

/** Deactivate (soft-delete) a student */
export async function deleteStudent(id) {
  return apiFetch(`/students/${id}/`, {
    method: 'DELETE',
  });
}
