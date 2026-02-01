'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useEventStore } from '@/store/useEventStore'
import { AlignLeft, Users2, Ban, Plus, X, Bold, Italic, Underline, Shirt, Smartphone } from 'lucide-react'

// --- INTERFACES PARA TIPADO ESTRICTO ---
interface EventDataExperience {
  description?: string
  prohibitedItems?: string[]
  minAgeMen?: number
  minAgeWomen?: number
  dressCode?: string
  socialLinks?: { instagram?: string; [key: string]: string | undefined }
  settings?: { showInstagram?: boolean; [key: string]: unknown }
  [key: string]: unknown
}

interface ExperienceStoreState {
  eventData: EventDataExperience
  // Definimos setExperience para que acepte parciales de los datos
  setExperience: (data: Partial<EventDataExperience>) => void
}

export default function ExperiencePanel() {
  // Casting seguro del store a la interfaz local
  const { eventData, setExperience } = useEventStore() as unknown as ExperienceStoreState
  
  const [itemInput, setItemInput] = useState('')
  const editorRef = useRef<HTMLDivElement>(null)

  // 1. ESTADO SEGURO
  const isInstagramActive = eventData.settings?.showInstagram ?? false

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== eventData.description) {
      if (!eventData.description) {
        editorRef.current.innerHTML = ''
      } else if (editorRef.current.innerText.trim() === '') { 
        editorRef.current.innerHTML = eventData.description
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const applyFormat = (command: string) => {
    document.execCommand(command, false)
    if (editorRef.current) {
        editorRef.current.focus()
        setExperience({ description: editorRef.current.innerHTML })
    }
  }

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    setExperience({ description: e.currentTarget.innerHTML })
  }

  const handleAddItem = () => {
    if (!itemInput.trim()) return
    setExperience({ prohibitedItems: [...(eventData.prohibitedItems || []), itemInput.trim()] })
    setItemInput('')
  }

  const handleRemoveItem = (itemToRemove: string) => {
    setExperience({ prohibitedItems: (eventData.prohibitedItems || []).filter(i => i !== itemToRemove) })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAddItem()
  }
  
  const updateSocial = (key: string, value: string) => {
    const currentSocial = eventData.socialLinks || {}
    setExperience({ socialLinks: { ...currentSocial, [key]: value } })
  }

  // 2. FUNCIÓN DE TOGGLE ROBUSTA
  const toggleInstagram = () => {
      const currentSettings = eventData.settings || {}
      setExperience({
          settings: {
              ...currentSettings,
              showInstagram: !isInstagramActive
          }
      })
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-left duration-300 pb-10">
      
      {/* 1. ELEMENTOS PROHIBIDOS */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-red-400 uppercase flex items-center gap-2">
            <Ban size={14} /> Elementos Prohibidos
        </label>
        <div className="flex gap-2">
            <input 
                type="text" 
                value={itemInput}
                onChange={(e) => setItemInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe y presiona Enter (Ej: Gorras)"
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-red-500/50 outline-none transition-all"
            />
            <button onClick={handleAddItem} className="bg-zinc-800 hover:bg-zinc-700 text-white p-3 rounded-xl transition-colors">
                <Plus size={20} />
            </button>
        </div>
        <div className="flex flex-wrap gap-2 min-h-[40px]">
            {(eventData.prohibitedItems || []).map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-red-950/30 border border-red-500/30 rounded-full text-red-400 text-xs font-bold animate-in zoom-in-95">
                    <span>{item}</span>
                    <button onClick={() => handleRemoveItem(item)} className="hover:text-white"><X size={12}/></button>
                </div>
            ))}
        </div>
      </div>

      {/* 2. DESCRIPCIÓN */}
      <div className="space-y-2">
        <div className="flex justify-between items-end">
             <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
                <AlignLeft size={14} /> Descripción
             </label>
             <div className="flex gap-1 bg-zinc-900 rounded-lg p-1 border border-zinc-800 select-none">
                <button onMouseDown={(e) => { e.preventDefault(); applyFormat('bold'); }} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition-colors" title="Negrita"><Bold size={14}/></button>
                <button onMouseDown={(e) => { e.preventDefault(); applyFormat('italic'); }} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition-colors" title="Cursiva"><Italic size={14}/></button>
                <button onMouseDown={(e) => { e.preventDefault(); applyFormat('underline'); }} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition-colors" title="Subrayado"><Underline size={14}/></button>
             </div>
        </div>
        <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning={true} // Importante para evitar warnings de hidratación
            onInput={handleInput}
            className="w-full h-40 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-300 focus:ring-2 focus:ring-purple-600 outline-none overflow-y-auto leading-relaxed cursor-text transition-all empty:before:content-[attr(placeholder)] empty:before:text-zinc-600 [&>b]:text-white [&>b]:font-bold [&>i]:text-purple-300 [&>i]:italic [&>u]:text-white [&>u]:underline [&>u]:decoration-purple-500"
            role="textbox"
            aria-placeholder="Cuenta de qué trata la fiesta..."
        />
      </div>

      {/* 3. EDADES Y DRESS CODE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2"><Users2 size={14} /> Edad Mínima</label>
            <div className="grid grid-cols-2 gap-2">
                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex flex-col items-center justify-center hover:border-zinc-700 transition-colors">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold mb-1 tracking-wider">Hombres</span>
                    <div className="flex items-center justify-center">
                        <span className="text-2xl font-black text-zinc-600 mr-0.5 select-none">+</span>
                        <input 
                            type="text" 
                            inputMode="numeric"
                            maxLength={2}
                            value={eventData.minAgeMen || ''} 
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, 2)
                                setExperience({ minAgeMen: Number(val) })
                            }} 
                            className="w-10 bg-transparent text-2xl font-black text-white text-center outline-none placeholder-zinc-700"
                            placeholder="21"
                        />
                    </div>
                </div>
                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex flex-col items-center justify-center hover:border-zinc-700 transition-colors">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold mb-1 tracking-wider">Mujeres</span>
                    <div className="flex items-center justify-center">
                        <span className="text-2xl font-black text-zinc-600 mr-0.5 select-none">+</span>
                        <input 
                            type="text" 
                            inputMode="numeric"
                            maxLength={2}
                            value={eventData.minAgeWomen || ''} 
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, 2)
                                setExperience({ minAgeWomen: Number(val) })
                            }} 
                            className="w-10 bg-transparent text-2xl font-black text-white text-center outline-none placeholder-zinc-700"
                            placeholder="18"
                        />
                    </div>
                </div>
            </div>
          </div>

          <div className="space-y-3">
             <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2"><Shirt size={14} /> Dress Code</label>
             <input type="text" value={eventData.dressCode || ''} onChange={(e) => setExperience({ dressCode: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3.5 text-center font-bold text-white focus:ring-2 focus:ring-purple-600 outline-none transition-all placeholder:text-zinc-700" placeholder="Ej: Casual" />
          </div>
      </div>

      {/* 4. REDES SOCIALES (SWITCH FUNCIONAL) */}
      <div className="space-y-4 pt-6 border-t border-zinc-800">
        <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
                <Smartphone size={14} /> Social
            </label>
            
            {/* SWITCH INSTAGRAM */}
            <div 
                className="flex items-center gap-2 cursor-pointer select-none group" 
                onClick={toggleInstagram}
            >
                <span className={`text-[10px] font-bold transition-colors ${isInstagramActive ? 'text-white' : 'text-zinc-600 group-hover:text-zinc-500'}`}>
                    {isInstagramActive ? 'INSTAGRAM ACTIVO' : 'INSTAGRAM OCULTO'}
                </span>
                <div className={`w-9 h-5 rounded-full transition-all relative ${isInstagramActive ? 'bg-pink-600' : 'bg-zinc-800 group-hover:bg-zinc-700'}`}>
                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all shadow-sm ${isInstagramActive ? 'left-5' : 'left-1'}`} />
                </div>
            </div>
        </div>

        <div className="space-y-3">
            {/* INPUT DESHABILITADO SI EL SWITCH ESTÁ APAGADO */}
            <div className={`transition-all duration-300 ${isInstagramActive ? 'opacity-100' : 'opacity-40 grayscale'}`}>
                 <input 
                    type="text" 
                    placeholder="Usuario de instagram (ej. dyzgoapp)" 
                    value={eventData.socialLinks?.instagram || ''} 
                    onChange={(e) => updateSocial('instagram', e.target.value)} 
                    disabled={!isInstagramActive} 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-pink-500 transition-colors placeholder:text-zinc-600 disabled:cursor-not-allowed disabled:border-zinc-900" 
                />
            </div>
        </div>
      </div>
    </div>
  )
}