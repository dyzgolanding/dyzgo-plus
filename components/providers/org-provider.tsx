'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// --- INTERFACES PARA TIPADO ESTRICTO ---
interface Organization {
  id: string
  name: string
  logo_url: string | null
  role: 'owner' | 'admin' | 'finance' | 'staff'
  is_owner: boolean
}

interface PendingInvite {
  invite_id: string
  name: string
  role: string
  logo_url?: string | null
}

interface OrgContextType {
  currentOrgId: string | null
  currentRole: 'owner' | 'admin' | 'finance' | 'staff'
  availableOrgs: Organization[]
  pendingInvites: PendingInvite[]
  switchOrg: (orgId: string) => void
  createNewOrg: () => void
  deleteOrg: (orgId: string) => Promise<void>
  acceptInvite: (inviteId: string) => Promise<void>
  rejectInvite: (inviteId: string) => Promise<void>
  refreshOrgs: () => Promise<void>
  isLoading: boolean
}

const OrgContext = createContext<OrgContextType>({
  currentOrgId: null,
  currentRole: 'owner',
  availableOrgs: [],
  pendingInvites: [],
  switchOrg: () => {},
  createNewOrg: () => {},
  deleteOrg: async () => {},
  acceptInvite: async () => {},
  rejectInvite: async () => {},
  refreshOrgs: async () => {},
  isLoading: true
})

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null)
  const [currentRole, setCurrentRole] = useState<'owner' | 'admin' | 'finance' | 'staff'>('owner')
  const [availableOrgs, setAvailableOrgs] = useState<Organization[]>([])
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchOrganizations()
  }, [])

  async function fetchOrganizations() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 1. Mis Productoras
      const { data: myOrgs } = await supabase
        .from('experiences')
        .select('id, name, logo_url')
        .eq('producer_id', user.id)

      // 2. Productoras Invitadas
      const { data: teamData } = await supabase
        .from('team_members')
        .select(`
            id, status, role, email,
            experience:experiences (id, name, logo_url)
        `)
        .or(`user_id.eq.${user.id},email.eq.${user.email}`)

      const activeOrgs: Organization[] = []
      const pending: PendingInvite[] = []

      if (myOrgs) {
        myOrgs.forEach(org => activeOrgs.push({ 
            id: org.id,
            name: org.name,
            logo_url: org.logo_url,
            role: 'owner', 
            is_owner: true 
        }))
      }

      if (teamData) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        teamData.forEach((item: any) => {
            if (item.experience) {
                if (!activeOrgs.find(o => o.id === item.experience.id)) {
                    if (item.status === 'active') {
                        activeOrgs.push({ 
                            id: item.experience.id,
                            name: item.experience.name,
                            logo_url: item.experience.logo_url,
                            role: item.role, 
                            is_owner: false 
                        })
                    } else if (item.status === 'pending') {
                        pending.push({ 
                            invite_id: item.id, 
                            role: item.role, 
                            name: item.experience.name,
                            logo_url: item.experience.logo_url 
                        })
                    }
                }
            }
        })
      }

      setAvailableOrgs(activeOrgs)
      setPendingInvites(pending)

      // Selección automática si no hay nada seleccionado
      if (activeOrgs.length > 0 && currentOrgId === null) {
        const saved = localStorage.getItem('dyzgo_active_org')
        const found = activeOrgs.find(o => o.id === saved)
        if (found) {
            setCurrentOrgId(found.id)
            setCurrentRole(found.role)
        } else {
            setCurrentOrgId(activeOrgs[0].id)
            setCurrentRole(activeOrgs[0].role)
        }
      }

    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const switchOrg = (orgId: string) => {
    const org = availableOrgs.find(o => o.id === orgId)
    if (org) {
        setCurrentOrgId(org.id)
        setCurrentRole(org.role)
        localStorage.setItem('dyzgo_active_org', org.id)
        setTimeout(() => router.refresh(), 100)
    }
  }

  const createNewOrg = () => {
      setCurrentOrgId('') 
      setCurrentRole('owner')
      router.push('/settings')
  }

  const deleteOrg = async (orgId: string) => {
      try {
          const { error } = await supabase.from('experiences').delete().eq('id', orgId)
          if (error) throw error
          if (localStorage.getItem('dyzgo_active_org') === orgId) {
              localStorage.removeItem('dyzgo_active_org')
          }
          setCurrentOrgId(null)
          await fetchOrganizations()
          router.push('/')
      } catch (error) {
          throw error
      }
  }

  const acceptInvite = async (inviteId: string) => {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        const { error } = await supabase
            .from('team_members')
            .update({ status: 'active', user_id: user?.id })
            .eq('id', inviteId)
        
        if (error) throw error
        
        // RECARGA CRÍTICA
        await fetchOrganizations() 
        alert("¡Invitación aceptada! Ya puedes seleccionar la productora en el menú.")
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Error desconocido'
        alert("Error al aceptar: " + msg)
    }
  }

  const rejectInvite = async (inviteId: string) => {
    if(!confirm("¿Estás seguro de rechazar esta invitación?")) return
    try {
        const { error } = await supabase
            .from('team_members')
            .delete()
            .eq('id', inviteId)
        
        if (error) throw error
        
        await fetchOrganizations()
        alert("Invitación rechazada.")
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Error desconocido'
        alert("Error al rechazar: " + msg)
    }
  }

  return (
    <OrgContext.Provider value={{ currentOrgId, currentRole, availableOrgs, pendingInvites, switchOrg, createNewOrg, deleteOrg, acceptInvite, rejectInvite, refreshOrgs: fetchOrganizations, isLoading }}>
      {children}
    </OrgContext.Provider>
  )
}

export const useOrg = () => useContext(OrgContext)