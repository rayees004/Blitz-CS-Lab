import { apiFetch, authHeaders, handleApiResponse } from './client';

export { authHeaders, handleApiResponse };

/**
 * Fetch all classes (optionally filtered by search / active status)
 */
export async function fetchClasses(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.append('search', params.search);
  if (params.is_active !== undefined) query.append('is_active', params.is_active);
  const qs = query.toString() ? `?${query.toString()}` : '';
  return apiFetch(`/classes/${qs}`);
}

/**
 * Fetch details for a specific class (including assigned labs & students)
 */
export async function fetchClassDetail(id) {
  return apiFetch(`/classes/${id}/`);
}

/**
 * Create a new class
 */
export async function createClass(payload) {
  return apiFetch('/classes/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Update class details (name, code, description, is_active, lab_ids)
 */
export async function updateClass(id, payload) {
  return apiFetch(`/classes/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

/**
 * Delete a class
 */
export async function deleteClass(id) {
  return apiFetch(`/classes/${id}/`, {
    method: 'DELETE',
  });
}

/**
 * Assign or update labs for a class
 * payload: { lab_ids: [...] } or { add_lab_ids: [...], remove_lab_ids: [...] }
 */
export async function assignClassLabs(id, payload) {
  return apiFetch(`/classes/${id}/assign-labs/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Assign, remove, or set students for a class
 * payload: { student_ids: [...], action: 'assign'|'remove'|'set', access_mode: 'class_based'|'unrestricted' }
 */
export async function assignClassStudents(id, payload) {
  return apiFetch(`/classes/${id}/assign-students/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Fetch students enrolled in a class
 */
export async function fetchClassStudents(id) {
  return apiFetch(`/classes/${id}/students/`);
}

/**
 * Create a student directly within a class
 */
export async function createClassStudent(id, payload) {
  return apiFetch(`/classes/${id}/students/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
