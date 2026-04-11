'use client'

import React, { use, useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Plus, X, Pencil, Trash2, ChevronDown, ToggleLeft, ToggleRight,
  UtensilsCrossed, Tag, PackageCheck, Loader2, ImagePlus, AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'

interface Category {
  id: string
  name: string
  description: string | null
  sort_order: number
  is_active: boolean
}

interface MenuItem {
  id: string
  category_id: string | null
  name: string
  description: string | null
  price: number
  image_url: string | null
  is_available: boolean
  stock_enabled: boolean
  stock_remaining: number | null
  prep_time_seconds: number
  alcohol_content: string
  sort_order: number
}

const ALCOHOL_LABELS: Record<string, string> = {
  none: 'Sin alcohol',
  low: 'Baja graduación',
  medium: 'Media graduación',
  high: 'Alta graduación',
}

const ALCOHOL_COLORS: Record<string, string> = {
  none: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  low: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  high: 'text-red-400 bg-red-500/10 border-red-500/20',
}

export default function ConsumoMenuPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = use(params)

  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)

  // ── Modals ─────────────────────────────────────────────────────────────────
  const [showCatForm, setShowCatForm] = useState(false)
  const [editingCat, setEditingCat] = useState<Category | null>(null)
  const [catForm, setCatForm] = useState({ name: '', description: '' })

  const [showItemForm, setShowItemForm] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [itemForm, setItemForm] = useState({
    category_id: '',
    name: '',
    description: '',
    price: '',
    image_url: '',
    is_available: true,
    stock_enabled: false,
    stock_remaining: '',
    prep_time_seconds: '120',
    alcohol_content: 'medium',
  })

  const [saving, setSaving] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // ── Data ───────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      const [{ data: cats }, { data: its }] = await Promise.all([
        supabase.from('consumption_categories').select('*').eq('event_id', eventId).order('sort_order'),
        supabase.from('consumption_items').select('*').eq('event_id', eventId).order('sort_order'),
      ])
      setCategories(cats || [])
      setItems(its || [])
    } catch (e) {
      console.error('[menu fetch]', e)
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Category actions ───────────────────────────────────────────────────────

  const openNewCat = () => { setEditingCat(null); setCatForm({ name: '', description: '' }); setShowCatForm(true) }
  const openEditCat = (cat: Category) => { setEditingCat(cat); setCatForm({ name: cat.name, description: cat.description ?? '' }); setShowCatForm(true) }

  const saveCat = async () => {
    if (!catForm.name.trim()) return toast.info('El nombre es requerido')
    setSaving(true)
    try {
      if (editingCat) {
        const { error } = await supabase.from('consumption_categories').update({ name: catForm.name, description: catForm.description || null }).eq('id', editingCat.id)
        if (error) throw error
        toast.success('Categoría actualizada')
      } else {
        const { error } = await supabase.from('consumption_categories').insert({ event_id: eventId, name: catForm.name, description: catForm.description || null, sort_order: categories.length })
        if (error) throw error
        toast.success('Categoría creada')
      }
      setShowCatForm(false)
      fetchData()
    } catch (e: any) { toast.error(e.message) } finally { setSaving(false) }
  }

  const deleteCat = async (id: string) => {
    toast.warning('¿Eliminar esta categoría y todos sus ítems?', {
      action: { label: 'Eliminar', onClick: async () => { await supabase.from('consumption_categories').delete().eq('id', id); fetchData() } },
      cancel: { label: 'Cancelar', onClick: () => {} }
    })
  }

  const toggleCat = async (cat: Category) => {
    await supabase.from('consumption_categories').update({ is_active: !cat.is_active }).eq('id', cat.id)
    fetchData()
  }

  // ── Item actions ───────────────────────────────────────────────────────────

  const openNewItem = (categoryId?: string) => {
    setEditingItem(null)
    setItemForm({ category_id: categoryId ?? '', name: '', description: '', price: '', image_url: '', is_available: true, stock_enabled: false, stock_remaining: '', prep_time_seconds: '120', alcohol_content: 'medium' })
    setShowItemForm(true)
  }

  const openEditItem = (item: MenuItem) => {
    setEditingItem(item)
    setItemForm({
      category_id: item.category_id ?? '',
      name: item.name,
      description: item.description ?? '',
      price: item.price.toString(),
      image_url: item.image_url ?? '',
      is_available: item.is_available,
      stock_enabled: item.stock_enabled,
      stock_remaining: item.stock_remaining?.toString() ?? '',
      prep_time_seconds: item.prep_time_seconds.toString(),
      alcohol_content: item.alcohol_content,
    })
    setShowItemForm(true)
  }

  const saveItem = async () => {
    if (!itemForm.name.trim()) return toast.info('El nombre es requerido')
    const price = parseInt(itemForm.price)
    if (isNaN(price) || price < 0) return toast.info('El precio es inválido')
    const prepTime = parseInt(itemForm.prep_time_seconds)
    if (isNaN(prepTime) || prepTime < 10) return toast.info('El tiempo de preparación mínimo es 10 segundos')

    setSaving(true)
    try {
      const payload = {
        event_id: eventId,
        category_id: itemForm.category_id || null,
        name: itemForm.name,
        description: itemForm.description || null,
        price,
        image_url: itemForm.image_url || null,
        is_available: itemForm.is_available,
        stock_enabled: itemForm.stock_enabled,
        stock_remaining: itemForm.stock_enabled && itemForm.stock_remaining ? parseInt(itemForm.stock_remaining) : null,
        prep_time_seconds: prepTime,
        alcohol_content: itemForm.alcohol_content,
        sort_order: editingItem ? editingItem.sort_order : items.length,
      }

      if (editingItem) {
        const { error } = await supabase.from('consumption_items').update(payload).eq('id', editingItem.id)
        if (error) throw error
        toast.success('Ítem actualizado')
      } else {
        const { error } = await supabase.from('consumption_items').insert(payload)
        if (error) throw error
        toast.success('Ítem agregado a la carta')
      }

      setShowItemForm(false)
      fetchData()
    } catch (e: any) { toast.error(e.message) } finally { setSaving(false) }
  }

  const deleteItem = async (id: string) => {
    toast.warning('¿Eliminar este ítem de la carta?', {
      action: { label: 'Eliminar', onClick: async () => { await supabase.from('consumption_items').delete().eq('id', id); fetchData() } },
      cancel: { label: 'Cancelar', onClick: () => {} }
    })
  }

  const toggleItem = async (item: MenuItem) => {
    await supabase.from('consumption_items').update({ is_available: !item.is_available }).eq('id', item.id)
    fetchData()
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const filteredItems = selectedCategory === 'all'
    ? items
    : items.filter(i => i.category_id === selectedCategory)

  const uncategorized = items.filter(i => !i.category_id)

  if (loading) return (
    <div className="flex items-center justify-center py-40">
      <Loader2 className="animate-spin text-violet-400" size={36} />
    </div>
  )

  return (
    <div className="space-y-8 animate-in fade-in">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <UtensilsCrossed className="text-violet-400" size={26} /> Carta de Consumos
          </h2>
          <p className="text-zinc-500 text-xs mt-1">{items.length} ítems · {categories.length} categorías</p>
        </div>
        <div className="flex gap-2">
          <button onClick={openNewCat} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all">
            <Tag size={14} /> Nueva Categoría
          </button>
          <button onClick={() => openNewItem()} className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-black text-xs rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-violet-900/20">
            <Plus size={14} /> Agregar Ítem
          </button>
        </div>
      </div>

      {/* CATEGORY MODAL */}
      {showCatForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-black">{editingCat ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
              <button onClick={() => setShowCatForm(false)} className="text-white/40 hover:text-white"><X size={18} /></button>
            </div>
            <input value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} placeholder="Nombre (ej: Cócteles)" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-violet-500 font-bold" />
            <input value={catForm.description} onChange={e => setCatForm({ ...catForm, description: e.target.value })} placeholder="Descripción (opcional)" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-violet-500" />
            <div className="flex gap-3">
              <button onClick={saveCat} disabled={saving} className="flex-1 py-3 bg-violet-600 hover:bg-violet-500 text-white font-black rounded-xl text-sm transition-all disabled:opacity-50">
                {saving ? <Loader2 className="animate-spin mx-auto" size={18} /> : (editingCat ? 'Guardar' : 'Crear')}
              </button>
              <button onClick={() => setShowCatForm(false)} className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/50 hover:text-white text-sm font-bold transition-all">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* ITEM MODAL */}
      {showItemForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-lg space-y-4 my-8">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-black">{editingItem ? 'Editar Ítem' : 'Nuevo Ítem'}</h3>
              <button onClick={() => setShowItemForm(false)} className="text-white/40 hover:text-white"><X size={18} /></button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1 mb-1 block">Nombre del ítem *</label>
                <input value={itemForm.name} onChange={e => setItemForm({ ...itemForm, name: e.target.value })} placeholder="Ej: Piscola" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-violet-500 font-bold" />
              </div>

              <div>
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1 mb-1 block">Precio (CLP) *</label>
                <input type="number" value={itemForm.price} onChange={e => setItemForm({ ...itemForm, price: e.target.value })} placeholder="4500" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-violet-500 font-bold" />
              </div>

              <div>
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1 mb-1 block">Tiempo Prep. (seg)</label>
                <input type="number" value={itemForm.prep_time_seconds} onChange={e => setItemForm({ ...itemForm, prep_time_seconds: e.target.value })} placeholder="120" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-violet-500 font-bold" />
              </div>

              <div className="col-span-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1 mb-1 block">Categoría</label>
                <div className="relative">
                  <select value={itemForm.category_id} onChange={e => setItemForm({ ...itemForm, category_id: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-violet-500 appearance-none font-bold">
                    <option value="">Sin categoría</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                </div>
              </div>

              <div className="col-span-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1 mb-1 block">Tipo de alcohol</label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(ALCOHOL_LABELS).map(([key, label]) => (
                    <button key={key} onClick={() => setItemForm({ ...itemForm, alcohol_content: key })}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${itemForm.alcohol_content === key ? ALCOHOL_COLORS[key] : 'bg-white/5 border-white/5 text-white/30'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="col-span-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1 mb-1 block">Descripción</label>
                <textarea value={itemForm.description} onChange={e => setItemForm({ ...itemForm, description: e.target.value })} placeholder="Descripción del trago..." rows={2} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-violet-500 resize-none" />
              </div>

              <div className="col-span-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1 mb-1 block">URL Imagen</label>
                <input value={itemForm.image_url} onChange={e => setItemForm({ ...itemForm, image_url: e.target.value })} placeholder="https://..." className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-violet-500" />
              </div>

              {/* Toggles */}
              <div className="col-span-2 flex gap-4">
                <button onClick={() => setItemForm({ ...itemForm, is_available: !itemForm.is_available })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all ${itemForm.is_available ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-white/5 border-white/10 text-white/30'}`}>
                  {itemForm.is_available ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                  Disponible
                </button>
                <button onClick={() => setItemForm({ ...itemForm, stock_enabled: !itemForm.stock_enabled })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all ${itemForm.stock_enabled ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-white/5 border-white/10 text-white/30'}`}>
                  {itemForm.stock_enabled ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                  Control Stock
                </button>
              </div>

              {itemForm.stock_enabled && (
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1 mb-1 block">Stock disponible</label>
                  <input type="number" value={itemForm.stock_remaining} onChange={e => setItemForm({ ...itemForm, stock_remaining: e.target.value })} placeholder="Ej: 50" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-violet-500 font-bold" />
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={saveItem} disabled={saving} className="flex-1 py-3 bg-violet-600 hover:bg-violet-500 text-white font-black rounded-xl text-sm transition-all disabled:opacity-50">
                {saving ? <Loader2 className="animate-spin mx-auto" size={18} /> : (editingItem ? 'Guardar Cambios' : 'Agregar a la Carta')}
              </button>
              <button onClick={() => setShowItemForm(false)} className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/50 hover:text-white text-sm font-bold transition-all">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORIES ROW */}
      {categories.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest">Categorías</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <div key={cat.id} className={`flex items-center gap-2 pl-3 pr-1 py-1 rounded-xl border text-sm font-bold transition-all ${cat.is_active ? 'bg-violet-500/10 border-violet-500/20 text-violet-300' : 'bg-white/5 border-white/5 text-white/30'}`}>
                <Tag size={12} />
                {cat.name}
                <span className="text-white/20 text-xs">({items.filter(i => i.category_id === cat.id).length})</span>
                <button onClick={() => openEditCat(cat)} className="p-1 hover:text-white transition-colors"><Pencil size={12} /></button>
                <button onClick={() => toggleCat(cat)} className="p-1 hover:text-white transition-colors">{cat.is_active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}</button>
                <button onClick={() => deleteCat(cat.id)} className="p-1 hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FILTER TABS */}
      {categories.length > 0 && (
        <div className="flex gap-1 bg-black/30 p-1 rounded-xl w-fit border border-white/5 flex-wrap">
          <button onClick={() => setSelectedCategory('all')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedCategory === 'all' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
            Todos ({items.length})
          </button>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedCategory === cat.id ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
              {cat.name} ({items.filter(i => i.category_id === cat.id).length})
            </button>
          ))}
          {uncategorized.length > 0 && (
            <button onClick={() => setSelectedCategory('uncategorized')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedCategory === 'uncategorized' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
              Sin categoría ({uncategorized.length})
            </button>
          )}
        </div>
      )}

      {/* ITEMS GRID */}
      {filteredItems.length === 0 ? (
        <div className="py-24 border-2 border-dashed border-white/10 rounded-2xl text-center">
          <UtensilsCrossed size={48} className="text-white/10 mx-auto mb-4" />
          <p className="text-white/30 text-sm font-bold">No hay ítems en la carta todavía</p>
          <button onClick={() => openNewItem()} className="mt-4 px-4 py-2 bg-violet-600/20 border border-violet-500/30 text-violet-400 font-bold text-sm rounded-xl hover:bg-violet-600/30 transition-all">
            Agregar primer ítem
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredItems.map(item => {
            const catName = categories.find(c => c.id === item.category_id)?.name
            return (
              <div key={item.id} className={`bg-white/5 border rounded-2xl overflow-hidden transition-all group ${item.is_available ? 'border-white/10 hover:border-white/20' : 'border-white/5 opacity-50'}`}>
                {item.image_url ? (
                  <div className="h-32 overflow-hidden">
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                ) : (
                  <div className="h-20 bg-gradient-to-br from-violet-900/20 to-pink-900/20 flex items-center justify-center border-b border-white/5">
                    <ImagePlus size={24} className="text-white/10" />
                  </div>
                )}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-white font-black text-sm">{item.name}</h4>
                      {catName && <p className="text-violet-400 text-[10px] font-bold mt-0.5">{catName}</p>}
                    </div>
                    <p className="text-emerald-400 font-black text-base shrink-0">${item.price.toLocaleString('es-CL')}</p>
                  </div>

                  {item.description && <p className="text-white/40 text-xs line-clamp-2">{item.description}</p>}

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${ALCOHOL_COLORS[item.alcohol_content]}`}>
                      {ALCOHOL_LABELS[item.alcohol_content]}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white/5 border border-white/5 text-white/40">
                      ~{Math.round(item.prep_time_seconds / 60)}min prep
                    </span>
                    {item.stock_enabled && (
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${(item.stock_remaining ?? 0) > 5 ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                        <PackageCheck size={10} className="inline mr-1" />
                        Stock: {item.stock_remaining ?? 0}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <button onClick={() => toggleItem(item)} className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide px-3 py-1.5 rounded-xl transition-all border ${item.is_available ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-white/5 border-white/5 text-white/30'}`}>
                      {item.is_available ? <><ToggleRight size={12} /> Disponible</> : <><ToggleLeft size={12} /> No disponible</>}
                    </button>
                    <div className="flex gap-1">
                      <button onClick={() => openEditItem(item)} className="p-2 text-white/30 hover:text-white hover:bg-white/5 rounded-xl transition-all"><Pencil size={14} /></button>
                      <button onClick={() => deleteItem(item.id)} className="p-2 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
