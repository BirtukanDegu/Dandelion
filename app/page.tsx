'use client'

import * as React from 'react'
import { flushSync } from 'react-dom'

export default function Page() {
  const storageKey = React.useMemo(() => {
    const date = new Date()
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
  }, [])

  const [text, setText] = React.useState('')
  const [isPlaying, setIsPlaying] = React.useState(false)

  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const audioRef = React.useRef<HTMLAudioElement | null>(null)
  const savingTimeout = React.useRef<NodeJS.Timeout | null>(null)

  function forceFocus(e?: React.SyntheticEvent<HTMLTextAreaElement> | UIEvent | Event) {
    if (e) {
      e.preventDefault()
    }

    const el = textareaRef.current
    el.focus()
    el.setSelectionRange(el.value.length, el.value.length)
    el.scrollTop = el.scrollHeight
  }

  function togglePlay() {
    setIsPlaying(prev => !prev);
  }

  React.useEffect(() => {
    window.addEventListener('resize', forceFocus, { passive: true })
    document.addEventListener('selectionchange', forceFocus)
    return () => {
      window.removeEventListener('resize', forceFocus)
      document.removeEventListener('selectionchange', forceFocus)
    }
  }, [])

  React.useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('/sounds/background.m4a'); 
      audioRef.current.loop = true;
    }

    if (isPlaying) {
      audioRef.current.play().catch(error => {
        console.error("Audio playback failed:", error);
        setIsPlaying(false); 
      });
    } else {
      audioRef.current.pause();
    }

    return () => {
      audioRef.current?.pause();
    }
  }, [isPlaying]);

  React.useEffect(() => {
    window.addEventListener('resize', forceFocus, { passive: true })
    document.addEventListener('selectionchange', forceFocus)
    return () => {
      window.removeEventListener('resize', forceFocus)
      document.removeEventListener('selectionchange', forceFocus)
    }
  }, [])  

  React.useEffect(() => {
    try {
      const savedText = localStorage.getItem(storageKey)

      if (savedText) {
        setText(savedText)
        forceFocus()
      }
    } catch (e) {}
  }, [])

  React.useEffect(() => {
    forceFocus()
  }, [text])

  React.useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      // Focus
      if (e.key === 'Tab') {
        e.preventDefault()
        forceFocus()
        return
      }

      // Blur
      if (e.key === 'Escape') {
        e.preventDefault()
        textareaRef.current?.blur()
        return
      }

      // Save
      if (e.key === 's' && e.metaKey) {
        e.preventDefault()
        save()
        return
      }

      // Clear document content
      if (e.key === 'Backspace' && (e.ctrlKey || e.metaKey)) {
        const confirmed = confirm("Are you sure you want to delete today's note?")

        if (confirmed) {
          flushSync(() => {
            setText('')
          })

          forceFocus()

          try {
            localStorage.removeItem(storageKey)
          } catch (e) {}
        }

        return
      }

      // Go into fullscreen
      if (e.code === 'KeyF' && e.ctrlKey && e.shiftKey) {
        e.preventDefault()
        document.documentElement.requestFullscreen()
        forceFocus()
        return
      }

      if (e.key === 'm' && e.ctrlKey) {
        e.preventDefault();
        togglePlay();
        return;
      }      

      if (document.activeElement === textareaRef.current) {
        return
      }      
    }

    document.addEventListener('keydown', handleKeydown)

    return () => {
      document.removeEventListener('keydown', handleKeydown)
    }
  }, [])

  function save() {
    try {
      localStorage.setItem(storageKey, textareaRef.current.value)
    } catch (e) {}
  }

  return (
    <main>
      <header>
        {new Date().toLocaleString(undefined, {
          month: 'long',
          day: 'numeric',
        })}
        
        <div 
          className="music-toggle-container" 
          onClick={togglePlay} 
          title={isPlaying ? 'Pause music (m)' : 'Play music (m)'}
        >
          {isPlaying ? (
            <div className="icon">
              <span />
              <span />
              <span />
            </div>
          ) : (
            <span className='play-icon'>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
              </svg>
            </span>
          )}
        </div>

      </header>
      <section>
        <textarea
          ref={textareaRef}
          value={'\n\n\n\n' + text}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          dir="auto"
          onPointerDown={forceFocus}
          onPointerUp={forceFocus}
          onClick={forceFocus}
          onKeyDown={(e) => {
            if (['Backspace', 'ArrowUp', 'ArrowLeft', 'Arrowright', 'ArrowDown'].includes(e.key)) {
              e.preventDefault()
            }
          }}
          onChange={(e) => {
            setText(e.currentTarget.value.slice(4))

            // Debounce saving to localStorage
            clearTimeout(savingTimeout.current)
            savingTimeout.current = setTimeout(save, 500)
          }}
        />

        <div className="overlay">
          <div />
          <div />
          <div />
          <div />
        </div>
      </section>
    </main>
  )
}
