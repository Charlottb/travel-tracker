export function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

export function isValidEmail(email) {
  return typeof email === 'string' && /^\S+@\S+\.\S+$/.test(email.trim());
}

export function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 8;
}
