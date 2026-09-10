'use client';

import React, { useState } from 'react';
import { toggleBookSlot, deleteTimeSlot } from '../actions';
import Link from 'next/link';

export default function ClientPortal({ isAdmin, caretakers, slots, hoursMap }: any) {
  const [selectedCaretakerId, setSelectedCaretakerId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  const myMinutes = selectedCaretakerId ? hoursMap[selectedCaretakerId] || 0 : 0;
  const myHours = (myMinutes / 60).toFixed(1);

  // 1. Il calendario parte SEMPRE dal Lunedì della settimana in corso (oggi reale)
  const today = new Date();
  
  const getMonday = (d: Date) => {
    const date = new Date(d);
    date.setHours(0, 0, 0, 0);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);
    return date;
  };
  
  const startOfWeek = getMonday(today);

  // 2. Trova l'ultimo slot caricato per capire fino a dove deve allungarsi il calendario
  const lastSlotDate = slots.length > 0 ? new Date(slots[slots.length - 1].startTime) : new Date(startOfWeek);
  
  // 3. Calcola la Domenica dell'ultima settimana caricata
  const endOfWeek = getMonday(lastSlotDate);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  
  // Se l'ultimo slot è vecchio (es. settimana scorsa), mostriamo comunque i 7 giorni di questa settimana
  if (endOfWeek.getTime() < startOfWeek.getTime()) {
    endOfWeek.setTime(startOfWeek.getTime() + (6 * 24 * 60 * 60 * 1000));
  }

  // 4. Calcola i giorni totali (saranno sempre multipli di 7: 7, 14, 21 giorni ecc.)
  const diffTime = endOfWeek.getTime() - startOfWeek.getTime();
  const totalDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;

  const calendarDays = Array.from({ length: totalDays }).map((_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    return d;
  });

  const groupedSlots = slots.reduce((acc: any, slot: any) => {
    const d = new Date(slot.startTime);
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(slot);
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* HEADER */}
      <header className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 gap-4">
        <div><h1 className="text-xl font-bold">Palazzetto Sportivo</h1></div>
        <div className="flex gap-3 w-full sm:w-auto">
          <select
            value={selectedCaretakerId}
            onChange={(e) => setSelectedCaretakerId(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm w-full sm:w-auto outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Scegli il tuo nome --</option>
            {caretakers.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <Link href={isAdmin ? "/admin" : "/admin/login"} className="text-xs bg-slate-900 text-white px-3 py-2 rounded-lg flex items-center shrink-0">
            {isAdmin ? 'Admin' : 'Login'}
          </Link>
        </div>
      </header>

      {selectedCaretakerId && (
        <div className="bg-blue-600 text-white p-5 rounded-xl shadow mb-6 flex justify-between items-center">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold opacity-80">Le mie ore</span>
            <div className="text-3xl font-extrabold">{myHours} h</div>
          </div>
        </div>
      )}

      <div className="flex bg-slate-200 p-1 rounded-lg w-max mb-4">
        <button onClick={() => setViewMode('calendar')} className={`px-3 py-1.5 text-xs font-semibold rounded-md ${viewMode === 'calendar' ? 'bg-white shadow text-slate-900' : 'text-slate-600'}`}>Calendario</button>
        <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 text-xs font-semibold rounded-md ${viewMode === 'list' ? 'bg-white shadow text-slate-900' : 'text-slate-600'}`}>Lista</button>
      </div>

      {viewMode === 'calendar' ? (
        <div className="flex overflow-x-auto pb-4 gap-4 snap-x">
          {calendarDays.map((day) => {
            const dateKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
            const daySlots = groupedSlots[dateKey] || [];
            const isToday = new Date().toDateString() === day.toDateString();

            return (
              <div key={dateKey} className="min-w-[180px] flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden snap-start flex flex-col shadow-sm">
                <div className={`p-3 text-center border-b ${isToday ? 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-slate-50 text-slate-700'}`}>
                  <div className="text-xs uppercase font-bold tracking-wider">
                    {day.toLocaleDateString('it-IT', { weekday: 'long' })}
                  </div>
                  <div className={`text-2xl font-light mt-1 ${isToday ? 'font-bold' : ''}`}>
                    {day.getDate()} {day.toLocaleDateString('it-IT', { month: 'short' })}
                  </div>
                </div>

                <div className="p-2 space-y-2 flex-1 bg-slate-50/50">
                  {daySlots.length === 0 ? (
                    <div className="text-xs text-slate-400 text-center py-6 italic">Nessun turno</div>
                  ) : (
                    daySlots.map((s: any) => {
                      const isMine = s.caretakerId === selectedCaretakerId;
                      const isFree = !s.caretakerId;
                      return (
                        <div
                          key={s.id}
                          onClick={() => { if (selectedCaretakerId && (isFree || isMine)) toggleBookSlot(s.id, selectedCaretakerId); }}
                          className={`p-3 rounded-lg border text-center transition cursor-pointer shadow-sm ${
                            isMine ? 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700' : isFree ? 'bg-emerald-100 border-emerald-300 hover:bg-emerald-200 text-emerald-900' : 'bg-slate-200 border-slate-300 text-slate-500 cursor-not-allowed opacity-75'
                          }`}
                        >
                          <div className="text-sm font-bold">
                            {new Date(s.startTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} - {new Date(s.endTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="text-[11px] mt-1.5 font-medium uppercase tracking-wide">
                            {isFree ? 'Libero' : isMine ? 'Tuo Turno' : s.caretaker?.name}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {slots.map((s: any) => {
            const isMine = s.caretakerId === selectedCaretakerId;
            const isFree = !s.caretakerId;
            return (
              <div key={s.id} className={`p-4 rounded-xl border flex justify-between items-center ${isMine ? 'bg-blue-50 border-blue-300' : isFree ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-100 opacity-60'}`}>
                <div>
                  <div className="font-semibold">{new Date(s.startTime).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })} • {new Date(s.startTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} - {new Date(s.endTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</div>
                  <div className="text-xs text-slate-500 mt-1">{isFree ? 'Libero' : isMine ? 'Tuo Turno' : `Prenotato: ${s.caretaker.name}`}</div>
                </div>
                <div className="flex gap-2">
                  {selectedCaretakerId && (isFree || isMine) && (
                    <button onClick={() => toggleBookSlot(s.id, selectedCaretakerId)} className={`text-xs px-3 py-1.5 rounded-lg font-bold ${isMine ? 'bg-rose-100 text-rose-700' : 'bg-emerald-600 text-white'}`}>
                      {isMine ? 'Annulla' : 'Prenota'}
                    </button>
                  )}
                  {isAdmin && <button onClick={() => deleteTimeSlot(s.id)} className="text-xs bg-red-600 text-white px-2 py-1.5 rounded-md">Elimina</button>}
                </div>
              </div>
            );
          })}
          {slots.length === 0 && (
            <div className="p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
              Nessun turno caricato per questo periodo.
            </div>
          )}
        </div>
      )}
    </div>
  );
}