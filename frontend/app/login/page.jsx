'use client';

import Link from 'next/link';
import { useState } from 'react';
import { isValidEmail, isValidPassword } from '../../lib/validation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const formEmail = String(formData.get('email') ?? '').trim();
    const formPassword = String(formData.get('password') ?? '');

    setEmail(formEmail);
    setPassword(formPassword);

    try {
      if (!isValidEmail(formEmail) || !isValidPassword(formPassword)) {
        setError('E-Mail oder Passwort ungültig.');
        return;
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formEmail, password: formPassword }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401) {
          setError(data.error || 'E-Mail oder Passwort ungültig.');
        } else {
          setError(data.error || 'Login fehlgeschlagen.');
        }
        return;
      }

      if (typeof window !== 'undefined' && data.token) {
        const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toUTCString();
        const secureFlag = window.location.protocol === 'https:' ? '; Secure' : '';
        document.cookie = `authToken=${encodeURIComponent(data.token)}; path=/; expires=${expiry}; max-age=${24 * 60 * 60}; SameSite=Lax${secureFlag}`;
      }

      window.location.assign('/');
    } catch (err) {
      console.error('[LoginPage] Login failed:', err);
      setError('Login fehlgeschlagen.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-start justify-center overflow-y-auto bg-slate-50 px-4 py-12 text-slate-900">
      <section className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-200/50">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950">
          <span aria-hidden="true">←</span>
          Zur Landingpage
        </Link>
        <div className="mb-6 space-y-3">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Travel Tracker</p>
          <h1 className="text-3xl font-semibold text-slate-950">Login</h1>
          <p className="text-sm text-slate-600">Melde dich an, um deine Reiseorte zu sehen und zu verwalten.</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit} autoComplete="on">
          <label htmlFor="email" className="block">
            <span className="text-sm font-medium text-slate-700">E-Mail</span>
            <input
              id="email"
              name="email"
              data-cy="login-email"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              type="email"
              defaultValue={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              required
            />
          </label>

          <label htmlFor="password" className="block">
            <span className="text-sm font-medium text-slate-700">Passwort</span>
            <input
              id="password"
              name="password"
              data-cy="login-password"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              type="password"
              defaultValue={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {error && <p data-cy="error-message" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <button
            data-cy="login-submit"
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Einloggen...' : 'Einloggen'}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          Noch kein Konto?{' '}
          <Link className="font-medium text-slate-900 underline" href="/register">
            Registrieren
          </Link>
        </p>
      </section>
    </main>
  );
}
