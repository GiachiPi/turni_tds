'use client';

import { deletePeriod } from '../actions';

interface Props {
  periodId: string;
  label: string; // es. "15/10/2026 → 16/10/2026" per il messaggio di conferma
}

export default function DeletePeriodButton({ periodId, label }: Props) {
  async function handleDelete() {
    if (!confirm(`Eliminare definitivamente il periodo ${label}?\nQuesta azione è irreversibile e cancella anche tutti i turni archiviati.`)) {
      return;
    }
    await deletePeriod(periodId);
  }

  return (
    <button
      onClick={handleDelete}
      className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition whitespace-nowrap"
    >
      🗑 Elimina
    </button>
  );
}
