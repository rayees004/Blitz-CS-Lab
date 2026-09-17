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

/** Fetch all active labs with questions & hints */
export async function fetchLabs(params = {}) {
  const query = new URLSearchParams();
  if (params.category) query.append('category', params.category);
  if (params.difficulty) query.append('difficulty', params.difficulty);
  if (params.q) query.append('q', params.q);
  if (params.subject_id) query.append('subject_id', params.subject_id);
  if (params.course_id) query.append('course_id', params.course_id);

  const qs = query.toString() ? `?${query.toString()}` : '';
  const res = await fetch(`${API_BASE}/labs/${qs}`, { headers: authHeaders() });
  return handleResponse(res);
}

/** Fetch labs for a specific Course (Subject) */
export async function fetchSubjectLabs(subjectId) {
  const res = await fetch(`${API_BASE}/subjects/${subjectId}/labs/`, { headers: authHeaders() });
  return handleResponse(res);
}

/** Create a lab directly assigned to a Course (Subject) */
export async function createSubjectLab(subjectId, payload) {
  const res = await fetch(`${API_BASE}/subjects/${subjectId}/labs/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}


/** Fetch single lab detail */
export async function fetchLab(labId) {
  const res = await fetch(`${API_BASE}/labs/${labId}/`, { headers: authHeaders() });
  return handleResponse(res);
}

/** Create a new lab with nested questions and hints */
export async function createLab(payload) {
  const res = await fetch(`${API_BASE}/labs/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

/** Update an existing lab, including questions and hints */
export async function updateLab(labId, payload) {
  const res = await fetch(`${API_BASE}/labs/${labId}/`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

/** Archive or delete a lab */
export async function deleteLab(labId) {
  const res = await fetch(`${API_BASE}/labs/${labId}/`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse(res);
}

/** Seed sample labs into database */
export async function seedLabs() {
  const res = await fetch(`${API_BASE}/labs/seed/`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return handleResponse(res);
}

/** Fetch student labs with attendance status, scores, and progress statistics */
export async function fetchStudentLabs() {
  const res = await fetch(`${API_BASE}/student/labs/`, { headers: authHeaders() });
  return handleResponse(res);
}

/** Attend/start lab and get attendee workspace */
export async function attendStudentLab(labId) {
  const res = await fetch(`${API_BASE}/student/labs/${labId}/attend/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({}),
  });
  return handleResponse(res);
}

/** Get attendee workspace for a lab without resetting */
export async function fetchStudentLabWorkspace(labId) {
  const res = await fetch(`${API_BASE}/student/labs/${labId}/attend/`, { headers: authHeaders() });
  return handleResponse(res);
}

/** Submit a CTF flag or answer for a specific question */
export async function submitStudentLabFlag(labId, questionId, flag) {
  const res = await fetch(`${API_BASE}/student/labs/${labId}/submit/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      action: 'submit_flag',
      question_id: questionId,
      flag,
    }),
  });
  return handleResponse(res);
}

/** Unlock a hint with score deduction */
export async function unlockStudentLabHint(labId, questionId, hintId) {
  const res = await fetch(`${API_BASE}/student/labs/${labId}/submit/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      action: 'unlock_hint',
      question_id: questionId,
      hint_id: hintId,
    }),
  });
  return handleResponse(res);
}

/** Finalize and officially submit lab for final marks */
export async function finalizeStudentLab(labId) {
  const res = await fetch(`${API_BASE}/student/labs/${labId}/submit/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      action: 'finalize_submission',
    }),
  });
  return handleResponse(res);
}

/** Fetch all student lab submissions (admin view) */
export async function fetchLabSubmissions() {
  const res = await fetch(`${API_BASE}/lab-submissions/`, { headers: authHeaders() });
  return handleResponse(res);
}

/** Fetch student lab scores list based on Lab Foreign Key */
export async function fetchStudentLabScores() {
  const res = await fetch(`${API_BASE}/student/lab-scores/`, { headers: authHeaders() });
  return handleResponse(res);
}

