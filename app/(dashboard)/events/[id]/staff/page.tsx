'use client'

import React, { useEffect, useState, use, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { getStaffScans } from '@/app/actions/get-staff-scans'
import {
  Loader2, Plus, Search, ShieldCheck, QrCode, BarChart3,
  Trash2, RefreshCw, Power, Lock, X, Clock, Dices,
  Lightbulb, Zap, AlertTriangle, TrendingUp,
  Wine, GlassWater, ChevronDown
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface StaffMember {
  id: string
  name: string
  role: string        // 'door' | 'bartender'  (legacy: 'Validador')
  access_code: string
  is_active: boolean
  bar_id: string | null
  created_at: string
}

interface Bar {
  id: string
  name: string
  is_active: boolean
}

interface StaffMetrics {
  [key: string]: {
    total_scans: number
    last_scan: string | null
    scans_per_minute: number
    insight_label: string
    insight_color: string
    insight_icon: React.ElementType
  }
}

interface TeamStats {
  total_staff_scans: number
  avg_team_speed: number
  active_validators: number
  global_recommendation: string
  status_color: string
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StaffPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const eventId = resolvedParams.id

  const [activeTab, setActiveTab] = useState<'door' | 'bartender'>('door')
  const [loading, setLoading] = useState(true)
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [bars, setBars] = useState<Bar[]>([])
  const [metrics, setMetrics] = useState<StaffMetrics>({})
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [newData, setNewData] = useState({ name: '', code: '', bar_id: '' })

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchBars = useCallback(async () => {
    const { data } = await supabase
      .from('bars')
      .select('id, name, is_active')
      .eq('event_id', eventId)
      .order('sort_order', { ascending: true })
    setBars(data || [])
  }, [eventId])

  const fetchStaffAndMetrics = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true)

      const { data: staffData, error } = await supabase
        .from('event_staff')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setStaffList(current => {
        if (JSON.stringify(current) === JSON.stringify(staffData)) return current
        return staffData || []
      })

      // Métricas solo para puertas (door)
      const doorStaff = (staffData || []).filter(s => s.role === 'door' || s.role === 'Validador')

      if (doorStaff.length > 0) {
        const staffIds = doorStaff.map(s => s.id)
        const scansData = await getStaffScans(eventId, staffIds)

        const newMetrics: StaffMetrics = {}
        let totalTeamScans = 0
        let sumSpeeds = 0
        let activeSpeedCount = 0

        doorStaff.forEach(staff => {
          const staffScans = scansData?.filter(scan => scan.staff_id === staff.id) || []
          const total = staffScans.length
          totalTeamScans += total

          const last = staffScans.length > 0
            ? staffScans.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
            : null

          const firstScan = staffScans.length > 0
            ? staffScans.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0].created_at
            : null

          let minutesActive = 1
          if (firstScan && last) {
            const diffMs = new Date(last).getTime() - new Date(firstScan).getTime()
            minutesActive = Math.max(1, diffMs / (1000 * 60))
          }

          const spm = total > 0 ? Math.round(total / minutesActive) : 0

          if (staff.is_active && total > 0) {
            sumSpeeds += spm
            activeSpeedCount++
          }

          let label = 'Esperando datos...'
          let color = 'text-white/40'
          let icon = Clock

          if (total > 0) {
            if (spm >= 6)      { label = '🔥 Máquina: ¡Rendimiento Top!'; color = 'text-[#FF007F]'; icon = Zap }
            else if (spm >= 3) { label = '✅ Constante: Buen ritmo';      color = 'text-[#00D15B]'; icon = TrendingUp }
            else if (spm >= 1) { label = '⚠️ Lento: Revisar conexión';    color = 'text-[#eab308]'; icon = AlertTriangle }
            else               { label = '💤 Detenido: Sin actividad';     color = 'text-white/40';  icon = Clock }
          }

          newMetrics[staff.id] = { total_scans: total, last_scan: last, scans_per_minute: spm, insight_label: label, insight_color: color, insight_icon: icon }
        })

        setMetrics(newMetrics)

        const avgTeamSpeed = activeSpeedCount > 0 ? Math.round(sumSpeeds / activeSpeedCount) : 0
        let globalRec = 'Esperando inicio del evento...'
        let statusColor = 'bg-white/5 border-white/10'

        if (totalTeamScans > 0) {
          if (avgTeamSpeed >= 5)      { globalRec = '🚀 Flujo Excelente: El equipo está volando.'; statusColor = 'bg-[#FF007F]/5 border-[#FF007F]/20' }
          else if (avgTeamSpeed >= 3) { globalRec = '✅ Flujo Saludable: El ingreso es fluido.';   statusColor = 'bg-[#00D15B]/5 border-[#00D15B]/20' }
          else                        { globalRec = '⚠️ Cuello de Botella: Flujo lento. Considera agregar más validadores.'; statusColor = 'bg-[#eab308]/5 border-[#eab308]/20' }
        }

        setTeamStats({
          total_staff_scans: totalTeamScans,
          avg_team_speed: avgTeamSpeed,
          active_validators: doorStaff.filter(s => s.is_active).length,
          global_recommendation: globalRec,
          status_color: statusColor,
        })
      } else {
        setMetrics({})
        setTeamStats(null)
      }
    } catch (error) {
      console.error('Error cargando staff:', error)
    } finally {
      if (!isSilent) setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    fetchBars()
    fetchStaffAndMetrics()

    const channel = supabase.channel(`staff_tracking:${eventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_staff', filter: `event_id=eq.${eventId}` }, () => { fetchStaffAndMetrics(true); fetchBars() })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'scans', filter: `event_id=eq.${eventId}` }, () => fetchStaffAndMetrics(true))
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [eventId, fetchStaffAndMetrics, fetchBars])

  // ── Acciones ───────────────────────────────────────────────────────────────

  const generateRandomCode = () => {
    setNewData(prev => ({ ...prev, code: Math.floor(100000 + Math.random() * 900000).toString() }))
  }

  const handleAdd = async () => {
    if (!newData.name || !newData.code) return toast.info('Completa todos los campos')
    if (newData.code.length !== 6) return toast.info('El código debe tener 6 dígitos')
    if (activeTab === 'bartender' && !newData.bar_id) return toast.info('Asigna una barra al bartender')

    try {
      const { error } = await supabase.from('event_staff').insert({
        event_id: eventId,
        name: newData.name,
        role: activeTab,
        access_code: newData.code,
        is_active: true,
        bar_id: activeTab === 'bartender' ? newData.bar_id : null,
      })

      if (error) {
        if (error.code === '23505') throw new Error('Código en uso. Genera otro.')
        throw error
      }

      setIsAdding(false)
      setNewData({ name: '', code: '', bar_id: '' })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error desconocido')
    }
  }

  const handleDelete = async (id: string) => {
    toast.warning('¿Eliminar este staff del evento?', {
      action: {
        label: 'Eliminar',
        onClick: async () => {
          await supabase.from('event_staff').delete().eq('id', id)
          setStaffList(prev => prev.filter(s => s.id !== id))
          toast.success('Staff eliminado.')
        }
      },
      cancel: { label: 'Cancelar', onClick: () => {} }
    })
  }

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus
    setStaffList(prev => prev.map(s => s.id === id ? { ...s, is_active: newStatus } : s))
    try {
      const { error } = await supabase.from('event_staff').update({ is_active: newStatus }).eq('id', id)
      if (error) throw error
    } catch (error: unknown) {
      toast.error('Error al guardar: ' + (error instanceof Error ? error.message : 'Error desconocido'))
      setStaffList(prev => prev.map(s => s.id === id ? { ...s, is_active: currentStatus } : s))
    }
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const doorStaff = staffList.filter(s => s.role === 'door' || s.role === 'Validador')
  const bartenderStaff = staffList.filter(s => s.role === 'bartender')
  const currentList = activeTab === 'door' ? doorStaff : bartenderStaff

  const filteredList = currentList.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getBarName = (barId: string | null) => {
    if (!barId) return 'Sin barra'
    return bars.find(b => b.id === barId)?.name ?? 'Sin barra'
  }

  if (loading && staffList.length === 0) return (
    <div className="flex items-center justify-center h-full pt-40">
      <Loader2 className="animate-spin text-[#8A2BE2]" size={40} />
    </div>
  )

  return (
    <div className="relative z-10 w-full max-w-[1600px] mx-auto space-y-8 animate-in fade-in pt-4">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5 pb-6">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-3 uppercase tracking-tighter">
            <ShieldCheck className="text-[#8A2BE2]" size={32} /> Gestión de Staff
          </h2>
          <p className="text-white/40 text-sm font-medium mt-1 ml-11">
            Puertas, validadores y bartenders del evento.
            <span className="ml-2 inline-flex items-center gap-1 text-[10px] bg-[#00D15B]/10 text-[#00D15B] px-2 py-0.5 rounded-full border border-[#00D15B]/20 animate-pulse font-black tracking-wider">● LIVE</span>
          </p>
        </div>
        <button
          onClick={() => { setIsAdding(true); setNewData({ name: '', code: '', bar_id: '' }) }}
          className="px-6 py-3 bg-white text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:scale-105 active:scale-95"
        >
          <Plus size={16} strokeWidth={3} />
          {activeTab === 'door' ? 'Nueva Puerta' : 'Nuevo Bartender'}
        </button>
      </div>

      {/* TABS */}
      <div className="flex gap-1 bg-zinc-900/50 p-1 rounded-xl w-fit border border-zinc-800">
        <button
          onClick={() => { setActiveTab('door'); setIsAdding(false) }}
          className={`px-5 py-2.5 rounded-lg text-xs font-black flex items-center gap-2 transition-all ${activeTab === 'door' ? 'bg-white text-black' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <ShieldCheck size={14} /> Puertas ({doorStaff.length})
        </button>
        <button
          onClick={() => { setActiveTab('bartender'); setIsAdding(false) }}
          className={`px-5 py-2.5 rounded-lg text-xs font-black flex items-center gap-2 transition-all ${activeTab === 'bartender' ? 'bg-white text-black' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Wine size={14} /> Bartenders ({bartenderStaff.length})
        </button>
      </div>

      {/* INSIGHT GLOBAL (solo para Puertas) */}
      {activeTab === 'door' && teamStats && (
        <div className={`p-8 rounded-[2.5rem] border backdrop-blur-xl animate-in zoom-in-95 duration-500 relative overflow-hidden ${teamStats.status_color}`}>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-50" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-white/10 rounded-full backdrop-blur-md shadow-lg border border-white/10">
                <Lightbulb size={32} className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-1">Diagnóstico del Evento</h3>
                <p className="text-white/80 text-sm font-medium max-w-xl leading-relaxed">{teamStats.global_recommendation}</p>
              </div>
            </div>
            <div className="flex gap-8 text-center bg-black/30 p-5 rounded-3xl backdrop-blur-md border border-white/10 shadow-xl">
              <div>
                <p className="text-4xl font-black text-white tracking-tighter">{teamStats.avg_team_speed}</p>
                <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-1">Scans/Min</p>
              </div>
              <div className="w-px bg-white/10" />
              <div>
                <p className="text-4xl font-black text-white tracking-tighter">{teamStats.active_validators}</p>
                <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-1">Puertas Activas</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AVISO: sin barras para bartenders */}
      {activeTab === 'bartender' && bars.length === 0 && (
        <div className="p-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 flex items-center gap-4">
          <AlertTriangle size={20} className="text-amber-400 shrink-0" />
          <div>
            <p className="text-amber-300 font-bold text-sm">Primero crea barras en la sección Consumos</p>
            <p className="text-amber-400/60 text-xs mt-0.5">Los bartenders deben estar asignados a una barra para funcionar correctamente.</p>
          </div>
        </div>
      )}

      {/* FORMULARIO */}
      {isAdding && (
        <div className="p-8 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] grid grid-cols-1 md:grid-cols-3 gap-6 animate-in zoom-in-95 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#8A2BE2]/10 rounded-full blur-[80px] pointer-events-none" />

          <div className="space-y-3 relative z-10">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">
              {activeTab === 'door' ? 'Nombre Puerta' : 'Nombre Bartender'}
            </label>
            <input
              value={newData.name}
              onChange={e => setNewData({ ...newData, name: e.target.value })}
              placeholder={activeTab === 'door' ? 'Ej: Acceso VIP' : 'Ej: Carlos'}
              className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:border-[#8A2BE2] outline-none font-bold placeholder:text-white/20 transition-all shadow-inner"
            />
          </div>

          {activeTab === 'bartender' && (
            <div className="space-y-3 relative z-10">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">Barra Asignada</label>
              <div className="relative">
                <select
                  value={newData.bar_id}
                  onChange={e => setNewData({ ...newData, bar_id: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:border-[#8A2BE2] outline-none font-bold transition-all shadow-inner appearance-none"
                >
                  <option value="">Seleccionar barra...</option>
                  {bars.map(bar => (
                    <option key={bar.id} value={bar.id}>{bar.name}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
              </div>
            </div>
          )}

          <div className="space-y-3 relative z-10">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">Código Acceso (6 dígitos)</label>
            <div className="flex gap-3">
              <input
                value={newData.code}
                onChange={e => { const val = e.target.value.replace(/\D/g, '').slice(0, 6); setNewData({ ...newData, code: val }) }}
                placeholder="123456"
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:border-[#8A2BE2] outline-none font-mono font-bold tracking-[0.2em] text-center placeholder:text-white/10 transition-all shadow-inner"
              />
              <button onClick={generateRandomCode} className="p-4 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-2xl border border-white/10 transition-all">
                <Dices size={20} />
              </button>
            </div>
          </div>

          <div className={`flex gap-3 items-end relative z-10 ${activeTab === 'bartender' ? 'md:col-start-3' : 'md:col-start-3'}`}>
            <button onClick={handleAdd} className="flex-1 py-4 bg-gradient-to-r from-[#8A2BE2] to-[#FF007F] text-white font-black rounded-2xl text-xs hover:opacity-90 uppercase tracking-[0.2em] transition-all shadow-[0_0_30px_rgba(138,43,226,0.3)] hover:scale-[1.02] active:scale-95">
              {activeTab === 'door' ? 'Crear Puerta' : 'Crear Bartender'}
            </button>
            <button onClick={() => setIsAdding(false)} className="p-4 text-white/40 hover:text-white bg-white/5 rounded-2xl transition-colors border border-white/5 hover:bg-white/10 hover:scale-110">
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* BUSCADOR */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-2 flex items-center gap-3 shadow-lg backdrop-blur-md w-full max-w-md mx-auto xl:mx-0">
        <Search size={20} className="text-white/30 ml-3" />
        <input type="text" placeholder="Buscar personal..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-transparent border-none outline-none text-sm font-medium text-white flex-1 p-2 placeholder:text-white/20" />
      </div>

      {/* LISTA */}
      {filteredList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 px-4 border-2 border-dashed border-white/10 rounded-[3rem] bg-white/5 text-center backdrop-blur-sm">
          <div className="bg-white/5 p-6 rounded-full mb-6 border border-white/5 shadow-xl">
            {activeTab === 'door' ? <ShieldCheck size={48} className="text-white/20" /> : <Wine size={48} className="text-white/20" />}
          </div>
          <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-wide">
            {activeTab === 'door' ? 'Sin Puertas Activas' : 'Sin Bartenders'}
          </h3>
          <p className="text-white/40 text-sm font-medium max-w-md">
            {activeTab === 'door' ? 'Crea tu primer acceso para validar tickets.' : 'Agrega bartenders para gestionar la cola de consumos.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredList.map(member => (
            activeTab === 'door' ? (
              <DoorCard
                key={member.id}
                member={member}
                metrics={metrics[member.id] || { total_scans: 0, last_scan: null, scans_per_minute: 0, insight_label: 'Sin datos', insight_color: 'text-white/40', insight_icon: Clock }}
                onDelete={() => handleDelete(member.id)}
                onToggle={() => toggleStatus(member.id, member.is_active)}
              />
            ) : (
              <BartenderCard
                key={member.id}
                member={member}
                barName={getBarName(member.bar_id)}
                onDelete={() => handleDelete(member.id)}
                onToggle={() => toggleStatus(member.id, member.is_active)}
              />
            )
          ))}
        </div>
      )}
    </div>
  )
}

// ─── DoorCard (tarjeta puerta/validador) ─────────────────────────────────────

function DoorCard({ member, metrics, onDelete, onToggle }: {
  member: StaffMember
  metrics: StaffMetrics[string]
  onDelete: () => void
  onToggle: () => void
}) {
  const copyCode = () => { navigator.clipboard.writeText(member.access_code); toast.success('Código copiado') }
  const lastScanTime = metrics.last_scan ? new Date(metrics.last_scan).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'
  const InsightIcon = metrics.insight_icon

  return (
    <div className={`bg-white/5 backdrop-blur-xl border rounded-[2rem] p-6 transition-all duration-500 group relative overflow-hidden shadow-2xl ${member.is_active ? 'border-white/10 hover:border-white/20' : 'border-[#FF007F]/20 opacity-60 grayscale hover:grayscale-0'}`}>
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#8A2BE2]/10 rounded-full blur-[80px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-black/40 flex items-center justify-center border border-white/10 shadow-inner text-white font-black text-lg">
            {member.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-tight">{member.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-white/40 text-xs font-bold uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">Puerta</span>
              <span className={`w-2 h-2 rounded-full ${member.is_active ? 'bg-[#00D15B]' : 'bg-[#FF007F]'}`} />
            </div>
          </div>
        </div>
        <button onClick={copyCode} className="flex flex-col items-end group/code cursor-pointer">
          <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1 group-hover/code:text-[#8A2BE2] transition-colors">Código</span>
          <div className="flex items-center gap-2 bg-black/40 border border-white/10 px-3 py-1.5 rounded-xl group-hover/code:border-[#8A2BE2]/50 transition-all shadow-inner">
            <Lock size={12} className="text-white/30 group-hover/code:text-[#8A2BE2]" />
            <span className="text-white font-mono font-bold tracking-[0.2em] text-base">{member.access_code}</span>
          </div>
        </button>
      </div>

      <div className="mb-6 p-3 rounded-2xl bg-black/20 border border-white/5 flex items-center gap-3 shadow-inner">
        <div className={`p-1.5 rounded-xl bg-white/5 border border-white/5 ${metrics.insight_color}`}>
          <InsightIcon size={16} />
        </div>
        <span className={`text-xs font-black uppercase tracking-wide ${metrics.insight_color}`}>{metrics.insight_label}</span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6 relative z-10">
        {[
          { icon: <QrCode size={18} />, value: metrics.total_scans, label: 'Total Scans' },
          { icon: <Clock size={18} />, value: lastScanTime, label: 'Último Ingreso' },
          { icon: <BarChart3 size={18} />, value: metrics.scans_per_minute, label: '~ Scans / Min' },
        ].map(({ icon, value, label }) => (
          <div key={label} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col justify-between h-24 hover:bg-white/10 transition-colors group/stat">
            <div className="text-white/20 group-hover/stat:text-white transition-colors">{icon}</div>
            <div>
              <span className="text-2xl font-black text-white tracking-tighter">{value}</span>
              <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.1em] mt-1">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-white/5 relative z-10">
        <button onClick={onToggle} className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2.5 rounded-xl transition-all shadow-lg ${member.is_active ? 'bg-black/40 text-white/40 hover:text-white border border-white/5 hover:bg-white/5' : 'bg-[#00D15B]/10 text-[#00D15B] border border-[#00D15B]/20'}`}>
          {member.is_active ? <><Power size={12} /> Desactivar</> : <><RefreshCw size={12} /> Reactivar</>}
        </button>
        <button onClick={onDelete} className="p-2.5 text-white/20 hover:text-[#FF007F] hover:bg-[#FF007F]/10 rounded-xl transition-all border border-transparent hover:border-[#FF007F]/20">
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  )
}

// ─── BartenderCard ────────────────────────────────────────────────────────────

function BartenderCard({ member, barName, onDelete, onToggle }: {
  member: StaffMember
  barName: string
  onDelete: () => void
  onToggle: () => void
}) {
  const copyCode = () => { navigator.clipboard.writeText(member.access_code); toast.success('Código copiado') }

  return (
    <div className={`bg-white/5 backdrop-blur-xl border rounded-[2rem] p-6 transition-all duration-500 group relative overflow-hidden shadow-2xl ${member.is_active ? 'border-white/10 hover:border-white/20' : 'border-[#FF007F]/20 opacity-60 grayscale hover:grayscale-0'}`}>
      <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-[80px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20 shadow-inner">
            <GlassWater size={22} className="text-violet-400" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-tight">{member.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-violet-400 text-xs font-bold uppercase tracking-wider bg-violet-500/10 px-2 py-0.5 rounded-lg border border-violet-500/20">Bartender</span>
              <span className={`w-2 h-2 rounded-full ${member.is_active ? 'bg-[#00D15B]' : 'bg-[#FF007F]'}`} />
            </div>
          </div>
        </div>
        <button onClick={copyCode} className="flex flex-col items-end group/code cursor-pointer">
          <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1 group-hover/code:text-violet-400 transition-colors">Código</span>
          <div className="flex items-center gap-2 bg-black/40 border border-white/10 px-3 py-1.5 rounded-xl group-hover/code:border-violet-500/50 transition-all shadow-inner">
            <Lock size={12} className="text-white/30 group-hover/code:text-violet-400" />
            <span className="text-white font-mono font-bold tracking-[0.2em] text-base">{member.access_code}</span>
          </div>
        </button>
      </div>

      {/* Barra asignada */}
      <div className="mb-6 p-4 rounded-2xl bg-black/20 border border-white/5 flex items-center gap-3">
        <div className="p-2 bg-violet-500/10 rounded-xl border border-violet-500/20">
          <GlassWater size={16} className="text-violet-400" />
        </div>
        <div>
          <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Barra Asignada</p>
          <p className="text-white font-bold text-sm mt-0.5">{barName}</p>
        </div>
        <div className={`ml-auto px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${member.is_active ? 'bg-[#00D15B]/10 text-[#00D15B] border border-[#00D15B]/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {member.is_active ? 'En turno' : 'Fuera de turno'}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-white/5 relative z-10">
        <button onClick={onToggle} className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2.5 rounded-xl transition-all shadow-lg ${member.is_active ? 'bg-black/40 text-white/40 hover:text-white border border-white/5 hover:bg-white/5' : 'bg-[#00D15B]/10 text-[#00D15B] border border-[#00D15B]/20'}`}>
          {member.is_active ? <><Power size={12} /> Finalizar Turno</> : <><RefreshCw size={12} /> Iniciar Turno</>}
        </button>
        <button onClick={onDelete} className="p-2.5 text-white/20 hover:text-[#FF007F] hover:bg-[#FF007F]/10 rounded-xl transition-all border border-transparent hover:border-[#FF007F]/20">
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  )
}
