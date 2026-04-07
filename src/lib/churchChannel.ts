export interface ChurchVerse {
  number: number
  text: string
  reference: string
  version: string
}

export interface ChurchMessage {
  type: 'VERSES' | 'CLEAR' | 'PING' | 'CLOSE'
  verses?: ChurchVerse[]
  autoSend?: boolean
}

const CHANNEL_NAME = 'biblia-viva-church'
let channel: BroadcastChannel | null = null

const getChannel = (): BroadcastChannel => {
  if (!channel) {
    channel = new BroadcastChannel(CHANNEL_NAME)
  }
  return channel
}

export const sendToChurch = (payload: ChurchMessage): void => {
  try {
    const ch = getChannel()
    ch.postMessage(payload)
  } catch (error) {
    console.error('Erro ao enviar para Modo Igreja:', error)
  }
}

export const onChurchMessage = (callback: (message: ChurchMessage) => void): (() => void) => {
  const ch = getChannel()
  const handler = (event: MessageEvent<ChurchMessage>) => {
    callback(event.data)
  }
  ch.addEventListener('message', handler)
  return () => {
    ch.removeEventListener('message', handler)
  }
}

export const closeChurchChannel = (): void => {
  if (channel) {
    channel.close()
    channel = null
  }
}

export { getChannel as getChurchChannel }
