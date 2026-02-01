'use client'
import { useEventStore } from '@/store/useEventStore'
import { ImageIcon, Palette, UploadCloud, MousePointerClick, Layers } from 'lucide-react'
import { useRef, useState, useEffect } from 'react'
import { HexColorPicker } from 'react-colorful'

export default function DesignPanel() {
  // @ts-ignore
  const { eventData, setThemeColor, setThemeColorEnd, setCardBackgroundColor, setBorderColor, setAccentColor, setCoverImage } = useEventStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Estados para los pickers
  const [showStartPicker, setShowStartPicker] = useState(false)
  const [showEndPicker, setShowEndPicker] = useState(false)
  const [showCardBgPicker, setShowCardBgPicker] = useState(false)
  const [showBorderPicker, setShowBorderPicker] = useState(false)
  const [showAccentPicker, setShowAccentPicker] = useState(false)

  // Valores
  const themeColorEnd = (eventData as any).themeColorEnd || '#090014';
  const cardBgColor = (eventData as any).cardBackgroundColor || '#1a0b2e';
  const borderColor = (eventData as any).borderColor || '#8A2BE2';
  const currentAccent = (eventData as any).accentColor || '#FF00FF'

  useEffect(() => {
    if ((eventData as any).accentColor === '#ffffff') {
        setAccentColor('#FF00FF')
    }
  }, [])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const localUrl = URL.createObjectURL(file)
      setCoverImage(localUrl) 
      // @ts-ignore
      useEventStore.setState((state) => ({ ...state, tempFile: file }))
    }
  }

  const closeAllPickers = () => {
      setShowStartPicker(false);
      setShowEndPicker(false);
      setShowCardBgPicker(false);
      setShowBorderPicker(false);
      setShowAccentPicker(false);
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-left duration-300 relative">
       
       {/* BACKDROP */}
       {(showStartPicker || showEndPicker || showCardBgPicker || showBorderPicker || showAccentPicker) && (
          <div className="fixed inset-0 z-40" onClick={closeAllPickers} />
       )}

       <div>
        <h2 className="text-xl font-bold text-white mb-1">Diseño y Marca</h2>
        <p className="text-zinc-500 text-xs">Personaliza la gradiente, tarjetas y bordes.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
          
          {/* 1. GRADIENTE DEL EVENTO (2 COLORES) */}
          <div className="space-y-3 relative z-50">
            <label className="text-xs font-medium text-zinc-400 flex items-center gap-2">
                <Palette size={14} /> Gradiente de Fondo
            </label>
            <div className="grid grid-cols-2 gap-3">
                {/* Inicio */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex items-center justify-between relative">
                    <div className="flex flex-col">
                        <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Inicio</span>
                        <div className="flex items-center">
                            <span className="text-xs font-bold text-zinc-500 font-mono mr-1">#</span>
                            <input type="text" value={eventData.themeColor.replace('#', '')} onChange={(e) => setThemeColor(`#${e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6)}`)} className="bg-transparent text-xs font-bold text-white font-mono outline-none w-16" />
                        </div>
                    </div>
                    <div onClick={() => { closeAllPickers(); setShowStartPicker(true); }} className="w-8 h-8 rounded-full border border-zinc-700 cursor-pointer shadow-sm" style={{ backgroundColor: eventData.themeColor }} />
                    {showStartPicker && (<div className="absolute left-0 top-14 bg-zinc-950 border border-zinc-800 p-3 rounded-xl shadow-2xl z-50"><HexColorPicker color={eventData.themeColor} onChange={setThemeColor} /></div>)}
                </div>
                {/* Fin */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex items-center justify-between relative">
                    <div className="flex flex-col">
                        <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Fin</span>
                        <div className="flex items-center">
                            <span className="text-xs font-bold text-zinc-500 font-mono mr-1">#</span>
                            <input type="text" value={themeColorEnd.replace('#', '')} onChange={(e) => setThemeColorEnd(`#${e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6)}`)} className="bg-transparent text-xs font-bold text-white font-mono outline-none w-16" />
                        </div>
                    </div>
                    <div onClick={() => { closeAllPickers(); setShowEndPicker(true); }} className="w-8 h-8 rounded-full border border-zinc-700 cursor-pointer shadow-sm" style={{ backgroundColor: themeColorEnd }} />
                    {showEndPicker && (<div className="absolute right-0 top-14 bg-zinc-950 border border-zinc-800 p-3 rounded-xl shadow-2xl z-50"><HexColorPicker color={themeColorEnd} onChange={setThemeColorEnd} /></div>)}
                </div>
            </div>
          </div>

          {/* 2. TARJETAS Y BORDES (NUEVOS SELECTORES) */}
          <div className="space-y-3 relative z-40">
            <label className="text-xs font-medium text-zinc-400 flex items-center gap-2">
                <Layers size={14} /> Estilo de Tarjetas
            </label>
            <div className="grid grid-cols-2 gap-3">
                {/* Fondo Tarjetas */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex items-center justify-between relative">
                    <div className="flex flex-col">
                        <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Fondo</span>
                        <div className="flex items-center">
                            <span className="text-xs font-bold text-zinc-500 font-mono mr-1">#</span>
                            <input type="text" value={cardBgColor.replace('#', '')} onChange={(e) => setCardBackgroundColor(`#${e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6)}`)} className="bg-transparent text-xs font-bold text-white font-mono outline-none w-16" />
                        </div>
                    </div>
                    <div onClick={() => { closeAllPickers(); setShowCardBgPicker(true); }} className="w-8 h-8 rounded-full border border-zinc-700 cursor-pointer shadow-sm" style={{ backgroundColor: cardBgColor }} />
                    {showCardBgPicker && (<div className="absolute left-0 top-14 bg-zinc-950 border border-zinc-800 p-3 rounded-xl shadow-2xl z-50"><HexColorPicker color={cardBgColor} onChange={setCardBackgroundColor} /></div>)}
                </div>
                {/* Bordes */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex items-center justify-between relative">
                    <div className="flex flex-col">
                        <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Borde</span>
                        <div className="flex items-center">
                            <span className="text-xs font-bold text-zinc-500 font-mono mr-1">#</span>
                            <input type="text" value={borderColor.replace('#', '')} onChange={(e) => setBorderColor(`#${e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6)}`)} className="bg-transparent text-xs font-bold text-white font-mono outline-none w-16" />
                        </div>
                    </div>
                    <div onClick={() => { closeAllPickers(); setShowBorderPicker(true); }} className="w-8 h-8 rounded-full border border-zinc-700 cursor-pointer shadow-sm" style={{ backgroundColor: borderColor }} />
                    {showBorderPicker && (<div className="absolute right-0 top-14 bg-zinc-950 border border-zinc-800 p-3 rounded-xl shadow-2xl z-50"><HexColorPicker color={borderColor} onChange={setBorderColor} /></div>)}
                </div>
            </div>
          </div>

          {/* 3. COLOR DE ACENTO */}
          <div className="space-y-3 relative z-30">
            <label className="text-xs font-medium text-zinc-400 flex items-center gap-2">
                <MousePointerClick size={14} /> Color de Acento (Botones)
            </label>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Código Hex</span>
                    <div className="flex items-center border-b border-transparent focus-within:border-purple-500 transition-colors">
                        <span className="text-sm font-bold text-zinc-500 font-mono select-none">#</span>
                        <input type="text" value={currentAccent.replace('#', '')} onChange={(e) => setAccentColor(`#${e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6)}`)} className="bg-transparent text-sm font-bold text-white uppercase tracking-widest font-mono outline-none w-20 placeholder-zinc-700" />
                    </div>
                </div>
                <div className="relative">
                    <div onClick={() => { closeAllPickers(); setShowAccentPicker(true); }} className="w-12 h-12 rounded-full border-2 border-zinc-700 shadow-lg cursor-pointer hover:scale-105 transition-transform" style={{ backgroundColor: currentAccent }} />
                    {showAccentPicker && (<div className="absolute right-0 top-14 bg-zinc-950 border border-zinc-800 p-3 rounded-xl shadow-2xl animate-in zoom-in-95 z-50"><HexColorPicker color={currentAccent} onChange={setAccentColor} /></div>)}
                </div>
            </div>
          </div>

      </div>

      {/* FLYER */}
      <div className="space-y-3 relative z-0">
         <label className="text-xs font-medium text-zinc-400 flex items-center gap-2">
            <ImageIcon size={14} /> Flyer / Portada
        </label>
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />
        <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-zinc-800 rounded-xl p-8 flex flex-col items-center justify-center gap-3 hover:bg-zinc-900/50 hover:border-zinc-700 transition-all cursor-pointer relative overflow-hidden group">
            {eventData.coverImage ? (
                <>
                    <img src={eventData.coverImage} className="absolute inset-0 w-full h-full object-cover opacity-40" alt="Preview" />
                    <UploadCloud size={24} className="text-white z-10" />
                    <p className="z-10 text-xs text-white font-bold">Cambiar Flyer</p>
                </>
            ) : (
                <>
                    <div className="h-12 w-12 rounded-full bg-zinc-900 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors"><ImageIcon size={20} className="text-zinc-500 group-hover:text-purple-400" /></div>
                    <div className="text-center"><p className="text-sm font-medium text-white">Subir imagen</p><p className="text-xs text-zinc-500">Recomendado: 1080x1350px</p></div>
                </>
            )}
        </div>
      </div>
    </div>
  )
}