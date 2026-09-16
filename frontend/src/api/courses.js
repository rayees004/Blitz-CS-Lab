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

/** Fetch all available active courses/classes */
export async function fetchCourses() {
  const res = await fetch(`${API_BASE}/courses/`, { headers: authHeaders() });
  return handleResponse(res);
}

/** Fetch a single course with modules */
export async function fetchCourse(courseId) {
  const res = await fetch(`${API_BASE}/courses/${courseId}/`, { headers: authHeaders() });
  return handleResponse(res);
}

/** Create a new class */
export async function createCourse(payload) {
  const res = await fetch(`${API_BASE}/courses/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

/** Update a class */
export async function updateCourse(courseId, patch) {
  const res = await fetch(`${API_BASE}/courses/${courseId}/`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(patch),
  });
  return handleResponse(res);
}

/** Deactivate (soft-delete) a class */
export async function deleteCourse(courseId) {
  const res = await fetch(`${API_BASE}/courses/${courseId}/`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse(res);
}

/** Fetch modules for a class */
export async function fetchModules(courseId) {
  const res = await fetch(`${API_BASE}/courses/${courseId}/modules/`, { headers: authHeaders() });
  return handleResponse(res);
}

/** Add a module to a class */
export async function createModule(courseId, payload) {
  const res = await fetch(`${API_BASE}/courses/${courseId}/modules/`, {
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

/** Fetch all enrollments for a student */
export async function fetchStudentEnrollments(studentId) {
  const res = await fetch(`${API_BASE}/students/${studentId}/enrollments/`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

/** Enroll a student in a course */
export async function enrollStudent(studentId, courseId, feeStatus = 'DUE', notes = '') {
  const res = await fetch(`${API_BASE}/students/${studentId}/enrollments/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ course_id: courseId, fee_status: feeStatus, notes }),
  });
  return handleResponse(res);
}

/** Update enrollment: fee_status, is_on_hold, hold_reason, notes */
export async function updateEnrollment(enrollmentId, patch) {
  const res = await fetch(`${API_BASE}/enrollments/${enrollmentId}/`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(patch),
  });
  return handleResponse(res);
}

/** Remove a student from a course */
export async function removeEnrollment(enrollmentId) {
  const res = await fetch(`${API_BASE}/enrollments/${enrollmentId}/`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse(res);
}
