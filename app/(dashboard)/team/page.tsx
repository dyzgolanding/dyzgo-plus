'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Search, Plus, Ban, FileWarning, CheckCircle2, X, UserX, Calendar, MapPin, Trash2, Mail, ChevronDown, Check, RotateCcw, Lock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useOrg } from '@/components/providers/org-provider'

// --- INTERFACES PARA TIPADO ---
interface BlacklistCase {
  id: string
  name: string
  rut: string | null
  email: string | null
  type: string
  reason: string | null
  event_context: string | null
  status: string
  created_at: string
  org_id: string
}

interface EventItem {
  title: string
  location: string | null
}

interface StatBadgeProps {
  label: string
  count: number
  color: string
  icon: React.ReactNode
}

interface DataRowProps {
  icon: React.ReactNode
  label: string
  value: string
  mono?: boolean
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode
  mono?: boolean
}

// Configuración estática
const INCIDENT_TYPES = [
    { id: 'violence', label: 'Violencia / Agresión', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', dot: 'bg-red-500' }, 
    { id: 'fraud', label: 'Estafa / Ticket Falso', color: 'text-[#8A2BE2]', bg: 'bg-[#8A2BE2]/10', border: 'border-[#8A2BE2]/20', dot: 'bg-[#8A2BE2]' }, 
    { id: 'theft', label: 'Robo / Hurto', color: 'text-[#FF007F]', bg: 'bg-[#FF007F]/10', border: 'border-[#FF007F]/20', dot: 'bg-[#FF007F]' }, 
    { id: 'conduct', label: 'Mala Conducta', color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', dot: 'bg-yellow-500' }, 
    { id: 'other', label: 'Otro Motivo', color: 'text-zinc-400', bg: 'bg-white/5', border: 'border-white/10', dot: 'bg-zinc-400' }
]

const formatRut = (value: string) => { 
    let clean = value.replace(/[^0-9kK]/g, '').toUpperCase(); 
    if (clean.length > 9) clean = clean.slice(0, 9); 
    if (clean.length < 2) return clean; 
    const body = clean.slice(0, -1); 
    const dv = clean.slice(-1); 
    return `${body}-${dv}` 
}

export default function BlacklistPage() {
  const { currentOrgId } = useOrg()
  const [loading, setLoading] = useState(true)
  const [cases, setCases] = useState<BlacklistCase[]>([])
  const [events, setEvents] = useState<EventItem[]>([]) 
  const [filter, setFilter] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [newCase, setNewCase] = useState({ name: '', rut: '', email: '', type: 'violence', notes: '', event: '' })

  const fetchBlacklist = useCallback(async () => {
    if (!currentOrgId) return
    setLoading(true)
    try { 
        const { data, error } = await supabase
            .from('blacklist')
            .select('*')
            .eq('org_id', currentOrgId)
            .order('created_at', { ascending: false }); 
        
        if (error) throw error; 
        if (data) setCases(data as BlacklistCase[]) 
    } catch (err) { 
        console.error("Error cargando blacklist:", err) 
    } finally { 
        setLoading(false) 
    }
  }, [currentOrgId])

  useEffect(() => { 
      if (currentOrgId) { 
          const fetchEvents = async () => { 
              const { data } = await supabase
                .from('events')
                .select('title, location')
                .eq('experience_id', currentOrgId)
                .order('date', { ascending: false }); 
              
              if (data) setEvents(data as EventItem[]) 
          }; 
          fetchEvents() 
      } 
  }, [currentOrgId])

  useEffect(() => { fetchBlacklist() }, [fetchBlacklist])

  const filteredCases = cases.filter(c => 
    (c.name && c.name.toLowerCase().includes(filter.toLowerCase())) || 
    (c.rut && c.rut.includes(filter)) || 
    (c.email && c.email?.toLowerCase().includes(filter.toLowerCase())) || 
    (c.reason && c.reason?.toLowerCase().includes(filter.toLowerCase()))
  )

  const handleAddCase = async () => { 
      if (!newCase.name || (!newCase.rut && !newCase.email)) { 
          return alert("Debes ingresar al menos el Nombre y un identificador (RUT o Email).") 
      }
      setSubmitting(true); 
      try { 
          const { error } = await supabase.from('blacklist').insert({ 
              org_id: currentOrgId, 
              name: newCase.name, 
              rut: newCase.rut, 
              email: newCase.email.toLowerCase().trim(), 
              type: newCase.type, 
              reason: newCase.notes, 
              event_context: newCase.event, 
              status: 'active' 
          }); 
          
          if (error) throw error; 
          alert("Usuario agregado a la Blacklist. Se bloquearán sus intentos de compra."); 
          setIsModalOpen(false); 
          setNewCase({ name: '', rut: '', email: '', type: 'violence', notes: '', event: '' }); 
          fetchBlacklist() 
      } catch (error: unknown) { 
          const msg = error instanceof Error ? error.message : 'Error desconocido'
          alert("Error al guardar: " + msg) 
      } finally { 
          setSubmitting(false) 
      } 
  }

  const toggleStatus = async (id: string, currentStatus: string) => { 
      const newStatus = currentStatus === 'active' ? 'resolved' : 'active'; 
      try { 
          setCases(cases.map(c => c.id === id ? { ...c, status: newStatus } : c)); 
          const { error } = await supabase.from('blacklist').update({ status: newStatus }).eq('id', id); 
          if (error) throw error 
      } catch (error) { 
          console.error("Error actualizando estado", error); 
          fetchBlacklist() 
      } 
  }

  const handleDelete = async (id: string) => { 
      if(!confirm("¿Eliminar este registro permanentemente?")) return; 
      try { 
          setCases(cases.filter(c => c.id !== id)); 
          const { error } = await supabase.from('blacklist').delete().eq('id', id); 
          if (error) throw error 
      } catch (error) { 
          console.error(error);
          alert("No se pudo eliminar"); 
          fetchBlacklist() 
      } 
  }

  return (
    // CONTENEDOR LIMPIO (Sin fondo, ya está en el Layout)
    <div className="relative z-10 max-w-[1600px] mx-auto space-y-8 animate-in fade-in pt-0">
        
        {/* HEADER */}
        <div className="flex flex-col xl:flex-row justify-between items-end gap-6 border-b border-white/5 pb-6">
            <div><h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-2">Black<span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-[#FF007F]">list</span></h1><p className="text-white/40 max-w-2xl text-sm leading-relaxed font-medium">Gestión centralizada de derecho de admisión. Los usuarios registrados aquí serán bloqueados automáticamente.</p></div>
            <div className="flex flex-wrap md:flex-nowrap gap-3 w-full xl:w-auto items-center">
                <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md border border-white/10 px-6 h-14 rounded-2xl shadow-lg flex-1 md:flex-none justify-center md:justify-start"><StatBadge label="Activos" count={cases.filter(c => c.status === 'active').length} color="text-red-500" icon={<Ban size={14}/>} /><div className="w-px h-6 bg-white/10"></div><StatBadge label="Resueltos" count={cases.filter(c => c.status === 'resolved').length} color="text-[#00D15B]" icon={<CheckCircle2 size={14}/>} /></div>
                <button onClick={() => setIsModalOpen(true)} className="h-14 px-8 bg-white text-black font-bold rounded-2xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] flex items-center justify-center gap-3 text-xs uppercase tracking-wider hover:scale-105 active:scale-95 whitespace-nowrap flex-1 md:flex-none"><Plus size={18} strokeWidth={3} /> Nuevo Reporte</button>
            </div>
        </div>

        {/* BUSCADOR */}
        <div className="sticky top-4 z-30">
            <div className="relative group shadow-2xl shadow-purple-900/10">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-white/40 group-focus-within:text-white transition-colors z-10"><Search size={20} /></div>
                <input type="text" value={filter} onChange={(e) => setFilter(e.target.value)} onKeyDown={(e) => { if (e.key === 'Escape') setFilter('') }} placeholder="Buscar por RUT, Nombre, Email, Contexto..." className="w-full bg-white/5 backdrop-blur-xl border border-white/10 focus:border-red-500/50 rounded-2xl pl-16 pr-4 h-14 text-white placeholder:text-white/20 outline-none transition-all text-sm font-medium focus:bg-black/60 shadow-lg" />
                <div className="absolute inset-y-0 right-6 flex items-center"><span className="text-[10px] text-white/30 font-mono bg-white/5 px-2 py-1 rounded border border-white/5">ESC to clear</span></div>
            </div>
        </div>

        {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{[1,2,3].map(i => <div key={i} className="h-64 bg-white/5 rounded-[2rem] animate-pulse border border-white/5"/>)}</div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCases.map((incident) => {
                    const typeConfig = INCIDENT_TYPES.find(t => t.id === incident.type) || INCIDENT_TYPES[4]
                    const isActive = incident.status === 'active'
                    return (
                        <div key={incident.id} className={`relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-1 overflow-hidden transition-all duration-300 group hover:shadow-2xl hover:shadow-red-900/20 hover:border-white/20 hover:scale-[1.01] ${isActive ? 'opacity-100' : 'opacity-60 grayscale hover:grayscale-0'}`}>
                            {isActive && <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-[50px] pointer-events-none" />}
                            {isActive && <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-transparent opacity-30 pointer-events-none" />}
                            <div className="h-full bg-black/40 rounded-[1.8rem] p-5 flex flex-col relative z-10">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center text-sm font-black border bg-white/5 border-white/5 text-white/40 shadow-sm">{incident.name.charAt(0).toUpperCase()}</div>
                                        <div className="min-w-0">
                                            <h3 className="text-white font-bold text-base leading-none truncate group-hover:text-red-500 transition-colors mb-1">{incident.name}</h3>
                                            <div className="flex items-center gap-2"><span className={`text-[9px] font-black uppercase tracking-wider ${isActive ? 'text-red-500' : 'text-[#00D15B]'}`}>{isActive ? '● Vetado' : '● Resuelto'}</span></div>
                                        </div>
                                    </div>
                                    <div className={`px-2 py-1 rounded-lg border text-[8px] font-bold uppercase ${typeConfig.bg} ${typeConfig.color} ${typeConfig.border}`}>{typeConfig.label}</div>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5 mb-3 flex flex-col gap-2">
                                    <DataRow icon={<UserX size={12}/>} label="RUT" value={incident.rut || 'No registrado'} mono /><div className="h-px bg-white/5" /><DataRow icon={<Mail size={12}/>} label="Email" value={incident.email || 'No registrado'} /><div className="h-px bg-white/5" /><DataRow icon={<Calendar size={12}/>} label="Fecha" value={new Date(incident.created_at).toLocaleDateString()} />
                                </div>
                                <div className="flex-1 flex flex-col gap-2">
                                    {incident.event_context && (<div className="flex items-center gap-2 text-[9px] text-white/50 font-bold bg-white/5 p-2 rounded-lg border border-white/5"><MapPin size={10} className="text-[#8A2BE2] shrink-0"/><span className="truncate uppercase tracking-wide">{incident.event_context}</span></div>)}
                                    <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex-1 min-h-[4rem]"><p className="text-white/70 text-xs italic leading-relaxed font-medium">"{incident.reason}"</p></div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/5">
                                    <button onClick={() => toggleStatus(incident.id, incident.status)} className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-bold uppercase transition-all border shadow-sm ${isActive ? 'bg-[#00D15B]/10 text-[#00D15B] border-[#00D15B]/20 hover:bg-[#00D15B]/20' : 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'}`}>{isActive ? <Check size={14}/> : <RotateCcw size={14}/>}{isActive ? 'Perdonar' : 'Reactivar'}</button>
                                    <button onClick={() => handleDelete(incident.id)} className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-500 text-white/40 transition-all text-[10px] font-bold uppercase shadow-sm"><Trash2 size={14}/> Eliminar</button>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        )}

        {!loading && filteredCases.length === 0 && (<div className="flex flex-col items-center justify-center py-32 border border-dashed border-white/10 rounded-[3rem] bg-white/5 backdrop-blur-md"><div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/5 shadow-xl"><Ban size={40} className="text-white/20" /></div><h3 className="text-white font-bold text-xl">Base de datos limpia</h3><p className="text-white/40 text-sm mt-2">No se encontraron registros activos con ese criterio.</p></div>)}

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
              <div className="bg-[#050505]/90 backdrop-blur-2xl border border-white/10 w-full max-w-xl rounded-[2.5rem] shadow-2xl shadow-red-900/30 relative overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-60" />
                  <div className="px-8 py-6 border-b border-white/5 bg-white/5 flex justify-between items-center sticky top-0 z-10 backdrop-blur-xl"><div><h2 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tight"><span className="p-2.5 bg-red-500/10 rounded-xl border border-red-500/20 text-red-500 shadow-[0_0_15px_rgba(220,38,38,0.2)]"><FileWarning size={18}/></span> Nuevo Reporte</h2></div><button onClick={() => setIsModalOpen(false)} className="h-10 w-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all hover:scale-110"><X size={18}/></button></div>
                  <div className="p-8 overflow-y-auto custom-scrollbar space-y-6 bg-transparent relative z-10">
                      <div className="space-y-2"><Label>Sujeto del Reporte</Label><Input value={newCase.name} onChange={(e) => setNewCase({...newCase, name: e.target.value})} placeholder="Nombre Completo" icon={<UserX size={16}/>} /></div>
                      <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>RUT</Label><Input value={newCase.rut} onChange={(e) => setNewCase({...newCase, rut: formatRut(e.target.value)})} maxLength={12} placeholder="12.345.678-9" mono /></div><div className="space-y-2"><Label>Email</Label><Input type="email" value={newCase.email} onChange={(e) => setNewCase({...newCase, email: e.target.value})} placeholder="usuario@email.com" /></div></div>
                      <div className="space-y-3"><Label>Clasificación del Incidente</Label><div className="grid grid-cols-2 gap-3">{INCIDENT_TYPES.map(type => (<button key={type.id} onClick={() => setNewCase({...newCase, type: type.id})} className={`px-4 py-3.5 rounded-2xl border text-left text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-3 ${newCase.type === type.id ? 'bg-red-500/10 border-red-500/50 text-red-500 shadow-[0_0_15px_rgba(220,38,38,0.15)] ring-1 ring-red-500/50' : 'bg-black/40 border-white/5 text-white/30 hover:bg-white/5 hover:text-white hover:border-white/10'}`}><div className={`w-2 h-2 shrink-0 rounded-full shadow-[0_0_5px_currentColor] ${type.dot}`} />{type.label}</button>))}</div></div>
                      <div className="space-y-2"><Label>Contexto</Label><div className="relative group"><select value={newCase.event} onChange={(e) => setNewCase({...newCase, event: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:border-red-500 focus:bg-black/60 outline-none transition-all appearance-none cursor-pointer shadow-sm hover:border-white/20"><option value="" disabled>Seleccionar Evento...</option>{events.map((ev) => (<option key={ev.title} value={ev.title}>{ev.title}</option>))}<option value="Otro / Externo">Otro / Externo</option></select><ChevronDown size={16} className="absolute right-5 top-5 text-white/30 pointer-events-none group-hover:text-white transition-colors" /></div></div>
                      <div className="space-y-2"><Label>Evidencia / Notas</Label><textarea value={newCase.notes} onChange={(e) => setNewCase({...newCase, notes: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:border-red-500 focus:bg-black/60 outline-none transition-all h-32 resize-none placeholder:text-white/20 shadow-sm hover:border-white/20" placeholder="Describa los hechos detalladamente..." /></div>
                  </div>
                  <div className="p-6 border-t border-white/5 bg-black/20 backdrop-blur-md"><button onClick={handleAddCase} disabled={submitting} className="w-full py-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all shadow-[0_0_25px_rgba(220,38,38,0.4)] flex items-center justify-center gap-3 text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98]">{submitting ? <span className="animate-pulse">Procesando...</span> : <><Lock size={16} /> Confirmar Bloqueo</>}</button></div>
              </div>
          </div>
        )}
    </div>
  )
}

function StatBadge({ label, count, color, icon }: StatBadgeProps) { return <div className="flex items-center gap-3 px-2"><div className={`p-2 rounded-xl bg-white/5 ${color} shadow-sm border border-white/5`}>{icon}</div><div><p className="text-[9px] text-white/40 font-bold uppercase tracking-wider">{label}</p><p className={`text-lg font-black ${color} leading-none`}>{count}</p></div></div> }
function DataRow({ icon, label, value, mono }: DataRowProps) { return <div className="flex justify-between items-center text-xs gap-3 w-full"><div className="flex items-center gap-1.5 text-white/40 shrink-0 font-bold uppercase tracking-wider text-[9px]">{icon} <span>{label}</span></div><span className={`text-white/80 font-medium text-right break-all flex-1 ${mono ? 'font-mono tracking-wider' : ''}`} title={value}>{value}</span></div> }
function Label({ children }: { children: React.ReactNode }) { return <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider pl-1 flex items-center gap-1 ml-1">{children}</label> }
function Input({ icon, mono, ...props }: InputProps) { return <div className="relative group">{icon && <div className="absolute left-5 top-4 text-white/30 pointer-events-none group-focus-within:text-white transition-colors">{icon}</div>}<input {...props} className={`w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white focus:border-red-500 focus:bg-black/60 outline-none transition-all placeholder:text-white/20 shadow-sm hover:border-white/20 ${icon ? 'pl-12' : ''} ${mono ? 'font-mono' : ''}`} /></div> }