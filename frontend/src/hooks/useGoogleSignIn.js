import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

export function useGoogleSignIn(onCredential) {
  const [googleLoading, setGoogleLoading] = useState(false)
  const gsiReady = useRef(false)
  const containerRef = useRef(null)
  const onCredentialRef = useRef(onCredential)
  onCredentialRef.current = onCredential

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || gsiReady.current) return

    const initGsi = () => {
      gsiReady.current = true
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (res) => {
          setGoogleLoading(true)
          onCredentialRef.current(res.credential).finally(() => setGoogleLoading(false))
        },
        error_callback: (err) => {
          console.error('Google Sign-In error:', err)
          toast.error(err?.message || 'Google sign-in failed')
        },
      })
      if (containerRef.current) {
        window.google.accounts.id.renderButton(containerRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          width: '100%',
          logo_alignment: 'center',
        })
      }
    }

    if (window.google?.accounts) {
      initGsi()
    } else {
      const s = document.createElement('script')
      s.src = 'https://accounts.google.com/gsi/client'
      s.async = true
      s.onload = initGsi
      s.onerror = () => toast.error('Failed to load Google sign-in')
      document.head.appendChild(s)
    }
  }, [])

  return { googleLoading, containerRef }
}
