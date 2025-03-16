```typescript
"use client"

import { useEffect } from 'react'

interface Hotkey {
  key: string
  callback: () => void
  ctrlKey?: boolean
  altKey?: boolean
  shiftKey?: boolean
}

export function useHotkeys(hotkeys: Hotkey[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      hotkeys.forEach(({ key, callback, ctrlKey, altKey, shiftKey }) => {
        if (
          event.key.toLowerCase() === key.toLowerCase() &&
          (!ctrlKey || event.ctrlKey) &&
          (!altKey || event.altKey) &&
          (!shiftKey || event.shiftKey)
        ) {
          event.preventDefault()
          callback()
        }
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hotkeys])
}
```