'use client';

import { useState } from 'react';
import { loginAdmin } from '../../actions';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const res = await loginAdmin(formData.get('password') as string);
    
    if (res.success) {
      router.push('/admin');
      router.refresh();
    } else {
      setError(res.error || 'Errore di accesso');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 w-full max-w-sm space-y-4">
        <h1 className="text-xl font-bold text-center text-slate-900">Accesso Admin</h1>
        {error && <p className="text-xs text-red-600 text-center font-medium">{error}</p>}
        <input
          type="password"
          name="password"
          placeholder="Inserisci password..."
          required
          className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 transition text-white font-semibold py-2.5 rounded-lg text-sm">
          Accedi
        </button>
      </form>
    </div>
  );
}
