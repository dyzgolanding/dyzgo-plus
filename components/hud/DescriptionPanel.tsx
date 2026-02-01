export default function ExperiencePanel() {
  return (
    <div className="space-y-6 animate-in fade-in">
       <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase">Edad Mín. Hombres</label>
            <input type="number" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3" placeholder="21" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase">Edad Mín. Mujeres</label>
            <input type="number" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3" placeholder="18" />
          </div>
       </div>
       {/* Tags de Música y Prohibidos aquí */}
    </div>
  )
}