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

/** Fetch unified live student activity stream (admin feed) */
export async function fetchStudentActivity(params = {}) {
  const query = new URLSearchParams();
  if (params.student_id) query.append('student_id', params.student_id);
  if (params.q) query.append('q', params.q);
  const qs = query.toString() ? `?${query.toString()}` : '';
  return apiFetch(`/student-activity/${qs}`);
}

/** Fetch comprehensive student progress, attended labs, scores and overall listing */
export async function fetchStudentProgress(params = {}) {
  const query = new URLSearchParams();
  if (params.student_id) query.append('student_id', params.student_id);
  const qs = query.toString() ? `?${query.toString()}` : '';
  return apiFetch(`/student-progress/${qs}`);
}

/** Fetch live admin dashboard statistics computed directly from database */
export async function fetchAdminDashboardStats() {
  return apiFetch('/admin/dashboard-stats/');
}

/** Grant student retake permission for a completed or blocked practical lab */
export async function grantLabRetakePermission(studentId, labId, resetScore = true) {
  return apiFetch('/admin/labs/retake-permission/', {
    method: 'POST',
    body: JSON.stringify({
      student_id: studentId,
      lab_id: labId,
      reset_score: resetScore,
    }),
  });
}

/** Student sends a retake request for a completed or locked lab */
export async function requestStudentLabRetake(labId, reason = '') {
  return apiFetch(`/student/labs/${labId}/retake-request/`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

/** Check student retake request status for a specific lab */
export async function fetchStudentLabRetakeStatus(labId) {
  return apiFetch(`/student/labs/${labId}/retake-request/`);
}

/** Admin fetches list of student retake requests */
export async function fetchAdminRetakeRequests(status = 'PENDING') {
  const qs = status ? `?status=${status}` : '';
  return apiFetch(`/admin/labs/retake-requests/${qs}`);
}

/** Admin reviews (approve or reject) a student retake request */
export async function reviewAdminRetakeRequest(requestId, action, note = '', resetScore = false) {
  return apiFetch(`/admin/labs/retake-requests/${requestId}/action/`, {
    method: 'POST',
    body: JSON.stringify({
      action,
      note,
      reset_score: resetScore,
    }),
  });
}



