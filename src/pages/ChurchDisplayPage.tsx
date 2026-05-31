import { useEffect, useState, useCallback } from 'react'
import { onChurchMessage, sendToChurch, type ChurchVerse, type ChurchSettings } from '@/lib/churchChannel'
import { usePageMeta } from '@/hooks/usePageMeta'

type DisplayStatus = 'waiting' | 'displaying' | 'closed'
type DisplayMode = 'verses' | 'chapter'

export default function ChurchDisplayPage() {
  usePageMeta({
    title: "Projeção Modo Igreja — Bíblia Vive",
    robots: "noindex, nofollow",
  });
  const [status, setStatus] = useState<DisplayStatus>('waiting')
  const [verses, setVerses] = useState<ChurchVerse[]>([])
  const [displayMode, setDisplayMode] = useState<DisplayMode>('verses')
  const [settings, setSettings] = useState<ChurchSettings>({ churchName: '', logoUrl: null })

  useEffect(() => {
    sendToChurch({ type: 'PING' })

    const cleanup = onChurchMessage((message) => {
      switch (message.type) {
        case 'SETTINGS':
          if (message.settings) {
            setSettings(message.settings)
          }
          break
        case 'VERSES':
          if (message.verses && message.verses.length > 0) {
            setVerses(message.verses)
            setDisplayMode(message.verses.length > 5 ? 'chapter' : 'verses')
            setStatus('displaying')
            // Scroll to top of the container
            setTimeout(() => {
              const el = document.getElementById('church-display-container');
              if (el) el.scrollTop = 0;
            }, 50);
          }
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

  const getVerseFontSize = useCallback((count: number) => {
    if (count <= 1) return 'text-5xl md:text-6xl'
    if (count === 2) return 'text-4xl md:text-5xl'
    if (count === 3) return 'text-3xl md:text-4xl'
    if (count <= 5) return 'text-2xl md:text-3xl'
    return 'text-xl md:text-2xl'
  }, [])

  const WaitingScreen = () => (
    <div className="church-display-page" style={{ cursor: 'default' }}>
      <div className="w-full min-h-screen flex flex-col items-center justify-center gap-6">
        {settings.logoUrl ? (
          <img
            src={settings.logoUrl}
            alt={settings.churchName || 'Igreja'}
            className="h-28 w-auto object-contain mb-2"
            style={{ maxWidth: '280px' }}
          />
        ) : (
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-2"
            style={{ background: 'rgba(201, 168, 76, 0.12)', border: '1px solid rgba(201,168,76,0.25)' }}
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10" stroke="#c9a84c" strokeWidth="1.5">
              <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
              <path d="M9 21V12h6v9" />
            </svg>
          </div>
        )}
        {settings.churchName ? (
          <h1 className="logo-text">{settings.churchName}</h1>
        ) : (
          <h1 className="logo-text">Bíblia Viva</h1>
        )}
      </div>
    </div>
  )

  if (status === 'closed') {
    return (
      <div className="church-display-page" style={{ cursor: 'default' }}>
        <div className="w-full min-h-screen flex flex-col items-center justify-center gap-4">
          {settings.churchName ? (
            <h1 className="logo-text">{settings.churchName}</h1>
          ) : (
            <h1 className="logo-text">Bíblia Viva</h1>
          )}
          <p className="waiting-text text-lg">Modo Igreja encerrado</p>
        </div>
      </div>
    )
  }

  if (status === 'waiting') {
    return <WaitingScreen />
  }

  // Chapter mode: list of verses with number + text, larger font, free scroll
  if (displayMode === 'chapter') {
    return (
      <div
        id="church-display-container"
        className="church-display-page"
        style={{ overflowY: 'auto', cursor: 'auto', alignItems: 'flex-start' }}
      >
        <div className="w-full max-w-5xl mx-auto px-10 py-14 flex flex-col gap-6">
          {verses.map((verse, index) => (
            <div key={`${verse.reference}-${index}`} className="flex gap-4 items-start">
              <span
                style={{
                  color: '#c9a84c',
                  fontFamily: 'monospace',
                  fontSize: '1rem',
                  minWidth: '2rem',
                  paddingTop: '0.35rem',
                  opacity: 0.7,
                  flexShrink: 0,
                }}
              >
                {verse.number}
              </span>
              <p
                className="text-white leading-relaxed text-2xl md:text-3xl"
                style={{ fontFamily: 'var(--font-serif, Lora), serif' }}
              >
                {verse.text}
              </p>
            </div>
          ))}
          {verses[0] && (
            <p
              className="mt-4 text-right font-medium"
              style={{ color: '#c9a84c', fontSize: '0.9rem' }}
            >
              {verses[0].reference.split(':')[0]} — {verses[0].version}
            </p>
          )}
        </div>
      </div>
    )
  }

  // Verse mode: centered, large font, adaptive size
  return (
    <div
      className="church-display-page"
      style={{ overflowY: 'auto', cursor: 'auto' }}
    >
      <div className="verses-container w-full max-w-6xl mx-auto px-8 py-12 flex flex-col items-center justify-center min-h-screen gap-8">
        {verses.map((verse, index) => (
          <div key={`${verse.reference}-${index}`} className="w-full flex flex-col items-center">
            <div className="flex flex-col items-center gap-4">
              <p
                className={`verse-text text-center font-serif text-white leading-relaxed ${getVerseFontSize(verses.length)}`}
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
