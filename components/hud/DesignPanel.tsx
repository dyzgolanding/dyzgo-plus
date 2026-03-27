'use client'
import { useEventStore } from '@/store/useEventStore'
import { ImageIcon, MousePointerClick, Pipette, UploadCloud } from 'lucide-react'
import { useRef, useState, useEffect } from 'react'
import { HexColorPicker } from 'react-colorful'

// EyeDropper API (Chrome/Edge)
declare global {
  interface Window {
    EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> }
  }
}

interface EventDataDesign {
  accentColor?: string
  coverImage?: string
}

interface DesignStoreActions {
  eventData: EventDataDesign
  setAccentColor: (c: string) => void
  setCoverImage: (url: string) => void
}

export default function DesignPanel() {
  const store = useEventStore() as unknown as DesignStoreActions
  const { eventData, setAccentColor, setCoverImage } = store

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showAccentPicker, setShowAccentPicker] = useState(false)
  const [eyeDropperSupported] = useState(() => typeof window !== 'undefined' && !!window.EyeDropper)

  const handleEyeDropper = async () => {
    if (!window.EyeDropper) return
    try {
      const dropper = new window.EyeDropper()
      const result = await dropper.open()
      setAccentColor(result.sRGBHex)
    } catch {
      // usuario canceló
    }
  }

  const currentAccent = eventData.accentColor || '#FF31D8'

  useEffect(() => {
    if (eventData.accentColor === '#ffffff') {
      setAccentColor('#FF31D8')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const localUrl = URL.createObjectURL(file)
      setCoverImage(localUrl)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      useEventStore.setState((state: any) => ({ ...state, tempFile: file }))
    }
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-left duration-300 relative">

      {showAccentPicker && (
        <div className="fixed inset-0 z-40" onClick={() => setShowAccentPicker(false)} />
      )}

      <div>
        <h2 className="text-xl font-bold text-white mb-1">Diseño y Marca</h2>
        <p className="text-zinc-500 text-xs">Personaliza el color de acento del evento.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">

        {/* COLOR DE ACENTO */}
        <div className="space-y-3 relative z-50">
          <label className="text-xs font-medium text-zinc-400 flex items-center gap-2">
            <MousePointerClick size={14} /> Color de Acento
          </label>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Código Hex</span>
              <div className="flex items-center border-b border-transparent focus-within:border-purple-500 transition-colors">
                <span className="text-sm font-bold text-zinc-500 font-mono select-none">#</span>
                <input
                  type="text"
                  value={currentAccent.replace('#', '')}
                  onChange={(e) => setAccentColor(`#${e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6)}`)}
                  className="bg-transparent text-sm font-bold text-white uppercase tracking-widest font-mono outline-none w-20 placeholder-zinc-700"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {eyeDropperSupported && (
                <button
                  onClick={handleEyeDropper}
                  title="Seleccionar color de la pantalla"
                  className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center hover:bg-zinc-700 hover:border-zinc-600 transition-all"
                >
                  <Pipette size={16} className="text-zinc-300" />
                </button>
              )}
              <div className="relative">
              <div
                onClick={(e) => { e.stopPropagation(); setShowAccentPicker(!showAccentPicker); }}
                className="w-12 h-12 rounded-full border-2 border-zinc-700 shadow-lg cursor-pointer hover:scale-105 transition-transform"
                style={{ backgroundColor: currentAccent }}
              />
              {showAccentPicker && (
                <div
                  className="absolute right-0 top-14 bg-zinc-950 border border-zinc-800 p-3 rounded-xl shadow-2xl animate-in zoom-in-95 z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <HexColorPicker color={currentAccent} onChange={setAccentColor} />
                </div>
              )}
              </div>
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
                    {/* eslint-disable-next-line @next/next/no-img-element */}
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