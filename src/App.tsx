/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Calendar, 
  Clock, 
  Pill, 
  Check, 
  X, 
  History as HistoryIcon, 
  Settings, 
  ChevronRight,
  Trash2,
  Bell
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Toaster, toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

import { Medication, AdherenceRecord, AppState } from './types';
import { storage } from './lib/storage';
import { cn } from './lib/utils';

export default function App() {
  const [state, setState] = useState<AppState>(storage.getState());
  const [activeTab, setActiveTab] = useState('today');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // New Medication Form State
  const [newMed, setNewMed] = useState<Partial<Medication>>({
    name: '',
    dosage: '',
    time: '08:00',
    frequency: 'daily',
    color: '#3b82f6',
    icon: 'Pill'
  });

  useEffect(() => {
    // Reminder Engine
    const interval = setInterval(() => {
      const now = new Date();
      const currentTime = format(now, 'HH:mm');
      const todayStr = format(now, 'yyyy-MM-dd');
      
      state.medications.forEach(med => {
        if (med.time === currentTime) {
          // Check frequency
          if (med.frequency === 'weekly' && med.daysOfWeek && !med.daysOfWeek.includes(now.getDay())) {
            return;
          }

          // Check if already recorded for today
          const alreadyRecorded = state.history.find(h => h.medicationId === med.id && h.date === todayStr);
          
          if (!alreadyRecorded) {
            toast.info(`¡Hora de tu medicina!`, {
              description: `${med.name} - ${med.dosage}`,
              icon: <Bell className="w-4 h-4" />,
              duration: 10000,
            });
          }
        }
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [state.medications, state.history]);

  const handleAddMedication = () => {
    if (!newMed.name || !newMed.dosage) {
      toast.error('Por favor completa el nombre y la dosis');
      return;
    }

    const med: Medication = {
      id: crypto.randomUUID(),
      name: newMed.name!,
      dosage: newMed.dosage!,
      time: newMed.time || '08:00',
      frequency: newMed.frequency || 'daily',
      color: newMed.color || '#3b82f6',
      icon: newMed.icon || 'Pill',
      createdAt: Date.now(),
      daysOfWeek: newMed.daysOfWeek
    };

    const newState = storage.addMedication(med);
    setState(newState);
    setIsAddDialogOpen(false);
    setNewMed({
      name: '',
      dosage: '',
      time: '08:00',
      frequency: 'daily',
      color: '#3b82f6',
      icon: 'Pill'
    });
    toast.success('Medicamento añadido correctamente');
  };

  const handleDeleteMedication = (id: string) => {
    const newState = storage.deleteMedication(id);
    setState(newState);
    toast.success('Medicamento eliminado');
  };

  const handleRecordAdherence = (medicationId: string, status: 'taken' | 'skipped') => {
    const record: AdherenceRecord = {
      id: crypto.randomUUID(),
      medicationId,
      date: format(new Date(), 'yyyy-MM-dd'),
      time: format(new Date(), 'HH:mm'),
      status,
      timestamp: Date.now(),
    };

    const newState = storage.recordAdherence(record);
    setState(newState);
    toast.success(status === 'taken' ? '¡Medicamento tomado!' : 'Medicamento omitido');
  };

  const todayDoses = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const dayOfWeek = new Date().getDay();

    return state.medications
      .filter(med => {
        if (med.frequency === 'daily') return true;
        if (med.frequency === 'weekly' && med.daysOfWeek?.includes(dayOfWeek)) return true;
        return false;
      })
      .map(med => {
        const record = state.history.find(h => h.medicationId === med.id && h.date === todayStr);
        return { ...med, record };
      })
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [state.medications, state.history]);

  const historyByDate = useMemo(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return state.history
      .filter(h => h.date === dateStr)
      .map(h => {
        const med = state.medications.find(m => m.id === h.medicationId);
        return { ...h, med };
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [state.history, state.medications, selectedDate]);

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col relative overflow-hidden pb-24">
      <Toaster position="top-center" richColors />
      
      {/* Background Orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 left-1/2 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="p-6 pt-12 flex justify-between items-center z-10">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">MediGlass</h1>
          <p className="text-white/70 text-sm">{format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger render={<Button size="icon" className="rounded-full glass hover:bg-white/30 transition-all" />}>
            <Plus className="w-6 h-6 text-white" />
          </DialogTrigger>
          <DialogContent className="glass border-white/20 text-white sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Nuevo Medicamento</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre</Label>
                <Input 
                  id="name" 
                  value={newMed.name} 
                  onChange={(e) => setNewMed({...newMed, name: e.target.value})}
                  className="glass-input" 
                  placeholder="Ej: Paracetamol"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dosage">Dosis</Label>
                <Input 
                  id="dosage" 
                  value={newMed.dosage} 
                  onChange={(e) => setNewMed({...newMed, dosage: e.target.value})}
                  className="glass-input" 
                  placeholder="Ej: 500mg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="time">Hora</Label>
                  <Input 
                    id="time" 
                    type="time"
                    value={newMed.time} 
                    onChange={(e) => setNewMed({...newMed, time: e.target.value})}
                    className="glass-input" 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="color">Color</Label>
                  <Input 
                    id="color" 
                    type="color"
                    value={newMed.color} 
                    onChange={(e) => setNewMed({...newMed, color: e.target.value})}
                    className="h-10 w-full glass-input p-1" 
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddMedication} className="w-full bg-white text-purple-600 hover:bg-white/90 font-bold rounded-xl">
                Guardar Medicamento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 z-10 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'today' && (
            <motion.div
              key="today"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <section>
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5" /> Próximas tomas
                </h2>
                <div className="space-y-4">
                  {todayDoses.length === 0 ? (
                    <Card className="glass-card border-none text-center py-12">
                      <CardContent className="flex flex-col items-center gap-4">
                        <div className="p-4 bg-white/10 rounded-full">
                          <Pill className="w-12 h-12 text-white/50" />
                        </div>
                        <p className="text-white/70">No tienes medicamentos programados para hoy.</p>
                        <Button variant="outline" className="glass text-white border-white/20" onClick={() => setIsAddDialogOpen(true)}>
                          Añadir primero
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    todayDoses.map((med) => (
                      <motion.div key={med.id} layout>
                        <Card className={cn(
                          "glass-card border-none overflow-hidden",
                          med.record?.status === 'taken' && "opacity-60 grayscale-[0.5]"
                        )}>
                          <CardContent className="p-4 flex items-center gap-4">
                            <div 
                              className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                              style={{ backgroundColor: med.color }}
                            >
                              <Pill className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-bold text-white text-lg">{med.name}</h3>
                              <div className="flex items-center gap-2 text-white/60 text-sm">
                                <Clock className="w-3 h-3" /> {med.time} • {med.dosage}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {med.record ? (
                                <div className={cn(
                                  "px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1",
                                  med.record.status === 'taken' ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"
                                )}>
                                  {med.record.status === 'taken' ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                  {med.record.status === 'taken' ? 'Tomado' : 'Omitido'}
                                </div>
                              ) : (
                                <>
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="rounded-full hover:bg-red-500/20 text-red-400"
                                    onClick={() => handleRecordAdherence(med.id, 'skipped')}
                                  >
                                    <X className="w-5 h-5" />
                                  </Button>
                                  <Button 
                                    size="icon" 
                                    className="rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20"
                                    onClick={() => handleRecordAdherence(med.id, 'taken')}
                                  >
                                    <Check className="w-5 h-5" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))
                  )}
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'meds' && (
            <motion.div
              key="meds"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <h2 className="text-xl font-semibold text-white mb-4">Mis Medicamentos</h2>
              <div className="grid gap-4">
                {state.medications.map((med) => (
                  <Card key={med.id} className="glass-card border-none">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: med.color }}
                      >
                        <Pill className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-white">{med.name}</h3>
                        <p className="text-white/60 text-xs">{med.dosage} • {med.time} • {med.frequency}</p>
                      </div>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="text-white/40 hover:text-red-400 hover:bg-red-500/10"
                        onClick={() => handleDeleteMedication(med.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                <Button 
                  variant="outline" 
                  className="w-full glass border-dashed border-white/20 text-white h-16 rounded-2xl flex items-center gap-2"
                  onClick={() => setIsAddDialogOpen(true)}
                >
                  <Plus className="w-5 h-5" /> Añadir Medicamento
                </Button>
              </div>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <h2 className="text-xl font-semibold text-white mb-4">Historial</h2>
              
              <Card className="glass-card border-none p-2">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="rounded-xl text-white"
                  locale={es}
                />
              </Card>

              <div className="space-y-3">
                <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider">
                  {format(selectedDate, "d 'de' MMMM", { locale: es })}
                </h3>
                {historyByDate.length === 0 ? (
                  <p className="text-white/40 text-center py-8 italic">No hay registros para este día.</p>
                ) : (
                  historyByDate.map((record) => (
                    <Card key={record.id} className="glass-card border-none bg-white/5">
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className={cn(
                          "w-2 h-10 rounded-full",
                          record.status === 'taken' ? "bg-green-500" : "bg-red-500"
                        )} />
                        <div className="flex-1">
                          <h4 className="text-white font-medium">{record.med?.name || 'Medicamento eliminado'}</h4>
                          <p className="text-white/50 text-xs">{record.time} • {record.status === 'taken' ? 'Tomado' : 'Omitido'}</p>
                        </div>
                        {record.status === 'taken' ? (
                          <Check className="w-5 h-5 text-green-400" />
                        ) : (
                          <X className="w-5 h-5 text-red-400" />
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </motion.div>
          )}
          
          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <h2 className="text-xl font-semibold text-white mb-4">Ajustes</h2>
              <Card className="glass-card border-none">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Bell className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">Notificaciones</p>
                        <p className="text-xs text-white/50">Recordatorios de tomas</p>
                      </div>
                    </div>
                    <Checkbox checked className="border-white/20 data-[state=checked]:bg-blue-500" />
                  </div>
                  <div className="h-px bg-white/10" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Settings className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">Idioma</p>
                        <p className="text-xs text-white/50">Español</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/20" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-6 left-6 right-6 h-16 glass rounded-2xl flex items-center justify-around px-2 z-50">
        <NavButton 
          active={activeTab === 'today'} 
          onClick={() => setActiveTab('today')}
          icon={<Clock className="w-6 h-6" />}
          label="Hoy"
        />
        <NavButton 
          active={activeTab === 'meds'} 
          onClick={() => setActiveTab('meds')}
          icon={<Pill className="w-6 h-6" />}
          label="Meds"
        />
        <NavButton 
          active={activeTab === 'history'} 
          onClick={() => setActiveTab('history')}
          icon={<HistoryIcon className="w-6 h-6" />}
          label="Historial"
        />
        <NavButton 
          active={activeTab === 'settings'} 
          onClick={() => setActiveTab('settings')}
          icon={<Settings className="w-6 h-6" />}
          label="Ajustes"
        />
      </nav>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all duration-300 relative",
        active ? "text-white" : "text-white/40 hover:text-white/60"
      )}
    >
      {active && (
        <motion.div 
          key={`nav-active-indicator-${label}`}
          layoutId="nav-active"
          className="absolute inset-0 bg-white/10 rounded-xl -z-10"
          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
        />
      )}
      {icon}
      <span className="text-[10px] font-medium mt-1 uppercase tracking-tighter">{label}</span>
    </button>
  );
}
