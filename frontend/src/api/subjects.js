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

/** Fetch all active subjects with optional courseId and search query */
export async function fetchSubjects(params = {}) {
  const query = new URLSearchParams();
  if (params.courseId) query.append('course_id', params.courseId);
  if (params.q) query.append('q', params.q);

  const qs = query.toString() ? `?${query.toString()}` : '';
  const res = await fetch(`${API_BASE}/subjects/${qs}`, { headers: authHeaders() });
  return handleResponse(res);
}

/** Fetch single subject details */
export async function fetchSubject(subjectId) {
  const res = await fetch(`${API_BASE}/subjects/${subjectId}/`, { headers: authHeaders() });
  return handleResponse(res);
}

/** Create a new subject */
export async function createSubject(payload) {
  const res = await fetch(`${API_BASE}/subjects/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

/** Update a subject */
export async function updateSubject(subjectId, patch) {
  const res = await fetch(`${API_BASE}/subjects/${subjectId}/`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(patch),
  });
  return handleResponse(res);
}

/** Deactivate (soft-delete) a subject */
export async function deleteSubject(subjectId) {
  const res = await fetch(`${API_BASE}/subjects/${subjectId}/`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse(res);
}

/** Fetch all subjects belonging to a course */
export async function fetchCourseSubjects(courseId) {
  const res = await fetch(`${API_BASE}/courses/${courseId}/subjects/`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

/** Fetch modules belonging to a subject (course) */
export async function fetchSubjectModules(subjectId) {
  const res = await fetch(`${API_BASE}/subjects/${subjectId}/modules/`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

/** Add a module to a subject (course) */
export async function createSubjectModule(subjectId, payload) {
  const res = await fetch(`${API_BASE}/subjects/${subjectId}/modules/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

/** Update a module */
export async function updateModule(moduleId, patch) {
  const res = await fetch(`${API_BASE}/modules/${moduleId}/`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(patch),
  });
  return handleResponse(res);
}

/** Delete a module */
export async function deleteModule(moduleId) {
  const res = await fetch(`${API_BASE}/modules/${moduleId}/`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse(res);
}

/** Bulk assign/sync multiple subjects for a student */
export async function assignStudentSubjects(studentId, subjectIds, sync = true) {
  const res = await fetch(`${API_BASE}/students/${studentId}/assign-subjects/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      subject_ids: subjectIds,
      sync,
    }),
  });
  return handleResponse(res);
}

/** Fetch subjects assigned to a student */
export async function fetchStudentSubjects(studentId) {
  const res = await fetch(`${API_BASE}/students/${studentId}/subjects/`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

