async function logoutAndRedirect() {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch (error) {
    console.warn('[authFetch] Logout failed during 401 handling:', error?.message || error);
  }

  window.location.href = '/login';
}

export async function authFetch(input: RequestInfo, init: RequestInit = {}) {
  const response = await fetch(input, {
    credentials: 'include',
    ...init,
  });

  if (response.status === 401) {
    await logoutAndRedirect();
  }

  return response;
}

export default authFetch;
