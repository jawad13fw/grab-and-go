/**
 * Centralized error parsing & user-friendly message utilities.
 *
 * Every API call that catches an error should run it through `parseApiError()`
 * so the UI always shows a clear, actionable message instead of raw server text.
 */

// ---------------------------------------------------------------------------
// 1. Parse an Axios error (or any thrown object) into a structured shape
// ---------------------------------------------------------------------------
export function parseApiError(err) {
  // Already parsed
  if (err?._parsed) return err;

  const data = err?.response?.data;
  const status = err?.response?.status || 0;
  const structured = data?.error; // new structured format from backend

  // Build a normalised error object
  const parsed = {
    _parsed: true,
    status,
    code: structured?.code || data?.code || errorCodeFromStatus(status),
    title: structured?.title || friendlyTitle(status),
    message:
      structured?.message ||
      data?.message ||
      err?.message ||
      'Something went wrong. Please try again.',
    hint: structured?.hint || hintForStatus(status),
    field: structured?.field || null,
    errors: structured?.errors || data?.errors || null, // field-level errors
  };

  return parsed;
}

// ---------------------------------------------------------------------------
// 2. Extract a single human-readable string (for simple toast / alert usage)
// ---------------------------------------------------------------------------
export function getErrorMessage(err) {
  const parsed = parseApiError(err);
  return parsed.message;
}

// ---------------------------------------------------------------------------
// 3. Extract per-field errors as a map  { email: "Email is required", … }
// ---------------------------------------------------------------------------
export function getFieldErrors(err) {
  const parsed = parseApiError(err);
  if (!parsed.errors?.length) return {};
  return parsed.errors.reduce((map, e) => {
    map[e.field] = { message: e.message, hint: e.hint };
    return map;
  }, {});
}

// ---------------------------------------------------------------------------
// 4. Network-level fallbacks
// ---------------------------------------------------------------------------
function errorCodeFromStatus(status) {
  const map = {
    0: 'NETWORK_ERROR',
    400: 'BAD_REQUEST',
    401: 'AUTH_REQUIRED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'VALIDATION_ERROR',
    429: 'RATE_LIMITED',
    500: 'SERVER_ERROR',
    503: 'SERVICE_UNAVAILABLE',
  };
  return map[status] || 'UNKNOWN_ERROR';
}

function friendlyTitle(status) {
  const titles = {
    0: 'Connection problem',
    400: 'Invalid request',
    401: 'Login required',
    403: 'Access denied',
    404: 'Not found',
    409: 'Already exists',
    422: 'Validation failed',
    429: 'Too many requests',
    500: 'Server error',
    503: 'Service unavailable',
  };
  return titles[status] || 'Something went wrong';
}

function hintForStatus(status) {
  const hints = {
    0: 'Check your internet connection and try again.',
    401: 'Please log in and try again.',
    403: 'You don\'t have permission. Make sure you\'re using the right account.',
    404: 'The item you\'re looking for doesn\'t exist or has been moved.',
    429: 'Please wait a moment before trying again.',
    500: 'This is a problem on our end. Try refreshing the page.',
    503: 'The service is temporarily unavailable. Please try again in a few minutes.',
  };
  return hints[status] || 'Please try again or contact support if the problem persists.';
}
