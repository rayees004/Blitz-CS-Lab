import { apiFetch, authHeaders, handleApiResponse, API_BASE } from './client';

export { authHeaders, handleApiResponse };

/** Fetch all active subjects with optional courseId and search query */
export async function fetchSubjects(params = {}) {
  const query = new URLSearchParams();
  if (params.courseId) query.append('course_id', params.courseId);
  if (params.q) query.append('q', params.q);

  const qs = query.toString() ? `?${query.toString()}` : '';
  return apiFetch(`/subjects/${qs}`);
}

/** Fetch single subject details */
export async function fetchSubject(subjectId) {
  return apiFetch(`/subjects/${subjectId}/`);
}

/** Create a new subject */
export async function createSubject(payload) {
  return apiFetch('/subjects/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** Update a subject */
export async function updateSubject(subjectId, patch) {
  return apiFetch(`/subjects/${subjectId}/`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

/** Deactivate (soft-delete) a subject */
export async function deleteSubject(subjectId) {
  return apiFetch(`/subjects/${subjectId}/`, {
    method: 'DELETE',
  });
}

/** Fetch all subjects belonging to a course */
export async function fetchCourseSubjects(courseId) {
  return apiFetch(`/courses/${courseId}/subjects/`);
}

/** Fetch modules belonging to a subject (course) */
export async function fetchSubjectModules(subjectId) {
  return apiFetch(`/subjects/${subjectId}/modules/`);
}

/** Add a module to a subject (course) */
export async function createSubjectModule(subjectId, payload) {
  return apiFetch(`/subjects/${subjectId}/modules/`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** Update a module */
export async function updateModule(moduleId, patch) {
  return apiFetch(`/modules/${moduleId}/`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

/** Delete a module */
export async function deleteModule(moduleId) {
  return apiFetch(`/modules/${moduleId}/`, {
    method: 'DELETE',
  });
}

/** Bulk assign/sync multiple subjects for a student */
export async function assignStudentSubjects(studentId, subjectIds, sync = true) {
  return apiFetch(`/students/${studentId}/assign-subjects/`, {
    method: 'POST',
    body: JSON.stringify({
      subject_ids: subjectIds,
      sync,
    }),
  });
}

/** Fetch subjects assigned to a student */
export async function fetchStudentSubjects(studentId) {
  return apiFetch(`/students/${studentId}/subjects/`);
}
