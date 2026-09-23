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


