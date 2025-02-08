```typescript
"use client"

import { useState, useCallback } from 'react'

export function useVoiceInput() {
  const [transcript, setTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)

  const startListening = useCallback(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setTranscript(transcript)
      }

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.start()
      setIsListening(true)
    } else {
      console.warn('Speech recognition not supported')
    }
  }, [])

  const stopListening = useCallback(() => {
    setIsListening(false)
  }, [])

  return {
    transcript,
    isListening,
    startListening,
    stopListening
  }
}
```