'use client'

import { useState } from 'react'
import { useEventStore } from '@/store/useEventStore'
import { X, Plus, Music, Shirt, Ban, Users } from 'lucide-react'

const DRESS_CODES = ["Casual", "Semi-Formal", "Formal", "Gala", "Temático", "Playero", "Sport"]
const MUSIC_GENRES = ["Reggaeton", "Techno", "House", "Electronica", "Pop", "Rock", "Cumbia", "Varios", "Hip-Hop", "Trap"]

export default function ExperiencePanel() {
  const { eventData, setEventData } = useEventStore()
  const [itemInput, setItemInput] = useState('')

  // Función para agregar items prohibidos
  const handleAddItem = () => {
    if (!itemInput.trim()) return
    if (eventData.prohibitedItems.includes(itemInput.trim())) return
    
    setEventData({
        ...eventData,
        prohibitedItems: [...eventData.prohibitedItems, itemInput.trim()]
    })
    setItemInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        e.preventDefault()
        handleAddItem()
    }
  }

  const handleRemoveItem = (itemToRemove: string) => {
    setEventData({
        ...eventData,
        prohibitedItems: eventData.prohibitedItems.filter(i => i !== itemToRemove)
    })
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
       
       {/* 1. DEMOGRAFÍA */}
       <div className="space-y-4">
           <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                <Users size={14}/> Demografía
           </h3>
           <div className="grid grid-cols-2 gap-6 bg-white/5 border border-white/10 p-6 rounded-[2rem]">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider ml-1">Edad Hombres</label>
                    <input 
                        type="number" 
                        value={eventData.minAgeMen || ''}
                        onChange={(e) => setEventData({ ...eventData, minAgeMen: Number(e.target.value) })}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-bold focus:border-blue-500/50 focus:outline-none transition-all text-center" 
                        placeholder="21" 
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider ml-1">Edad Mujeres</label>
                    <input 
                        type="number" 
                        value={eventData.minAgeWomen || ''}
                        onChange={(e) => setEventData({ ...eventData, minAgeWomen: Number(e.target.value) })}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-bold focus:border-[#FF007F]/50 focus:outline-none transition-all text-center" 
                        placeholder="18" 
                    />
                </div>
           </div>
       </div>

       {/* 2. AMBIENTE (MÚSICA Y DRESS CODE) */}
       <div className="space-y-4">
            <h3 className="text-xs font-black text-purple-400 uppercase tracking-widest flex items-center gap-2">
                <SparklesIcon /> Ambiente
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider ml-1 flex items-center gap-1"><Music size={12}/> Género Musical</label>
                    <select 
                        value={eventData.musicGenre || ''}
                        onChange={(e) => setEventData({...eventData, musicGenre: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:border-purple-500/50 focus:bg-black/40 outline-none appearance-none cursor-pointer hover:bg-white/10 transition-all font-medium"
                    >
                        <option value="" className="bg-zinc-900">Seleccionar...</option>
                        {MUSIC_GENRES.map(g => <option key={g} value={g} className="bg-zinc-900">{g}</option>)}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider ml-1 flex items-center gap-1"><Shirt size={12}/> Dress Code</label>
                    <select 
                        value={eventData.dressCode || ''}
                        onChange={(e) => setEventData({...eventData, dressCode: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:border-purple-500/50 focus:bg-black/40 outline-none appearance-none cursor-pointer hover:bg-white/10 transition-all font-medium"
                    >
                        <option value="" className="bg-zinc-900">Seleccionar...</option>
                        {DRESS_CODES.map(d => <option key={d} value={d} className="bg-zinc-900">{d}</option>)}
                    </select>
                </div>
            </div>
       </div>

       {/* 3. RESTRICCIONES (TAGS) */}
       <div className="space-y-4">
            <h3 className="text-xs font-black text-red-400 uppercase tracking-widest flex items-center gap-2">
                <Ban size={14}/> Objetos Prohibidos
            </h3>
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 space-y-4">
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={itemInput}
                        onChange={(e) => setItemInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ej: Camisetas de fútbol..." 
                        className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white focus:border-red-500/50 focus:outline-none transition-all placeholder:text-white/20"
                    />
                    <button 
                        onClick={handleAddItem}
                        className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-2xl border border-white/5 transition-all"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                <div className="flex flex-wrap gap-2">
                    {eventData.prohibitedItems.length === 0 && (
                        <p className="text-xs text-white/20 italic p-2">No hay restricciones agregadas.</p>
                    )}
                    {eventData.prohibitedItems.map((item, idx) => (
                        <span key={idx} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-xs font-bold animate-in zoom-in-95">
                            {item}
                            <button onClick={() => handleRemoveItem(item)} className="hover:text-white"><X size={12}/></button>
                        </span>
                    ))}
                </div>
            </div>
       </div>
    </div>
  )
}

function SparklesIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M9 5h4"/><path d="M18.8 1.6 15.6 15.6"/></svg>
    )
}