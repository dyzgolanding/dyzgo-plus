'use client'
import { LayoutDashboard, Ticket, BarChart3, Settings, User, LogOut, Plus, Bell, Check, ChevronDown, X, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEffect, useState, useRef } from 'react'
import { OrgProvider, useOrg } from '@/components/providers/org-provider'

// ESTILOS GLOBALES DE SCROLLBAR
const customScrollbar = `
  .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); border-radius: 10px; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
`

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <OrgProvider>
      <DashboardContent>{children}</DashboardContent>
    </OrgProvider>
  )
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [userData, setUserData] = useState<{ name: string; email: string } | null>(null)
  
  const { currentOrgId, availableOrgs, pendingInvites, switchOrg, createNewOrg, acceptInvite, rejectInvite, isLoading } = useOrg()
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserData({
          name: user.user_metadata?.full_name || 'Productor DyzGO',
          email: user.email || ''
        })
      }
    }
    getUser()

    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOrgDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const currentOrgName = availableOrgs.find((o: any) => o.id === currentOrgId)?.name || 'Sin Productora'
  const currentOrgRole = availableOrgs.find((o: any) => o.id === currentOrgId)?.is_owner ? '(Dueño)' : `(${availableOrgs.find((o: any) => o.id === currentOrgId)?.role})`

  if (pathname.includes('/events/create')) {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen bg-[#030005] text-white font-sans selection:bg-purple-500/30 overflow-hidden">
      <style>{customScrollbar}</style>

      {/* --- FONDO GLOBAL (Cubre todo el layout, detrás del sidebar y contenido) --- */}
      <div className="absolute inset-0 z-0 pointer-events-none w-full h-full overflow-hidden">
          <div className="absolute inset-0 bg-[#030005]" />
          <div className="absolute top-[-20%] left-[-10%] w-[90vw] h-[90vw] bg-[radial-gradient(circle_at_center,rgba(88,28,135,0.4),transparent_70%)] blur-[100px] opacity-80 mix-blend-screen" />
          <div className="absolute top-[10%] right-[-10%] w-[70vw] h-[70vw] bg-[radial-gradient(circle_at_center,rgba(190,24,93,0.25),transparent_60%)] blur-[120px] opacity-80 mix-blend-screen" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] mix-blend-overlay" />
      </div>
      
      {/* SIDEBAR (Con fondo semi-transparente para ver el fondo global) */}
      <aside className="w-64 border-r border-white/5 flex flex-col bg-[#09090b]/80 backdrop-blur-xl relative z-20">
        
        <div className="h-16 flex items-center px-6 border-b border-white/5 justify-between">
            <div>
                <span className="text-xl font-black tracking-tighter bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
                    DYZGO+
                </span>
                <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded bg-white/10 text-zinc-400 font-medium">
                    PRO
                </span>
            </div>
        </div>

        {pendingInvites?.length > 0 && (
            <div className="mx-4 mt-4 p-3 bg-purple-900/10 border border-purple-500/30 rounded-xl animate-in slide-in-from-left duration-300">
                <div className="flex items-center gap-2 mb-2 text-purple-400">
                    <Bell size={14} className="animate-bounce" />
                    <span className="text-[10px] font-bold uppercase tracking-wide">Invitación Pendiente</span>
                </div>
                {pendingInvites.map((inv) => (
                    <div key={inv.invite_id} className="flex justify-between items-center bg-black/40 p-2.5 rounded-lg mb-1 border border-white/5">
                        <div className="overflow-hidden">
                            <p className="text-xs font-bold text-white truncate max-w-[80px]">{inv.name}</p>
                            <p className="text-[10px] text-zinc-400 uppercase">{inv.role === 'finance' ? 'Finanzas' : inv.role}</p>
                        </div>
                        <div className="flex gap-1">
                            <button onClick={() => acceptInvite(inv.invite_id)} className="bg-green-600 hover:bg-green-500 text-white p-1.5 rounded-lg transition-colors shadow-lg shadow-green-900/20" title="Aceptar"><Check size={12} strokeWidth={3} /></button>
                            <button onClick={() => rejectInvite(inv.invite_id)} className="bg-red-600 hover:bg-red-500 text-white p-1.5 rounded-lg transition-colors shadow-lg shadow-red-900/20" title="Rechazar"><X size={12} strokeWidth={3} /></button>
                        </div>
                    </div>
                ))}
            </div>
        )}

        <div className="px-4 mt-6">
            <p className="px-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Viendo Datos De:</p>
            <div className="relative" ref={dropdownRef}>
                <button onClick={() => !isLoading && availableOrgs.length > 0 && setIsOrgDropdownOpen(!isOrgDropdownOpen)} disabled={isLoading || availableOrgs.length === 0} className={`w-full bg-zinc-900 border ${isOrgDropdownOpen ? 'border-purple-500' : 'border-white/10'} text-white text-xs font-bold rounded-lg p-3 outline-none flex justify-between items-center hover:bg-zinc-800 transition-all disabled:opacity-50 text-left`}>
                    <span className="truncate pr-2">{isLoading ? 'Cargando...' : (availableOrgs.length === 0 ? 'Sin Productora' : `${currentOrgName} ${currentOrgRole}`)}</span>
                    <ChevronDown size={14} className={`text-zinc-500 transition-transform duration-200 ${isOrgDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOrgDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-full bg-[#09090b] border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-64 overflow-y-auto custom-scrollbar">
                        <div className="p-1">
                            {availableOrgs.map((org: any) => (
                                <button key={org.id} onClick={() => { switchOrg(org.id); setIsOrgDropdownOpen(false); }} className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between mb-0.5 ${currentOrgId === org.id ? 'bg-purple-500/10 text-purple-400' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}>
                                    <span className="truncate">{org.name || 'Sin Nombre'}</span>
                                    <span className="text-[9px] opacity-70 ml-2 whitespace-nowrap">{org.is_owner ? 'Dueño' : org.role}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            
            {!isLoading && (
               <button onClick={createNewOrg} className="mt-3 text-[10px] text-purple-400 flex items-center gap-1 hover:underline px-2 w-full text-left font-bold"><Plus size={10} /> Crear Nueva Productora</button>
            )}
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
            <p className="px-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 mt-4">Principal</p>
            <SidebarLink href="/" icon={<LayoutDashboard size={18} />} label="Resumen" active={pathname === '/'} />
            <SidebarLink href="/events" icon={<Ticket size={18} />} label="Mis Eventos" active={pathname.includes('/events')} />
            <SidebarLink href="/finance" icon={<BarChart3 size={18} />} label="Analiticas" active={pathname.includes('/finance')} />
            
            <p className="px-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 mt-8">Configuración</p>
            <SidebarLink href="/settings" icon={<Settings size={18} />} label="Cuenta" active={pathname.startsWith('/settings')} />
            <SidebarLink href="/team" icon={<ShieldAlert size={18} />} label="Blacklist" active={pathname.includes('/team')} />
        </nav>

        <div className="p-4 border-t border-white/5">
            <div onClick={handleLogout} className="flex items-center gap-3 p-2 rounded-xl hover:bg-red-500/10 transition-colors cursor-pointer group">
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{userData?.name || 'Cargando...'}</p>
                    <p className="text-xs text-zinc-500 truncate">{userData?.email || '...'}</p>
                </div>
                <LogOut size={16} className="text-zinc-500 group-hover:text-red-400 transition-colors" />
            </div>
        </div>
      </aside>

      {/* MAIN (Transparente para que se vea el fondo global) */}
      <main className="flex-1 relative z-10 overflow-y-auto custom-scrollbar">
        <div className="p-8">
            {children}
        </div>
      </main>

    </div>
  )
}

function SidebarLink({ href, icon, label, active }: any) {
    return (
        <Link href={href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${active ? 'bg-white text-black font-medium shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}>
            {icon}
            <span className="text-sm">{label}</span>
        </Link>
    )
}