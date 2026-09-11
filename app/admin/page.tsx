import { isAdminAuthenticated } from '../../lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '../../lib/prisma';
import { getDashboardStats } from '../../lib/stats';
import Link from 'next/link';
import {
  addCaretaker,
  toggleCaretakerActive,
  createTimeSlot,
  closeAndResetPeriod,
  logoutAdmin,
} from '../actions';
import AddSlotForm from './AddSlotForm';

export default async function AdminDashboard() {
  if (!(await isAdminAuthenticated())) {
    redirect('/admin/login');
  }

  const caretakers = await prisma.caretaker.findMany({ orderBy: { name: 'asc' } });
  const stats = await getDashboardStats(new Date().getFullYear());

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 pb-16 bg-slate-50 min-h-screen">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm gap-4">
        <h1 className="text-xl font-bold text-slate-900">Pannello Amministrazione</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <Link href="/" className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 w-full sm:w-auto text-center hover:bg-slate-50">
            Vista Custodi
          </Link>
          <form action={logoutAdmin} className="w-full sm:w-auto">
            <button className="w-full sm:w-auto px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-sm font-medium text-slate-800 transition">
              Logout
            </button>
          </form>
        </div>
      </div>

      {/* AZIONE AZZERA PERIODO */}
      <section className="bg-amber-50 border border-amber-300 p-5 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="font-bold text-amber-900">Chiusura Periodo e Reset Ore</h2>
          <p className="text-xs text-amber-700 mt-1">Salva lo storico ore e azzera il conteggio visibile ai custodi.</p>
        </div>
        <form action={closeAndResetPeriod}>
          <button className="bg-amber-600 hover:bg-amber-700 transition text-white font-bold px-4 py-2 rounded-lg text-sm whitespace-nowrap">
            Chiudi e Azzera
          </button>
        </form>
      </section>

      {/* CARICA NUOVO SLOT */}
      <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="font-bold mb-3 text-slate-900">Aggiungi Slot Orario</h2>
        <AddSlotForm />
      </section>

      {/* STATISTICHE ANNUALI */}
      <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="font-bold mb-4 text-slate-900">Statistiche {stats.annual.year}</h2>
        <div className="grid grid-cols-2 gap-4 mb-5 text-center">
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
            <div className="text-3xl font-black text-blue-600">{stats.annual.aggregate.totalHours} h</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">Ore totali prenotate</div>
          </div>
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
            <div className="text-3xl font-black text-emerald-600">{stats.annual.aggregate.avgWeeklyHours} h</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">Media su {stats.annual.weeksCount} sett. attive</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase">
                <th className="pb-3 font-semibold">Custode</th>
                <th className="pb-3 font-semibold">Totale Anno</th>
                <th className="pb-3 font-semibold">Media / Settimana</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.annual.caretakers.map((c) => (
                <tr key={c.name} className="hover:bg-slate-50 transition">
                  <td className="py-3 font-medium text-slate-900">{c.name}</td>
                  <td className="py-3 text-slate-700">{c.totalHours} h</td>
                  <td className="py-3 text-slate-700">{c.avgWeeklyHours} h</td>
                </tr>
              ))}
              {stats.annual.caretakers.length === 0 && (
                <tr><td colSpan={3} className="py-4 text-center text-slate-500 text-xs">Nessun dato registrato.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* GESTIONE CUSTODI */}
      <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="font-bold mb-3 text-slate-900">Elenco Custodi</h2>
        <form
          action={async (formData) => {
            'use server';
            const name = formData.get('name') as string;
            if (name) await addCaretaker(name);
          }}
          className="flex gap-2 mb-4"
        >
          <input type="text" name="name" placeholder="Es. Mario Rossi" required className="border border-slate-300 rounded-lg px-3 py-2 text-sm flex-1 focus:ring-2 focus:ring-blue-500 outline-none" />
          <button className="bg-slate-900 hover:bg-slate-800 transition text-white px-4 py-2 rounded-lg text-sm font-semibold">
            Aggiungi
          </button>
        </form>

        <div className="divide-y divide-slate-100 border-t border-slate-100 pt-2">
          {caretakers.map((c) => (
            <div key={c.id} className="py-3 flex justify-between items-center text-sm hover:bg-slate-50 px-2 rounded-lg transition -mx-2">
              <span className={`font-medium ${c.active ? 'text-slate-900' : 'line-through text-slate-400'}`}>{c.name}</span>
              <form action={async () => {
                'use server';
                await toggleCaretakerActive(c.id, !c.active);
              }}>
                <button className={`text-xs px-3 py-1.5 rounded-md font-semibold transition ${c.active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
                  {c.active ? 'Disattiva' : 'Riattiva'}
                </button>
              </form>
            </div>
          ))}
          {caretakers.length === 0 && (
            <div className="py-4 text-center text-slate-500 text-xs">Nessun custode inserito.</div>
          )}
        </div>
      </section>

      {/* RIEPILOGO GLOBALE - STORICO ASSOLUTO */}
      <section className="bg-slate-900 p-6 rounded-xl shadow-md text-white mt-8">
        <h2 className="font-bold mb-4 text-lg border-b border-slate-700 pb-2">Storico Assoluto (Totale di sempre)</h2>
        <div className="mb-6">
          <div className="text-sm text-slate-400 font-medium">Ore Totali Globali</div>
          <div className="text-4xl font-black text-white">{stats.allTime.totalHours} h</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {stats.allTime.caretakers.map((c) => (
            <div key={c.name} className="flex justify-between items-center bg-slate-800 p-3 rounded-lg border border-slate-700">
              <span className="font-semibold text-sm">{c.name}</span>
              <span className="bg-slate-700 px-3 py-1 rounded-md text-sm font-bold">{c.totalHours} h</span>
            </div>
          ))}
          {stats.allTime.caretakers.length === 0 && (
            <div className="text-sm text-slate-500 italic">Nessun turno registrato nello storico.</div>
          )}
        </div>
      </section>
    </div>
  );
}