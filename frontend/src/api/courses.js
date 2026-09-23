import { apiFetch, authHeaders, handleApiResponse, API_BASE } from './client';

export { authHeaders, handleApiResponse };

/** Fetch all available active courses/classes */
export async function fetchCourses() {
  return apiFetch('/courses/');
}

/** Fetch a single course with modules */
export async function fetchCourse(courseId) {
  return apiFetch(`/courses/${courseId}/`);
}

/** Create a new class */
export async function createCourse(payload) {
  return apiFetch('/courses/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** Update a class */
export async function updateCourse(courseId, patch) {
  return apiFetch(`/courses/${courseId}/`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

/** Deactivate (soft-delete) a class */
export async function deleteCourse(courseId) {
  return apiFetch(`/courses/${courseId}/`, {
    method: 'DELETE',
  });
}

/** Fetch modules for a class */
export async function fetchModules(courseId) {
  return apiFetch(`/courses/${courseId}/modules/`);
}

/** Add a module to a class */
export async function createModule(courseId, payload) {
  return apiFetch(`/courses/${courseId}/modules/`, {
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

/** Fetch all enrollments for a student */
export async function fetchStudentEnrollments(studentId) {
  return apiFetch(`/students/${studentId}/enrollments/`);
}

/** Enroll a student in a course */
export async function enrollStudent(studentId, courseId, feeStatus = 'DUE', notes = '') {
  return apiFetch(`/students/${studentId}/enrollments/`, {
    method: 'POST',
    body: JSON.stringify({ course_id: courseId, fee_status: feeStatus, notes }),
  });
}

/** Update enrollment: fee_status, is_on_hold, hold_reason, notes */
export async function updateEnrollment(enrollmentId, patch) {
  return apiFetch(`/enrollments/${enrollmentId}/`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

/** Remove a student from a course */
export async function removeEnrollment(enrollmentId) {
  return apiFetch(`/enrollments/${enrollmentId}/`, {
    method: 'DELETE',
  });
}

/** Bulk assign multiple courses to a student (with sync option) */
export async function assignStudentCourses(studentId, courseIds, feeStatus = 'DUE', sync = true) {
  return apiFetch(`/students/${studentId}/assign-courses/`, {
    method: 'POST',
    body: JSON.stringify({ course_ids: courseIds, fee_status: feeStatus, sync }),
  });
}
