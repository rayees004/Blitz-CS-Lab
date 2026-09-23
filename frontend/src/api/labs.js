import { apiFetch, authHeaders, handleApiResponse, API_BASE } from './client';

export { authHeaders, handleApiResponse };

/** Fetch all active labs with questions & hints */
export async function fetchLabs(params = {}) {
  const query = new URLSearchParams();
  if (params.category) query.append('category', params.category);
  if (params.difficulty) query.append('difficulty', params.difficulty);
  if (params.q) query.append('q', params.q);
  if (params.subject_id) query.append('subject_id', params.subject_id);
  if (params.course_id) query.append('course_id', params.course_id);

  const qs = query.toString() ? `?${query.toString()}` : '';
  return apiFetch(`/labs/${qs}`);
}

/** Fetch labs for a specific Course (Subject) */
export async function fetchSubjectLabs(subjectId) {
  return apiFetch(`/subjects/${subjectId}/labs/`);
}

/** Create a lab directly assigned to a Course (Subject) */
export async function createSubjectLab(subjectId, payload) {
  const isForm = typeof FormData !== 'undefined' && payload instanceof FormData;
  return apiFetch(`/subjects/${subjectId}/labs/`, {
    method: 'POST',
    body: isForm ? payload : JSON.stringify(payload),
  });
}

/** Fetch single lab detail */
export async function fetchLab(labId) {
  return apiFetch(`/labs/${labId}/`);
}

/** Create a new lab with nested questions, hints, and optional video file/URL */
export async function createLab(payload) {
  const isForm = typeof FormData !== 'undefined' && payload instanceof FormData;
  return apiFetch('/labs/', {
    method: 'POST',
    body: isForm ? payload : JSON.stringify(payload),
  });
}

/** Update an existing lab, including questions, hints, and video file/URL */
export async function updateLab(labId, payload) {
  const isForm = typeof FormData !== 'undefined' && payload instanceof FormData;
  return apiFetch(`/labs/${labId}/`, {
    method: 'PATCH',
    body: isForm ? payload : JSON.stringify(payload),
  });
}

/** Delete a lab */
export async function deleteLab(labId) {
  return apiFetch(`/labs/${labId}/`, {
    method: 'DELETE',
  });
}

/** Seed predefined initial labs */
export async function seedLabs() {
  return apiFetch('/labs/seed/', {
    method: 'POST',
  });
}

/** Fetch student-specific labs list with completion & enrolled course filters */
export async function fetchStudentLabs() {
  return apiFetch('/student/labs/');
}

/** Fetch student attend state for a specific lab */
export async function fetchStudentLabAttendState(labId) {
  return apiFetch(`/student/labs/${labId}/attend/`);
}

/** Alias for fetchStudentLabAttendState used by StudentLabAttendModal */
export const attendStudentLab = fetchStudentLabAttendState;

/** Submit a CTF flag or answer for a specific question */
export async function submitStudentLabFlag(labId, questionId, flag) {
  return apiFetch(`/student/labs/${labId}/submit/`, {
    method: 'POST',
    body: JSON.stringify({
      action: 'submit_flag',
      question_id: questionId,
      flag,
    }),
  });
}

/** Unlock a hint with score deduction */
export async function unlockStudentLabHint(labId, questionId, hintId) {
  return apiFetch(`/student/labs/${labId}/submit/`, {
    method: 'POST',
    body: JSON.stringify({
      action: 'unlock_hint',
      question_id: questionId,
      hint_id: hintId,
    }),
  });
}

/** Finalize and officially submit lab for final marks */
export async function finalizeStudentLab(labId) {
  return apiFetch(`/student/labs/${labId}/submit/`, {
    method: 'POST',
    body: JSON.stringify({
      action: 'finalize_submission',
    }),
  });
}

/** Fetch all student lab submissions (admin view) */
export async function fetchLabSubmissions() {
  return apiFetch('/lab-submissions/');
}

/** Fetch student lab scores list based on Lab Foreign Key */
export async function fetchStudentLabScores() {
  return apiFetch('/student/lab-scores/');
}
