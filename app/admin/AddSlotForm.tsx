'use client';

import { createTimeSlot } from '../actions';
import { useRef } from 'react';

export default function AddSlotForm() {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        const startStr = formData.get('start') as string;
        const endStr = formData.get('end') as string;
        if (startStr && endStr) {
          const startDate = new Date(startStr);
          const endDate = new Date(endStr);
          await createTimeSlot(startDate.toISOString(), endDate.toISOString());
          formRef.current?.reset();
        }
      }}
      className="grid grid-cols-1 sm:grid-cols-3 gap-3"
    >
      <div>
        <label className="text-xs text-slate-500 font-medium">Inizio turno</label>
        <input type="datetime-local" name="start" required className="w-full border border-slate-300 rounded-lg p-2 text-sm mt-1 focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>
      <div>
        <label className="text-xs text-slate-500 font-medium">Fine turno</label>
        <input type="datetime-local" name="end" required className="w-full border border-slate-300 rounded-lg p-2 text-sm mt-1 focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>
      <div className="flex items-end">
        <button className="w-full bg-blue-600 hover:bg-blue-700 transition text-white py-2 rounded-lg text-sm font-semibold h-[42px]">
          Salva Slot
        </button>
      </div>
    </form>
  );
}
