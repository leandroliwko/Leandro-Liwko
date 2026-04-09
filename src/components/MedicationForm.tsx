import React, { useState } from 'react';
import { Medication, Frequency } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { cn } from '../lib/utils';

interface MedicationFormProps {
  onSave: (medication: Omit<Medication, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

const DAYS = [
  { label: 'D', value: 0 },
  { label: 'L', value: 1 },
  { label: 'M', value: 2 },
  { label: 'M', value: 3 },
  { label: 'J', value: 4 },
  { label: 'V', value: 5 },
  { label: 'S', value: 6 },
];

const COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'
];

export default function MedicationForm({ onSave, onCancel }: MedicationFormProps) {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [time, setTime] = useState('08:00');
  const [frequency, setFrequency] = useState<Frequency>('daily');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5]);
  const [color, setColor] = useState(COLORS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      dosage,
      time,
      frequency,
      daysOfWeek: frequency === 'weekly' ? daysOfWeek : undefined,
      color,
      icon: 'Pill',
    });
  };

  const toggleDay = (day: number) => {
    setDaysOfWeek(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold text-white">Nuevo Medicamento</DialogTitle>
      </DialogHeader>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-white/70 ml-1">Nombre</Label>
          <Input 
            id="name" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="Ej: Paracetamol"
            required
            className="glass border-white/10 text-white placeholder:text-white/30 h-12 rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dosage" className="text-white/70 ml-1">Dosis</Label>
          <Input 
            id="dosage" 
            value={dosage} 
            onChange={e => setDosage(e.target.value)} 
            placeholder="Ej: 500mg"
            required
            className="glass border-white/10 text-white placeholder:text-white/30 h-12 rounded-xl"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="time" className="text-white/70 ml-1">Hora</Label>
            <Input 
              id="time" 
              type="time"
              value={time} 
              onChange={e => setTime(e.target.value)} 
              required
              className="glass border-white/10 text-white h-12 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="frequency" className="text-white/70 ml-1">Frecuencia</Label>
            <Select value={frequency} onValueChange={(v: Frequency) => setFrequency(v)}>
              <SelectTrigger className="glass border-white/10 text-white h-12 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass border-white/10 text-white">
                <SelectItem value="daily">Diario</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {frequency === 'weekly' && (
          <div className="space-y-2">
            <Label className="text-white/70 ml-1">Días de la semana</Label>
            <div className="flex justify-between gap-1">
              {DAYS.map(day => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                    daysOfWeek.includes(day.value) 
                      ? "bg-white text-black scale-110" 
                      : "bg-white/5 text-white/40 border border-white/10"
                  )}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-white/70 ml-1">Color</Label>
          <div className="flex justify-between">
            {COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn(
                  "w-10 h-10 rounded-full border-2 transition-all",
                  color === c ? "border-white scale-110 shadow-lg" : "border-transparent opacity-40"
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="button" variant="ghost" onClick={onCancel} className="text-white/60 hover:text-white hover:bg-white/10 rounded-xl">
          Cancelar
        </Button>
        <Button type="submit" className="bg-white text-black hover:bg-white/90 font-bold rounded-xl px-8">
          Guardar
        </Button>
      </DialogFooter>
    </form>
  );
}
