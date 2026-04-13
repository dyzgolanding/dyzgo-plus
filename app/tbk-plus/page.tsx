'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function TbkPlusContent() {
  const searchParams = useSearchParams()
  const [attempted, setAttempted] = useState(false)

  useEffect(() => {
    if (attempted) return
    setAttempted(true)

    const token = searchParams.get('token_ws') || searchParams.get('TBK_TOKEN') || ''
    if (!token) return

    // Intentar abrir la app vía custom scheme
    window.location.href = `dyzgo://tbk-plus?token_ws=${encodeURIComponent(token)}`
  }, [searchParams, attempted])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: '#030303', color: '#fff', fontFamily: 'sans-serif', padding: 24, textAlign: 'center'
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Pago procesado</h1>
      <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 32 }}>
        Volviendo a la app DyzGO...
      </p>
      <a
        href={`dyzgo://tbk-plus?token_ws=${encodeURIComponent(searchParams.get('token_ws') || '')}`}
        style={{
          background: '#FF31D8', color: '#fff', padding: '14px 28px',
          borderRadius: 12, fontWeight: 700, textDecoration: 'none', fontSize: 16
        }}
      >
        Abrir DyzGO
      </a>
    </div>
  )
}

export default function TbkPlusPage() {
  return (
    <Suspense>
      <TbkPlusContent />
    </Suspense>
  )
}
