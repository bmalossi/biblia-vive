import { useState, useEffect, useCallback } from 'react'
import { sendToChurch, type ChurchVerse } from '@/lib/churchChannel'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

interface UseChurchModeReturn {
  isActive: boolean
  autoSend: boolean
  selectedVerses: ChurchVerse[]
  toggleChurchMode: () => void
  toggleAutoSend: () => void
  sendToDisplay: (verses: ChurchVerse[]) => void
  clearDisplay: () => void
  addVerse: (verse: ChurchVerse) => void
  removeVerse: (verseNumber: number) => void
  clearSelection: () => void
  sendFullChapter: (verses: ChurchVerse[]) => void
}

export function useChurchMode(): UseChurchModeReturn {
  const [isActive, setIsActive] = useState(false)
  const [autoSend, setAutoSend] = useState(false)
  const [selectedVerses, setSelectedVerses] = useState<ChurchVerse[]>([])
  const [churchWindow, setChurchWindow] = useState<Window | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    const savedActive = localStorage.getItem('bv_modo_igreja_ativo')
    const savedAutoSend = localStorage.getItem('bv_church_auto_send')

    if (savedActive === 'true') {
      setIsActive(true)
      const existingWindow = window.open('/church-display', 'biblia-viva-church')
      if (existingWindow && !existingWindow.closed) {
        setChurchWindow(existingWindow)
      }
    }

    if (savedAutoSend !== null) {
      setAutoSend(savedAutoSend === 'true')
    }
  }, [])

  useEffect(() => {
    if (!churchWindow) return

    const checkInterval = setInterval(() => {
      if (churchWindow.closed) {
        setIsActive(false)
        localStorage.removeItem('bv_modo_igreja_ativo')
        clearInterval(checkInterval)
      }
    }, 1000)

    return () => clearInterval(checkInterval)
  }, [churchWindow])

  // Send church settings to the display window after it opens
  const sendSettings = useCallback(async () => {
    if (!user) return
    try {
      const { data } = await supabase
        .from('church_settings')
        .select('church_name, logo_url')
        .eq('user_id', user.id)
        .maybeSingle()

      sendToChurch({
        type: 'SETTINGS',
        settings: {
          churchName: data?.church_name ?? '',
          logoUrl: data?.logo_url ?? null,
        },
      })
    } catch {
      // Silently ignore — no settings configured yet
    }
  }, [user])

  const toggleChurchMode = useCallback(() => {
    if (isActive) {
      sendToChurch({ type: 'CLEAR' })
      setIsActive(false)
      localStorage.removeItem('bv_modo_igreja_ativo')
    } else {
      const newWindow = window.open('/church-display', 'biblia-viva-church')
      if (newWindow) {
        setChurchWindow(newWindow)
        setIsActive(true)
        localStorage.setItem('bv_modo_igreja_ativo', 'true')
        // Give the new tab ~1.5s to initialize before sending settings
        setTimeout(() => sendSettings(), 1500)
      }
    }
  }, [isActive, sendSettings])

  const toggleAutoSend = useCallback(() => {
    setAutoSend(prev => {
      const newValue = !prev
      localStorage.setItem('bv_church_auto_send', newValue ? 'true' : 'false')
      return newValue
    })
  }, [])

  const sendToDisplay = useCallback((verses: ChurchVerse[]) => {
    if (!isActive) return
    sendToChurch({ type: 'VERSES', verses, autoSend })
  }, [isActive, autoSend])

  const clearDisplay = useCallback(() => {
    if (!isActive) return
    sendToChurch({ type: 'CLEAR' })
  }, [isActive])

  const addVerse = useCallback((verse: ChurchVerse) => {
    setSelectedVerses(prev => {
      if (prev.some(v => v.number === verse.number)) return prev
      const updated = [...prev, verse]

      if (autoSend && isActive) {
        sendToChurch({ type: 'VERSES', verses: [verse], autoSend })
      }

      return updated
    })
  }, [isActive, autoSend])

  const removeVerse = useCallback((verseNumber: number) => {
    setSelectedVerses(prev => {
      const updated = prev.filter(v => v.number !== verseNumber)

      if (autoSend && isActive) {
        sendToChurch({ type: 'VERSES', verses: updated, autoSend })
      }

      return updated
    })
  }, [isActive, autoSend])

  const clearSelection = useCallback(() => {
    setSelectedVerses([])
    if (isActive) {
      sendToChurch({ type: 'CLEAR' })
    }
  }, [isActive])

  const sendFullChapter = useCallback((verses: ChurchVerse[]) => {
    if (!isActive) return
    sendToChurch({ type: 'VERSES', verses, autoSend })
  }, [isActive, autoSend])

  return {
    isActive,
    autoSend,
    selectedVerses,
    toggleChurchMode,
    toggleAutoSend,
    sendToDisplay,
    clearDisplay,
    addVerse,
    removeVerse,
    clearSelection,
    sendFullChapter,
  }
}
