'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { use } from 'react'
import { LayoutDashboard, UtensilsCrossed, GlassWater, BarChart3, Gift } from 'lucide-react'

export default function ConsumosLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id: eventId } = use(params)
  const pathname = usePathname()

  const tabs = [
    { href: `/events/${eventId}/consumos`,              label: 'Overview',   icon: <LayoutDashboard size={14} />, exact: true  },
    { href: `/events/${eventId}/consumos/menu`,         label: 'Carta',      icon: <UtensilsCrossed size={14} />, exact: false },
    { href: `/events/${eventId}/consumos/bars`,         label: 'Barras',     icon: <GlassWater size={14} />,      exact: false },
    { href: `/events/${eventId}/consumos/analytics`,    label: 'Analytics',  icon: <BarChart3 size={14} />,       exact: false },
    { href: `/events/${eventId}/consumos/cortesias`,    label: 'Cortesías',  icon: <Gift size={14} />,            exact: false },
  ]

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="flex gap-1 bg-black/40 p-1 rounded-xl w-fit border border-white/5">
        {tabs.map(tab => {
          const isActive = tab.exact
            ? pathname === tab.href
            : pathname?.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${isActive ? 'bg-white/10 text-white border border-white/10' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              {tab.icon} {tab.label}
            </Link>
          )
        })}
      </div>

      {children}
    </div>
  )
}
