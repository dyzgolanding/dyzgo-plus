'use client'
import Link from 'next/link'
// Se eliminó 'Globe' de la importación porque no se usaba y causaba error de linting
import { Sparkles, Mail, MessageCircle, ArrowLeft, ShieldCheck, Zap } from 'lucide-react'

export default function RegisterPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#030005] font-sans text-white relative overflow-hidden selection:bg-[#FF007F]/30">
      
      {/* ==================================================================
          1. FONDO GLOBAL (IDÉNTICO AL LOGIN)
      ================================================================== */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          {/* Imagen de fondo base */}
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1514525253440-b393452e3383?q=80&w=2500&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-color-dodge grayscale" />
          
          {/* Capa oscura para legibilidad */}
          <div className="absolute inset-0 bg-[#050208]/80 backdrop-blur-sm" />

          {/* Manchas de luz "Liquid" animadas */}
          <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-[#8A2BE2]/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-[#FF007F]/10 rounded-full blur-[120px]" />
      </div>

      {/* ==================================================================
          2. TARJETA UNIFICADA (DISTRIBUCIÓN FLUIDA)
      ================================================================== */}
      <div className="relative z-10 w-full max-w-5xl p-4 md:p-6">
        
        <div className="w-full grid lg:grid-cols-2 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl shadow-purple-900/30 min-h-[600px]">
            
            {/* --- COLUMNA IZQUIERDA: VISUAL & VALOR (Darker Glass) --- */}
            <div className="relative p-10 md:p-16 flex flex-col justify-center bg-black/20 overflow-hidden group">
                
                {/* Decoración de fondo interna */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#8A2BE2]/20 to-transparent rounded-full blur-[80px] group-hover:opacity-100 transition-opacity opacity-50" />
                
                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-[0.2em] uppercase mb-8 text-[#FF007F] w-fit shadow-lg shadow-purple-900/20">
                        <Sparkles size={12} className="text-[#FF007F]" />
                        Exclusive Access
                    </div>

                    <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-[0.95] mb-6 text-white">
                        Únete a la <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8A2BE2] via-[#FF007F] to-white animate-gradient-x">Élite.</span>
                    </h1>
                    
                    <p className="text-base text-white/50 font-medium max-w-sm leading-relaxed mb-10">
                        DyzGO+ es el sistema operativo privado para las productoras que definen la escena. Seguridad militar, analítica real y control total.
                    </p>

                    {/* Mini Grid de Features */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                            <ShieldCheck size={20} className="text-[#8A2BE2] mb-2" />
                            <div className="text-xs font-bold uppercase tracking-wider text-white">Seguridad</div>
                            <div className="text-[10px] text-white/40">Anti-fraude QR</div>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                            <Zap size={20} className="text-[#FF007F] mb-2" />
                            <div className="text-xs font-bold uppercase tracking-wider text-white">Velocidad</div>
                            <div className="text-[10px] text-white/40">Acceso en 0.2s</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- COLUMNA DERECHA: ACCIÓN (Lighter Glass) --- */}
            <div className="relative p-10 md:p-16 flex flex-col justify-center items-center text-center">
                
                {/* Separador Vertical (Solo Desktop) */}
                <div className="absolute left-0 top-10 bottom-10 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent hidden lg:block" />

                <div className="max-w-xs w-full">
                    <h2 className="text-2xl font-black text-white tracking-tight mb-3">Solicitar Invitación</h2>
                    <p className="text-white/40 text-sm mb-10">
                        Selecciona un canal para verificar tu productora con nuestro equipo.
                    </p>

                    <div className="space-y-4">
                        {/* Botón WhatsApp (Primary) */}
                        <a 
                            href="https://wa.me/56912345678?text=Hola,%20quisiera%20solicitar%20acceso%20a%20DyzGO+" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="group relative w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest text-white overflow-hidden shadow-lg shadow-green-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                        >
                            <div className="absolute inset-0 bg-[#25D366] group-hover:bg-[#20bd5a] transition-colors" />
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
                            <MessageCircle size={20} strokeWidth={2.5} className="relative z-10 text-black" />
                            <span className="relative z-10 text-black">WhatsApp Directo</span>
                        </a>

                        {/* Botón Correo (Secondary) */}
                        <a 
                            href="mailto:contacto@dyzgo.com?subject=Solicitud de Acceso DyzGO+&body=Hola equipo DyzGO, me gustaría solicitar acceso para mi productora..."
                            className="group w-full py-5 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 rounded-2xl font-bold text-xs uppercase tracking-widest text-white/60 hover:text-white transition-all flex items-center justify-center gap-3"
                        >
                            <Mail size={18} className="group-hover:text-[#8A2BE2] transition-colors" />
                            <span>Enviar Correo</span>
                        </a>
                    </div>

                    <div className="mt-12 pt-6 border-t border-white/5 w-full">
                        <Link 
                            href="/login" 
                            className="inline-flex items-center gap-2 text-[10px] font-bold text-white/30 hover:text-white transition-colors uppercase tracking-[0.2em] group"
                        >
                            <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" /> 
                            Volver al Login
                        </Link>
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  )
}