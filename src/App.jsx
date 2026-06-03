import { useState, useEffect } from 'react'
import './index.css'
import Header from './components/Header'
import NormalMode from './components/NormalMode'
import DigitMode from './components/DigitMode'
import SneakyMode from './components/SneakyMode'
import SnipeMode from './components/SnipeMode'

const MODES = [
  { id: 'normal', label: 'Normal' },
  { id: 'digit',  label: 'Digit'  },
  { id: 'sneaky', label: 'Sneaky' },
  { id: 'snipe',  label: 'Snipe'  },
]

function getInitialDark() {
  try {
    const stored = localStorage.getItem('dark-mode')
    if (stored !== null) return stored === 'true'
  } catch {}
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

export default function App() {
  const [mode, setMode]     = useState('normal')
  const [darkMode, setDark] = useState(getInitialDark)

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : ''
    try { localStorage.setItem('dark-mode', String(darkMode)) } catch {}
  }, [darkMode])

  return (
    <>
      <div className="app-wrapper">
        <Header darkMode={darkMode} onToggleDark={() => setDark(d => !d)} />

        <nav className="mode-tabs" role="tablist">
          {MODES.map(m => (
            <button
              key={m.id}
              id={`tab-${m.id}`}
              role="tab"
              aria-selected={mode === m.id}
              className={`mode-tab${mode === m.id ? ' active' : ''}`}
              onClick={() => setMode(m.id)}
            >
              {m.label}
            </button>
          ))}
        </nav>

        <main>
          {mode === 'normal' && <NormalMode />}
          {mode === 'digit'  && <DigitMode  />}
          {mode === 'sneaky' && <SneakyMode />}
          {mode === 'snipe'  && <SnipeMode  />}
        </main>
      </div>

      <footer className="site-footer-bottom">
        <span>Made by</span>
        <strong>Anshum Srivastava</strong>
      </footer>
    </>
  )
}
