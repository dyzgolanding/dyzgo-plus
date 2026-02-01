'use client'
import { useEffect, useState, useCallback } from 'react'
import { 
  DollarSign, Ticket, Activity, 
  TrendingUp, PieChart as PieIcon,
  Filter, CheckCircle2, QrCode, Users,
  Target, Clock, Repeat, FileDown,
  Info, RefreshCw, AlertTriangle, Lightbulb,
  HelpCircle, ChevronRight, UserCheck, Sparkles
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useOrg } from '@/components/providers/org-provider'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
  BarChart, Bar
} from 'recharts'
import { subHours, subDays, subYears, format, eachHourOfInterval, eachDayOfInterval } from 'date-fns'

// Paleta Neón Ajustada para Liquid Glass
const COLORS = { 
  primary: '#8b5cf6', secondary: '#06b6d4', accent: '#ec4899', 
  success: '#10b981', warning: '#eab308', error: '#ef4444',
  male: '#3b82f6', female: '#ec4899', other: '#a855f7'
}
const PIE_COLORS = [COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.success, COLORS.warning]

export default function AnalyticsPage() {
  const { currentOrgId } = useOrg()
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<any[]>([])
  
  // Filtros
  const [selectedEventId, setSelectedEventId] = useState<string>('all')
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '1y' | 'all'>('30d')
  const [refreshTrigger, setRefreshTrigger] = useState(0) 

  // --- ESTADO MAESTRO ---
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    revenueGoal: 0,
    avgTicketPrice: 0,
    totalViews: 0,
    conversionRate: 0,
    recurringRate: 0,
    ticketsSold: 0,
    ticketsAvailable: 0,
    totalStock: 0,
    ticketsScanned: 0,
    attendanceRate: 0,
    salesByTier: [] as any[],
    stockVsSold: [] as any[],
    entryTimeData: [] as any[],
    attendanceByTier: [] as any[], 
    uniqueUsersCount: 0,
    uniqueUsersGraph: [] as any[],
    uniqueUsersList: [] as any[],
    genderStats: [] as any[],
    ageStats: [] as any[]
  })

  const [rawTickets, setRawTickets] = useState<any[]>([])

  // 1. CARGA DE DATOS
  const fetchData = useCallback(async () => {
    if (!currentOrgId) return
    if (loading && refreshTrigger === 0) setLoading(true)
    
    try {
      // 1. Traer Eventos SOLO de la Org actual
      const { data: eventsList } = await supabase
        .from('events')
        .select('id, title, views, date')
        .eq('experience_id', currentOrgId)
      
      if (eventsList) setEvents(eventsList)

      const targetEventIds = selectedEventId === 'all' 
          ? (eventsList?.map(e => e.id) || [])
          : [selectedEventId]

      // --- CORRECCIÓN DE SEGURIDAD ---
      // Si no hay eventos en esta Org (o el array está vacío), detenemos aquí.
      // Esto evita que la query de tickets corra sin filtro 'in()' y traiga datos ajenos.
      if (targetEventIds.length === 0) {
        processAllMetrics([], eventsList || [], timeRange, [])
        setRawTickets([])
        setLoading(false)
        return
      }
      // ------------------------------

      const { data: allTiers } = await supabase
          .from('ticket_tiers')
          .select('id, name, price, total_stock, event_id')
          .in('event_id', targetEventIds)

      let query = supabase
        .from('tickets')
        .select(`
            id, paid_price, status, created_at, scanned_at,
            tier_id, user_id, guest_email, guest_name,
            profiles:user_id ( full_name, email, gender, birth_date, rut ), 
            ticket_tiers ( id, name, price, total_stock ),
            events ( id, date, title )
        `)
        .neq('status', 'refunded')
        .order('created_at', { ascending: true })
      
      // Aquí ya es seguro usar targetEventIds porque validamos arriba que no esté vacío
      if (targetEventIds.length > 0) {
        query = query.in('event_id', targetEventIds)
      }

      if (timeRange !== 'all') {
        const now = new Date()
        let dateLimit = new Date()
        switch (timeRange) {
            case '24h': dateLimit = subHours(now, 24); break;
            case '7d': dateLimit = subDays(now, 7); break;
            case '30d': dateLimit = subDays(now, 30); break;
            case '1y': dateLimit = subYears(now, 1); break;
        }
        query = query.gte('created_at', dateLimit.toISOString())
      }

      const { data: tickets } = await query

      if (tickets) {
        processAllMetrics(tickets, eventsList || [], timeRange, allTiers || [])
        setRawTickets(tickets)
      }
    } catch (err) {
      console.error("Error fetch:", err)
    } finally {
      setLoading(false)
    }
  }, [currentOrgId, selectedEventId, timeRange])

  useEffect(() => { fetchData() }, [fetchData, refreshTrigger])

  useEffect(() => {
    if (!currentOrgId) return
    const channel = supabase.channel('finance_realtime_v7')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => {
              setTimeout(() => setRefreshTrigger(prev => prev + 1), 1500) 
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scans' }, () => {
              setTimeout(() => setRefreshTrigger(prev => prev + 1), 1000)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [currentOrgId])

  // 4. PROCESAMIENTO
  const processAllMetrics = (tickets: any[], eventList: any[], range: string, allTiers: any[]) => {
    let revenue = 0
    let scanned = 0
    let sold = tickets.length
    
    const tierMap = new Map<string, any>()
    
    // Inicializar mapa con datos base
    allTiers.forEach(tier => {
        tierMap.set(tier.id, { 
            id: tier.id, 
            name: tier.name, 
            sold: 0, 
            revenue: 0, 
            stock: tier.total_stock, 
            scanned: 0, 
            staticPrice: Number(tier.price) // Aseguramos que sea número
        })
    })

    const hourlyScans = new Map<string, number>()
    const dateMap = new Map<string, number>() 
    const usersMap = new Map<string, any>()
    const userGrowthMap = new Map<string, number>()
    
    let maleCount = 0
    let femaleCount = 0
    let otherCount = 0
    const ageBuckets = { '18-24': 0, '25-34': 0, '35-44': 0, '45+': 0 }
    
    let cumulativeUsers = 0
    let recurringUsers = 0

    const targetEvents = selectedEventId === 'all' 
        ? eventList 
        : eventList.filter(e => e.id === selectedEventId)
    const totalViews = targetEvents.reduce((acc, e) => acc + (e.views || 0), 0)

    tickets.forEach(t => {
        const tId = t.tier_id
        const mappedTier = tierMap.get(tId)

        // --- LÓGICA ROBUSTA DE PRECIO ---
        let finalPrice = Number(t.paid_price)

        // Si el precio pagado es 0 o inválido, forzamos el precio del tier
        if (!finalPrice || finalPrice === 0) {
            // Intentamos obtenerlo del join
            finalPrice = Number(t.ticket_tiers?.price)
            // Si el join falla (es 0 o null), usamos el mapa de respaldo
            if ((!finalPrice || finalPrice === 0) && mappedTier) {
                finalPrice = mappedTier.staticPrice
            }
        }
        
        // Acumular Revenue Total
        revenue += finalPrice

        const tDate = new Date(t.created_at)
        let dateKey = ''
        if (range === '24h') dateKey = format(tDate, 'HH:00')
        else dateKey = format(tDate, 'dd/MM')
        
        dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + finalPrice)

        if (t.scanned_at) {
            scanned++
            const hour = new Date(t.scanned_at).getHours()
            const timeKey = `${hour}:00`
            hourlyScans.set(timeKey, (hourlyScans.get(timeKey) || 0) + 1)
        }

        // Actualizar estadísticas por Tier en el mapa
        if (tId && tierMap.has(tId)) {
            const tierStat = tierMap.get(tId)
            tierStat.sold++
            tierStat.revenue += finalPrice // Usamos el precio corregido
            if (t.scanned_at) tierStat.scanned++
        } else if (tId) {
            // Caso borde: Tier no encontrado en allTiers pero presente en ticket
            const tName = t.ticket_tiers?.name || 'Desconocido'
            const tStock = t.ticket_tiers?.total_stock || 0
            tierMap.set(tId, { id: tId, name: tName, sold: 1, revenue: finalPrice, stock: tStock, scanned: t.scanned_at ? 1 : 0, staticPrice: finalPrice })
        }

        // Usuarios y Demografía
        const uniqueKey = t.user_id || t.guest_email || t.id
        const userName = t.profiles?.full_name || t.guest_name || 'Anónimo'
        const userEmail = t.profiles?.email || t.guest_email || 'Sin Email'
        const userRut = t.profiles?.rut || 'Sin RUT'

        if (!usersMap.has(uniqueKey)) {
            cumulativeUsers++
            usersMap.set(uniqueKey, { name: userName, email: userEmail, rut: userRut, totalSpent: 0, ticketsCount: 0, lastDate: t.created_at })
            userGrowthMap.set(dateKey, cumulativeUsers)
        } else {
            const u = usersMap.get(uniqueKey)
            // SI EL USUARIO REPITE COMPRA: Incrementamos recurrentes si es su segunda entrada detectada
            if (u.ticketsCount === 1) {
              recurringUsers++ 
            }
            if (!userGrowthMap.has(dateKey)) userGrowthMap.set(dateKey, cumulativeUsers)
            else userGrowthMap.set(dateKey, cumulativeUsers)
        }
        const user = usersMap.get(uniqueKey)
        user.totalSpent += finalPrice
        user.ticketsCount += 1
        if (new Date(t.created_at) > new Date(user.lastDate)) user.lastDate = t.created_at

        if (t.profiles) {
             if (t.profiles.gender === 'Masculino') maleCount++
             else if (t.profiles.gender === 'Femenino') femaleCount++
             else otherCount++

             if (t.profiles.birth_date) {
                 const birth = new Date(t.profiles.birth_date)
                 const today = new Date()
                 let age = today.getFullYear() - birth.getFullYear()
                 const m = today.getMonth() - birth.getMonth()
                 if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
                     age--
                 }
                 if (age >= 18 && age <= 24) ageBuckets['18-24']++
                 else if (age >= 25 && age <= 34) ageBuckets['25-34']++
                 else if (age >= 35 && age <= 44) ageBuckets['35-44']++
                 else if (age >= 45) ageBuckets['45+']++
             }
        }
    })

    const now = new Date()
    let intervals: Date[] = []
    let formatKey = ''

    if (range === '24h') {
        intervals = eachHourOfInterval({ start: subHours(now, 24), end: now })
        formatKey = 'HH:00'
    } else {
        const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '1y' ? 365 : 30
        intervals = eachDayOfInterval({ start: subDays(now, days), end: now })
        formatKey = 'dd/MM'
    }

    let lastAccumulated = 0
    const uniqueUsersGraph = intervals.map(date => {
        const key = format(date, formatKey)
        const val = userGrowthMap.get(key)
        if (val !== undefined) lastAccumulated = val
        return { date: key, count: lastAccumulated }
    })

    const tiersArray = Array.from(tierMap.values())
    const salesByTier = tiersArray.map(t => ({
        name: t.name, value: t.sold, revenue: t.revenue
    })).sort((a,b) => b.value - a.value)

    const totalStock = tiersArray.reduce((acc, t) => acc + t.stock, 0)
    const stockVsSold = [{ name: 'Vendidos', value: sold }, { name: 'Disponibles', value: Math.max(0, totalStock - sold) }]

    const entryTimeData = Array.from({length: 24}, (_, i) => {
        const key = `${i}:00`
        return { time: key, count: hourlyScans.get(key) || 0 }
    })

    const attendanceByTier = tiersArray.map(t => ({
        name: t.name, scanned: t.scanned, unscanned: Math.max(0, t.sold - t.scanned), rate: t.sold > 0 ? (t.scanned/t.sold)*100 : 0
    }))

    const potentialRev = tiersArray.reduce((acc, t) => acc + (t.stock * t.staticPrice), 0)

    const finalGenderStats = [
        { name: 'Mujeres', value: femaleCount, color: COLORS.female },
        { name: 'Hombres', value: maleCount, color: COLORS.male },
        { name: 'Otros', value: otherCount, color: COLORS.other },
    ].filter(g => g.value > 0)

    const finalAgeStats = [
        { range: '18-24', count: ageBuckets['18-24'] },
        { range: '25-34', count: ageBuckets['25-34'] },
        { range: '35-44', count: ageBuckets['35-44'] },
        { range: '45+', count: ageBuckets['45+'] },
    ]

    setMetrics({
        totalRevenue: revenue,
        revenueGoal: potentialRev > 0 ? potentialRev : revenue * 1.5,
        avgTicketPrice: sold > 0 ? revenue / sold : 0,
        totalViews,
        conversionRate: totalViews > 0 ? (sold / totalViews) * 100 : 0,
        recurringRate: usersMap.size > 0 ? (recurringUsers / usersMap.size) * 100 : 0,
        ticketsSold: sold,
        ticketsAvailable: Math.max(0, totalStock - sold),
        totalStock,
        ticketsScanned: scanned,
        attendanceRate: sold > 0 ? (scanned / sold) * 100 : 0,
        salesByTier,
        stockVsSold,
        entryTimeData,
        attendanceByTier,
        uniqueUsersCount: usersMap.size,
        uniqueUsersGraph,
        uniqueUsersList: Array.from(usersMap.values()).sort((a, b) => b.totalSpent - a.totalSpent),
        genderStats: finalGenderStats,
        ageStats: finalAgeStats
    })
  }

  // --- CORRECCIÓN EXPORTAR BASE DE DATOS CLIENTES ---
  const handleDownloadUsers = () => {
    const headers = 'Nombre,Correo,RUT,Total gastado,Tickets totales,Fecha de última compra'
    const rows = metrics.uniqueUsersList.map(u => {
      const fecha = format(new Date(u.lastDate), 'dd/MM/yyyy HH:mm')
      return `"${u.name}","${u.email}","${u.rut}",${u.totalSpent},${u.ticketsCount},"${fecha}"`
    })
    
    const csv = [headers, ...rows].join('\n')
    downloadCSV(csv, 'base_datos_clientes')
  }

  const handleExportAll = () => {
    const headers = 'ID,Precio,Fecha,Estado,Tipo de ticket,Nombre del evento,Email,RUT'
    const rows = rawTickets.map(t => {
      const id = t.id
      const precio = t.ticket_tiers?.price || 0
      const fecha = format(new Date(t.created_at), 'dd/MM/yyyy HH:mm')
      const estado = t.status
      const tipoTicket = t.ticket_tiers?.name || 'General'
      const nombreEvento = t.events?.title || 'Evento'
      const email = t.profiles?.email || t.guest_email || 'Sin Email'
      const rut = t.profiles?.rut || 'Sin RUT'
      
      return `"${id}",${precio},"${fecha}","${estado}","${tipoTicket}","${nombreEvento}","${email}","${rut}"`
    })

    const csv = [headers, ...rows].join('\n')
    downloadCSV(csv, 'transacciones_completa')
  }

  const downloadCSV = (content: string, prefix: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `${prefix}_${new Date().toISOString()}.csv`; a.click()
  }

  return (
    // CONTENEDOR LIMPIO - SIN FONDO (YA ESTÁ EN EL LAYOUT)
    <div className="max-w-[1600px] mx-auto space-y-12 animate-in fade-in pt-2">
      
        {/* HEADER */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 border-b border-white/5 pb-6">
            <div>
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-2">
                    Analíticas
                </h1>
                <p className="text-white/40 text-sm flex items-center gap-2 font-medium">
                    Acá podrás ver el resumen de tus analíticas y el rendimiento de tus eventos.
                </p>
            </div>

            <div className="flex flex-wrap xl:flex-nowrap items-center gap-3 bg-white/5 backdrop-blur-md p-2 rounded-2xl border border-white/10 shadow-lg shadow-purple-900/10">
                <div className="relative">
                    <select value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)} className="bg-black/40 text-white text-xs font-bold px-4 py-2.5 pr-10 rounded-xl outline-none border border-white/10 cursor-pointer min-w-[220px] h-10 appearance-none hover:bg-black/60 transition-colors focus:border-[#8A2BE2]/50">
                        <option value="all">Todos los Eventos</option>
                        {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                    </select>
                    <Filter className="absolute right-3.5 top-3 text-white/40 pointer-events-none" size={14} />
                </div>
                <div className="flex bg-black/40 rounded-xl p-1 border border-white/10 h-10 items-center">
                    {['24h', '7d', '30d', '1y', 'all'].map((range) => (
                        <button key={range} onClick={() => setTimeRange(range as any)} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${timeRange === range ? 'bg-white/10 text-white shadow-sm border border-white/5' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
                            {range === 'all' ? 'TODO' : range.toUpperCase()}
                        </button>
                    ))}
                </div>
                <button onClick={() => setRefreshTrigger(prev => prev + 1)} className="p-2.5 bg-black/40 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white rounded-xl transition-all h-10 w-10 flex items-center justify-center" title="Recargar"><RefreshCw size={16} className={loading ? 'animate-spin' : ''}/></button>
                <button onClick={handleExportAll} className="flex items-center gap-2 px-5 bg-gradient-to-r from-[#8A2BE2] to-[#FF007F] hover:opacity-90 text-white rounded-xl shadow-lg text-xs font-bold transition-all h-10 uppercase tracking-wider"><FileDown size={16} /> Exportar</button>
            </div>
        </div>

        {/* KPIs */}
        <section className="space-y-6">
            <SectionHeader 
                title="Resumen Ejecutivo" 
                subtitle="KPIs" 
                description="Visión general de indicadores calculados sobre ventas brutas y comportamiento de compra."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard title="Ingresos Totales" value={`$${metrics.totalRevenue.toLocaleString('es-CL')}`} sub={`Meta: $${metrics.revenueGoal.toLocaleString()}`} icon={<Target size={20}/>} progress={(metrics.totalRevenue / (metrics.revenueGoal || 1)) * 100} color="text-[#00D15B]" bg="bg-[#00D15B]/10" tooltip="Suma total de tickets pagados." />
                <KpiCard title="Ticket Promedio" value={`$${metrics.avgTicketPrice.toFixed(0)}`} sub="Ingreso medio" icon={<DollarSign size={20}/>} color="text-[#06b6d4]" bg="bg-[#06b6d4]/10" tooltip="Ingreso Total / Cantidad de Transacciones." />
                <KpiCard title="Tasa Conversión" value={`${metrics.conversionRate.toFixed(2)}%`} sub="Visitas vs Compras" icon={<Activity size={20}/>} color="text-[#FF007F]" bg="bg-[#FF007F]/10" tooltip="Porcentaje de visualizaciones que terminan en venta." />
                <KpiCard title="Fidelización" value={`${metrics.recurringRate.toFixed(1)}%`} sub="Clientes Recurrentes" icon={<Repeat size={20}/>} color="text-[#eab308]" bg="bg-[#eab308]/10" tooltip="Porcentaje de usuarios con más de una compra histórica." />
            </div>
            {/* NUEVO INSIGHT PARA KPIs */}
            <div className="w-full">
                <InsightBox 
                    type="info"
                    text="Tip Financiero: Si tu tasa de conversión es baja pero tienes muchas visitas, revisa si el precio es muy alto o si el proceso de compra es confuso. Si la fidelización es alta, crea un programa de recompensas."
                />
            </div>
        </section>

        {/* VENTAS */}
        <section className="space-y-6">
            <SectionHeader 
                title="Rendimiento Comercial" 
                subtitle="Ventas" 
                description="Cálculo de ocupación (Tickets Vendidos / Stock Total) y desglose de ingresos por tipo de ticket."
            />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Ocupación */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 flex flex-col justify-between shadow-2xl shadow-purple-900/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#8A2BE2]/20 rounded-full blur-[60px] pointer-events-none"/>
                    <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-3 mb-2 uppercase tracking-widest"><Ticket size={16} className="text-[#8A2BE2]"/> Ocupación</h3>
                    </div>
                    
                    <div className="h-[280px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={metrics.stockVsSold} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value" stroke="none">
                                    <Cell fill="#8A2BE2" /><Cell fill="rgba(255,255,255,0.05)" />
                                </Pie>
                                <Tooltip contentStyle={{backgroundColor: '#000000cc', border: '1px solid #ffffff20', borderRadius: '12px', backdropFilter: 'blur(10px)'}} itemStyle={{color: '#fff'}}/>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Vendido</span>
                            <span className="text-5xl font-black text-white mt-1">{((metrics.ticketsSold / (metrics.totalStock || 1)) * 100).toFixed(0)}%</span>
                        </div>
                    </div>

                    <InsightBox 
                        type={metrics.ticketsSold / (metrics.totalStock || 1) > 0.8 ? 'positive' : 'neutral'}
                        text={metrics.ticketsSold / (metrics.totalStock || 1) > 0.8 
                            ? "¡Excelente ocupación! Estás cerca del Sold Out. Considera liberar reservas." 
                            : "Aún tienes mucho inventario disponible. Intensifica la promoción en redes."
                        }
                    />
                </div>
                
                {/* Mix de Ventas */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 flex flex-col shadow-2xl shadow-purple-900/10">
                    <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-3 mb-2 uppercase tracking-widest"><PieIcon size={16} className="text-[#06b6d4]"/> Mix de Ventas</h3>
                    </div>

                    <div className="flex flex-col xl:flex-row gap-8 h-full items-center justify-center mt-4 mb-6">
                        <div className="w-full xl:w-1/2 h-[260px]">
                          <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                  <Pie data={metrics.salesByTier} cx="50%" cy="50%" outerRadius={110} innerRadius={70} dataKey="revenue" stroke="none" paddingAngle={2}>
                                      {metrics.salesByTier.map((e, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                  </Pie>
                                  <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} contentStyle={{backgroundColor: '#000000cc', border: '1px solid #ffffff20', borderRadius: '12px', backdropFilter: 'blur(10px)'}} itemStyle={{color:'#fff'}}/>
                              </PieChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="w-full xl:w-1/2 flex flex-col justify-center space-y-3">
                            {metrics.salesByTier.slice(0, 5).map((t, i) => (
                                <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-default">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full shadow-[0_0_10px_currentColor]" style={{color: PIE_COLORS[i % PIE_COLORS.length], backgroundColor: PIE_COLORS[i % PIE_COLORS.length]}}/>
                                        <div>
                                            <span className="text-xs font-bold text-white block">{t.name}</span>
                                            <span className="text-[10px] text-white/40">{t.value} tix</span>
                                        </div>
                                    </div>
                                    <span className="text-xs font-mono font-bold text-white/80">${t.revenue.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-auto">
                        <InsightBox 
                            type="info"
                            text="Analiza tu 'Best Seller'. Si un ticket barato se agota rápido y genera poco revenue, considera ajustar su precio o stock."
                        />
                    </div>
                </div>
            </div>
        </section>

        {/* ACCESOS */}
        <section className="space-y-6">
            <SectionHeader 
                title="Operativa" 
                subtitle="Accesos" 
                description="Datos de validación de tickets (QR Scans). Muestra el flujo de entrada por hora y la tasa de asistencia real."
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Asistencia */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-2xl shadow-purple-900/10 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-6">
                            <h3 className="text-sm font-bold text-white flex items-center gap-3 uppercase tracking-widest"><QrCode size={16} className="text-[#eab308]"/> Asistencia</h3>
                            <div className="bg-[#eab308]/10 px-3 py-1 rounded-lg border border-[#eab308]/20 text-[9px] text-[#eab308] font-bold uppercase tracking-wider animate-pulse">En Vivo</div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 items-center">
                            <div className="h-[220px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={[{name: 'Asistieron', value: metrics.ticketsScanned}, {name: 'No Asistieron', value: Math.max(0, metrics.ticketsSold - metrics.ticketsScanned)}]} cx="50%" cy="50%" innerRadius={70} outerRadius={100} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                                            <Cell fill="#eab308" /><Cell fill="rgba(255,255,255,0.05)" />
                                        </Pie>
                                        <Tooltip contentStyle={{backgroundColor: '#000000cc', border: '1px solid #ffffff20', borderRadius: '12px', backdropFilter: 'blur(10px)'}} itemStyle={{color: '#fff'}}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="text-center">
                                <span className="text-6xl font-black text-white tracking-tighter block drop-shadow-lg">{metrics.attendanceRate.toFixed(0)}%</span>
                                <span className="text-[10px] text-white/40 font-bold uppercase mt-2 block tracking-widest">Tasa Global</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <InsightBox 
                            type={metrics.attendanceRate < 70 ? 'negative' : 'positive'}
                            text={metrics.attendanceRate < 70 
                                ? "Atención: Tasa de asistencia baja. Verifica posibles problemas en el acceso o clima." 
                                : "¡Buena convocatoria! Tus usuarios valoran el ticket y asisten al evento."
                            }
                        />
                    </div>
                </div>

                {/* Curva de Ingreso */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 flex flex-col justify-between shadow-2xl shadow-purple-900/10">
                    <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-3 mb-6 uppercase tracking-widest"><Clock size={16} className="text-[#3b82f6]"/> Curva de Ingreso</h3>
                    </div>
                    
                    <div className="flex-1 min-h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={metrics.entryTimeData}>
                                <defs>
                                    <linearGradient id="colorEntry" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false}/>
                                <XAxis dataKey="time" stroke="#ffffff40" fontSize={10} axisLine={false} tickLine={false} minTickGap={30} />
                                <Tooltip contentStyle={{backgroundColor: '#000000cc', border: '1px solid #ffffff20', borderRadius: '12px'}} itemStyle={{color:'#fff'}}/>
                                <Area type="monotone" dataKey="count" stroke="#3b82f6" fill="url(#colorEntry)" strokeWidth={3}/>
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* NUEVO INSIGHT PARA CURVA DE INGRESO */}
                    <div className="mt-6">
                        <InsightBox 
                            type="info"
                            text="Usa la hora pico para gestionar tu personal. Refuerza la seguridad 1 hora antes del pico máximo previsto."
                        />
                    </div>
                </div>
            </div>
        </section>

        {/* AUDIENCIA */}
        <section className="space-y-6">
            <SectionHeader 
                title="Audiencia" 
                subtitle="Demografía" 
                description="Análisis del perfil del comprador basado en datos de registro (Edad, Género) y crecimiento de la base de datos."
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Base de Usuarios */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 flex flex-col justify-between shadow-2xl shadow-purple-900/10">
                    <div>
                        <div className="flex justify-between items-start mb-6">
                            <h3 className="text-sm font-bold text-white flex items-center gap-3 uppercase tracking-widest"><Users size={16} className="text-[#3b82f6]"/> Usuarios unicos</h3>
                            <button onClick={handleDownloadUsers} className="p-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg transition-colors border border-white/5">
                                <FileDown size={16}/>
                            </button>
                        </div>
                        
                        <div className="h-[250px] w-full -ml-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={metrics.uniqueUsersGraph}>
                                    <defs>
                                        <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#ffffff40', fontSize: 10 }} minTickGap={30}/>
                                    <Tooltip contentStyle={{ backgroundColor: '#000000cc', border: '1px solid #ffffff20', borderRadius: '12px' }} itemStyle={{ color: '#fff' }} cursor={{ stroke: '#ffffff20', strokeWidth: 1 }}/>
                                    <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} fill="url(#userGradient)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        
                        <div className="mt-6 mb-6">
                            <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest block">Total Clientes</span>
                            <span className="text-5xl font-black text-white mt-2">{metrics.uniqueUsersCount}</span>
                        </div>
                    </div>

                    {/* NUEVO INSIGHT PARA CRECIMIENTO */}
                    <div className="mt-auto">
                        <InsightBox 
                            type="info"
                            text="Si la curva se aplana, activa campañas de 'Referidos' o promociones para nuevos usuarios para reactivar el crecimiento."
                        />
                    </div>
                </div>

                {/* Demografía */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-2xl shadow-purple-900/10 flex flex-col justify-between">
                    <div>
                        <div>
                            <h3 className="text-sm font-bold text-white flex items-center gap-3 mb-8 uppercase tracking-widest"><UserCheck size={16} className="text-[#a855f7]"/> Perfil Demográfico</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 h-full pb-6">
                            {/* Género */}
                            <div className="flex flex-col items-center">
                                <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-6 w-full text-center border-b border-white/5 pb-2">Género</h4>
                                <div className="h-[200px] w-full relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie 
                                                data={metrics.genderStats.length > 0 ? metrics.genderStats : [{ name: 'Sin Datos', value: 1, color: '#333' }]} 
                                                cx="50%" cy="50%" 
                                                innerRadius={60} outerRadius={85} 
                                                paddingAngle={5} 
                                                dataKey="value" 
                                                stroke="none"
                                            >
                                                {(metrics.genderStats.length > 0 ? metrics.genderStats : [{ name: 'Sin Datos', value: 1, color: '#333' }]).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{backgroundColor: '#000000cc', border: '1px solid #ffffff20', borderRadius: '12px'}} itemStyle={{color: '#fff'}} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex gap-4 justify-center mt-6 flex-wrap">
                                    {metrics.genderStats.map((g, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ color: g.color, backgroundColor: g.color }} />
                                            <span className="text-[10px] text-white/60 font-bold">{g.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Edad */}
                            <div className="flex flex-col justify-start">
                                <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-6 w-full text-center border-b border-white/5 pb-2">Edad</h4>
                                <div className="h-[220px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={metrics.ageStats} layout="vertical" margin={{ left: 0, right: 30 }}>
                                            <XAxis type="number" hide />
                                            <YAxis 
                                                dataKey="range" 
                                                type="category" 
                                                width={40} 
                                                tick={{ fill: '#ffffff60', fontSize: 11, fontWeight: 'bold' }} 
                                                axisLine={false} 
                                                tickLine={false}
                                            />
                                            <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: '#000000cc', border: '1px solid #ffffff20', borderRadius: '12px'}} itemStyle={{color:'#fff'}} />
                                            <Bar dataKey="count" fill="#8b5cf6" radius={[0, 6, 6, 0]} barSize={28} label={{ position: 'right', fill: 'white', fontSize: 10 }} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4">
                        <InsightBox 
                            type="info"
                            text="Usa estos datos para segmentar tus anuncios. Si tu público es mayoritariamente 25-34, enfócate en contenido de calidad y lifestyle."
                        />
                    </div>
                </div>
            </div>
        </section>

    </div>
  )
}

// --- SUB-COMPONENTES ESTILIZADOS ---

function SectionHeader({ title, subtitle, description }: any) {
    return (
        <div className="mb-6">
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
                {title} <span className="h-1 w-1 bg-white/20 rounded-full"></span> 
                <span className="text-base text-white/40 font-medium tracking-normal">{subtitle}</span>
            </h2>
            <p className="text-xs text-white/40 mt-1 max-w-2xl leading-relaxed font-medium">{description}</p>
        </div>
    )
}

function InsightBox({ type, text }: { type: 'positive'|'negative'|'info'|'neutral', text: string }) {
    const styles = {
        positive: "bg-[#00D15B]/5 border-[#00D15B]/20 text-[#00D15B]",
        negative: "bg-[#FF007F]/5 border-[#FF007F]/20 text-[#FF007F]",
        info: "bg-[#3b82f6]/5 border-[#3b82f6]/20 text-[#3b82f6]",
        neutral: "bg-white/5 border-white/10 text-white/40"
    }
    const icons = {
        positive: <TrendingUp size={16}/>,
        negative: <AlertTriangle size={16}/>,
        info: <Lightbulb size={16}/>,
        neutral: <Info size={16}/>
    }

    return (
        <div className={`p-4 rounded-xl border flex gap-3 items-start backdrop-blur-sm ${styles[type]}`}>
            <div className="mt-0.5 shrink-0">{icons[type]}</div>
            <div>
                <p className="text-xs font-medium leading-relaxed">{text}</p>
            </div>
        </div>
    )
}

function KpiCard({ title, value, sub, icon, color, bg, progress, tooltip }: any) {
    return (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 relative overflow-hidden group hover:border-white/20 transition-all hover:scale-[1.02] shadow-xl shadow-purple-900/5">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />
            
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3.5 rounded-2xl ${bg} ${color}`}>{icon}</div>
                {progress !== undefined && (
                   <div className="text-right">
                       <span className={`text-sm font-black ${color}`}>{progress.toFixed(0)}%</span>
                       <div className="w-12 h-1.5 bg-black/40 rounded-full mt-1 overflow-hidden">
                           <div className={`h-full rounded-full ${color.replace('text-', 'bg-')}`} style={{width: `${Math.min(progress, 100)}%`}}/>
                       </div>
                   </div>
                )}
            </div>
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">{title}</p>
                    {tooltip && (
                        <div className="group/tip relative">
                            <HelpCircle size={12} className="text-white/20 cursor-help hover:text-white transition-colors"/>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-black/90 backdrop-blur-md border border-white/10 rounded-xl text-[10px] text-white/80 hidden group-hover/tip:block z-50 shadow-xl">
                                {tooltip}
                            </div>
                        </div>
                    )}
                </div>
                <h4 className="text-3xl font-black text-white tracking-tight">{value}</h4>
                <p className="text-white/40 text-[10px] mt-2 font-medium bg-white/5 w-fit px-2 py-1 rounded-lg border border-white/5">{sub}</p>
            </div>
        </div>
    )
}