import { useState } from 'react'
import './index.css'
import Header from './components/Header'
import NormalMode from './components/NormalMode'
import DigitMode from './components/DigitMode'
import SneakyMode from './components/SneakyMode'

const MODES = [
  { id: 'normal', label: 'Normal' },
  { id: 'digit',  label: 'Digit'  },
  { id: 'sneaky', label: 'Sneaky' },
]

export default function App() {
  const [mode, setMode] = useState('normal')

  function handleModeChange(id) {
    setMode(id)
  }

  return (
    <div className="app-wrapper">
      <Header />
      <nav className="mode-tabs" role="tablist">
        {MODES.map(m => (
          <button
            key={m.id}
            id={`tab-${m.id}`}
            role="tab"
            aria-selected={mode === m.id}
            className={`mode-tab${mode === m.id ? ' active' : ''}`}
            onClick={() => handleModeChange(m.id)}
          >
            {m.label}
          </button>
        ))}
      </nav>

      <main>
        {mode === 'normal' && <NormalMode />}
        {mode === 'digit'  && <DigitMode  />}
        {mode === 'sneaky' && <SneakyMode />}
      </main>
    </div>
  )
}
