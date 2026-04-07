import { useEffect, useState, useCallback } from 'react'
import { onChurchMessage, sendToChurch, type ChurchVerse } from '@/lib/churchChannel'

type DisplayStatus = 'waiting' | 'displaying' | 'closed'

export default function ChurchDisplayPage() {
  const [status, setStatus] = useState<DisplayStatus>('waiting')
  const [verses, setVerses] = useState<ChurchVerse[]>([])
  const [hasScroll, setHasScroll] = useState(false)

  useEffect(() => {
    sendToChurch({ type: 'PING' })

    const cleanup = onChurchMessage((message) => {
      switch (message.type) {
        case 'VERSES':
          setVerses(message.verses || [])
          setStatus('displaying')
          break
        case 'CLEAR':
          setVerses([])
          setStatus('waiting')
          break
        case 'CLOSE':
          setStatus('closed')
          setTimeout(() => {
            try {
              window.close()
            } catch {
              // ignore
            }
          }, 3000)
          break
      }
    })

    return cleanup
  }, [])

  useEffect(() => {
    if (status === 'displaying') {
      const checkScroll = () => {
        setHasScroll(document.body.scrollHeight > window.innerHeight)
      }
      checkScroll()
      window.addEventListener('resize', checkScroll)
      return () => window.removeEventListener('resize', checkScroll)
    }
  }, [status, verses])

  const getFontSize = useCallback((count: number) => {
    if (count <= 1) return 'text-5xl md:text-6xl'
    if (count === 2) return 'text-4xl md:text-5xl'
    if (count === 3) return 'text-3xl md:text-4xl'
    if (count <= 5) return 'text-2xl md:text-3xl'
    if (count <= 10) return 'text-xl md:text-2xl'
    return 'text-lg md:text-xl'
  }, [])

  if (status === 'closed') {
    return (
      <div className="church-display-page waiting flex-col items-center justify-center gap-4">
        <h1 className="logo-text">Bíblia Viva</h1>
        <p className="waiting-text text-lg">Modo Igreja encerrado</p>
      </div>
    )
  }

  if (status === 'waiting') {
    return (
      <div className="church-display-page waiting flex-col items-center justify-center gap-4">
        <h1 className="logo-text">Bíblia Viva</h1>
        <p className="waiting-text">Aguardando versículos...</p>
      </div>
    )
  }

  return (
    <div
      className={`church-display-page ${hasScroll ? 'cursor-auto' : 'cursor-none'}`}
      style={{ overflowY: hasScroll ? 'auto' : 'hidden' }}
    >
      <div className="verses-container w-full max-w-6xl mx-auto px-8 py-12 flex flex-col items-center justify-center min-h-screen gap-8">
        {verses.map((verse, index) => (
          <div key={`${verse.reference}-${index}`} className="w-full flex flex-col items-center">
            <div className="flex flex-col items-center gap-4">
              <p
                className={`verse-text text-center font-serif text-white leading-relaxed ${getFontSize(verses.length)}`}
                style={{ fontFamily: 'var(--font-serif, Lora), serif' }}
              >
                {verse.text}
              </p>
              <p
                className="verse-reference font-medium"
                style={{ color: '#c9a84c', fontSize: '0.875rem', textAlign: 'right' }}
              >
                {verse.reference} — {verse.version}
              </p>
            </div>
            {index < verses.length - 1 && (
              <div
                className="w-24 h-px my-6"
                style={{ backgroundColor: 'rgba(201, 168, 76, 0.3)' }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
