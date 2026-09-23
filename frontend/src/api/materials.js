import { apiFetch, authHeaders, handleApiResponse, API_BASE } from './client';

export { authHeaders, handleApiResponse };

/** Fetch study materials with optional query filters (Admin or general) */
export async function fetchMaterials(params = {}) {
  const query = new URLSearchParams();
  if (params.subject_id) query.append('subject_id', params.subject_id);
  if (params.lab_id) query.append('lab_id', params.lab_id);
  if (params.file_type) query.append('file_type', params.file_type);
  if (params.q) query.append('q', params.q);

  const qs = query.toString() ? `?${query.toString()}` : '';
  return apiFetch(`/materials/${qs}`);
}

/** Fetch study materials for currently logged in student */
export async function fetchStudentMaterials(params = {}) {
  const query = new URLSearchParams();
  if (params.subject_id) query.append('subject_id', params.subject_id);
  if (params.lab_id) query.append('lab_id', params.lab_id);
  if (params.file_type) query.append('file_type', params.file_type);
  if (params.q) query.append('q', params.q);

  const qs = query.toString() ? `?${query.toString()}` : '';
  return apiFetch(`/student/materials/${qs}`);
}

/** Upload a new study material (FormData payload) */
export async function createMaterial(formData) {
  return apiFetch('/materials/', {
    method: 'POST',
    body: formData,
  });
}

/** Update an existing study material */
export async function updateMaterial(id, formDataOrJson) {
  return apiFetch(`/materials/${id}/`, {
    method: 'PATCH',
    body: formDataOrJson,
  });
}

/** Delete a study material */
export async function deleteMaterial(id) {
  return apiFetch(`/materials/${id}/`, {
    method: 'DELETE',
  });
}
