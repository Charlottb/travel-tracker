'use client';

import Link from 'next/link';
import { useState } from 'react';
import { isValidEmail, isValidPassword } from '../../lib/validation';

export default function RegisterPage() {
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

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formEmail, password: formPassword }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 409) {
          setError(data.error || 'E-Mail ist bereits vergeben.');
        } else {
          setError(data.error || 'Registrierung fehlgeschlagen.');
        }
        return;
      }

      window.location.assign('/login');
    } catch (err) {
      console.error('[RegisterPage] Registration failed:', err);
      setError('Registrierung fehlgeschlagen.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-start justify-center overflow-y-auto bg-[#fbfaf7] px-4 py-12 text-slate-900">
      <section className="w-full max-w-xl rounded-[2rem] border border-emerald-100 bg-white/95 p-8 shadow-2xl shadow-emerald-950/10">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 rounded-full px-2 py-1 text-sm font-semibold text-slate-600 transition hover:bg-emerald-50 hover:text-slate-950">
          <span aria-hidden="true">←</span>
          Zur Landingpage
        </Link>
        <div className="mb-6 space-y-2">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-emerald-700">Travel Tracker</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">Registrieren</h1>
          <p className="text-sm text-slate-600">Erstelle ein Konto und verwalte deine Orte auf der interaktiven Karte.</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit} autoComplete="on">
          <label htmlFor="register-email" className="block">
            <span className="text-sm font-bold text-slate-700">E-Mail</span>
            <input
              id="register-email"
              name="email"
              data-cy="register-email"
              className="mt-2 w-full rounded-2xl border border-emerald-100 px-4 py-3 text-sm outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
              type="email"
              defaultValue={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              required
            />
          </label>

          <label htmlFor="register-password" className="block">
            <span className="text-sm font-bold text-slate-700">Passwort</span>
            <input
              id="register-password"
              name="password"
              data-cy="register-password"
              className="mt-2 w-full rounded-2xl border border-emerald-100 px-4 py-3 text-sm outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
              type="password"
              defaultValue={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>

          {error && <p data-cy="error-message" className="rounded-2xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}

          <button
            data-cy="register-submit"
            className="w-full rounded-full bg-emerald-500 px-4 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-200 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-200"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Registrieren...' : 'Registrieren'}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          Schon registriert?{' '}
          <Link className="font-bold text-emerald-700 underline decoration-emerald-200 underline-offset-4" href="/login">
            Zum Login
          </Link>
        </p>
      </section>
    </main>
  );
}
