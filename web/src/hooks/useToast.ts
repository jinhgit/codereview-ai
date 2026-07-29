import { useCallback, useState } from 'react'
import type { ToastItem } from '../components/Toast'

let seq = 0

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  const push = useCallback((type: ToastItem['type'], message: string) => {
    const id = `t_${Date.now()}_${seq++}`
    setToasts((t) => [...t.slice(-4), { id, type, message }])
  }, [])

  return {
    toasts,
    dismiss,
    info: (m: string) => push('info', m),
    success: (m: string) => push('success', m),
    error: (m: string) => push('error', m),
  }
}
