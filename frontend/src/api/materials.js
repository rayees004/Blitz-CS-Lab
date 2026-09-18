import { getStoredToken } from './auth';

const API_BASE = '/api';

function authHeaders(isMultipart = false) {
  const token = getStoredToken();
  const headers = {};
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }
  return headers;
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

/** Fetch study materials with optional query filters (Admin or general) */
export async function fetchMaterials(params = {}) {
  const query = new URLSearchParams();
  if (params.subject_id) query.append('subject_id', params.subject_id);
  if (params.lab_id) query.append('lab_id', params.lab_id);
  if (params.file_type) query.append('file_type', params.file_type);
  if (params.q) query.append('q', params.q);

  const qs = query.toString() ? `?${query.toString()}` : '';
  const res = await fetch(`${API_BASE}/materials/${qs}`, { headers: authHeaders() });
  return handleResponse(res);
}

/** Fetch study materials for currently logged in student */
export async function fetchStudentMaterials(params = {}) {
  const query = new URLSearchParams();
  if (params.subject_id) query.append('subject_id', params.subject_id);
  if (params.lab_id) query.append('lab_id', params.lab_id);
  if (params.file_type) query.append('file_type', params.file_type);
  if (params.q) query.append('q', params.q);

  const qs = query.toString() ? `?${query.toString()}` : '';
  const res = await fetch(`${API_BASE}/student/materials/${qs}`, { headers: authHeaders() });
  return handleResponse(res);
}

/** Upload a new study material (FormData payload) */
export async function createMaterial(formData) {
  const res = await fetch(`${API_BASE}/materials/`, {
    method: 'POST',
    headers: authHeaders(true),
    body: formData,
  });
  return handleResponse(res);
}

/** Update an existing study material */
export async function updateMaterial(id, formDataOrJson) {
  const isMultipart = typeof FormData !== 'undefined' && formDataOrJson instanceof FormData;
  const res = await fetch(`${API_BASE}/materials/${id}/`, {
    method: 'PATCH',
    headers: authHeaders(isMultipart),
    body: isMultipart ? formDataOrJson : JSON.stringify(formDataOrJson),
  });
  return handleResponse(res);
}

/** Delete a study material */
export async function deleteMaterial(id) {
  const res = await fetch(`${API_BASE}/materials/${id}/`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse(res);
}
