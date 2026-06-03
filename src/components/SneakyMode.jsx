import { useState, useRef, useEffect } from 'react'
import Confetti from './Confetti'

const DEFAULTS = { min: 1, max: 1000 }

function buildSet(min, max) {
  // Cap at 10000 to keep Set operations fast
  const safeMax = Math.min(max, 10000)
  const s = new Set()
  for (let i = min; i <= safeMax; i++) s.add(i)
  return s
}

function adversarialAnswer(validSet, guess) {
  if (validSet.size === 1 && validSet.has(guess)) return 'correct'
  const higherSet = new Set([...validSet].filter(n => n > guess))
  const lowerSet  = new Set([...validSet].filter(n => n < guess))
  if (higherSet.size >= lowerSet.size) return higherSet.size > 0 ? 'higher' : 'correct'
  return lowerSet.size > 0 ? 'lower' : 'correct'
}

function applyAnswer(validSet, guess, answer) {
  if (answer === 'higher') return new Set([...validSet].filter(n => n > guess))
  if (answer === 'lower')  return new Set([...validSet].filter(n => n < guess))
  return new Set([guess])
}

// ── Outer wrapper ──────────────────────────────────────────────
export default function SneakyMode() {
  const [key,          setKey]          = useState(0)
  const [settings,     setSettings]     = useState(DEFAULTS)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [pending,      setPending]      = useState(DEFAULTS)
  const [settingsErr,  setSettingsErr]  = useState([])

  function openSettings() {
    setPending({ ...settings })
    setSettingsErr([])
    setSettingsOpen(true)
  }

  function applySettings() {
    let min = parseInt(pending.min, 10)
    let max = parseInt(pending.max, 10)
    const errors = []

    if (isNaN(min) || min < 0)      { min = 0;         errors.push('Min set to 0.') }
    if (isNaN(max) || max <= min)   { max = min + 100;  errors.push(`Max set to ${min + 100}.`) }
    if (max > 10000)                { max = 10000;      errors.push('Max capped at 10000 for performance.') }

    setSettings({ min, max })
    setPending({ min, max })
    setKey(k => k + 1)
    setSettingsOpen(false)
    if (errors.length) setSettingsErr(errors)
  }

  return (
    <>
      <div className="game-header-row">
        <h2 className="game-title">Sneaky Mode</h2>
        <button
          id="sneaky-settings-btn"
          className={`gear-btn${settingsOpen ? ' active' : ''}`}
          onClick={settingsOpen ? () => setSettingsOpen(false) : openSettings}
          aria-label="Game settings"
          title="Settings"
        >
          ⚙
        </button>
      </div>

      {settingsOpen && (
        <div className="settings-panel" role="region" aria-label="Sneaky mode settings">
          <p className="settings-panel-title">Settings — Sneaky Mode</p>

          <div className="settings-row">
            <label className="settings-label">Minimum number</label>
            <div className="settings-control">
              <input
                id="sneaky-min"
                className="settings-input"
                type="number"
                min={0}
                value={pending.min}
                onChange={e => setPending(p => ({ ...p, min: e.target.value }))}
              />
            </div>
          </div>

          <div className="settings-row">
            <label className="settings-label">
              Maximum number
              <span className="settings-sublabel">Max 10000</span>
            </label>
            <div className="settings-control">
              <input
                id="sneaky-max"
                className="settings-input"
                type="number"
                min={1}
                max={10000}
                value={pending.max}
                onChange={e => setPending(p => ({ ...p, max: e.target.value }))}
              />
            </div>
          </div>

          {settingsErr.length > 0 && (
            <p className="settings-error">{settingsErr.join(' ')}</p>
          )}

          <div className="settings-actions">
            <button id="sneaky-apply-settings" className="btn" onClick={applySettings}>
              Apply &amp; Restart
            </button>
            <button className="btn btn-ghost" onClick={() => setSettingsOpen(false)}>
              Cancel
            </button>
          </div>
          <p className="settings-note">Takes effect on restart.</p>
        </div>
      )}

      <SneakyGame key={key} settings={settings} onRestart={() => setKey(k => k + 1)} />
    </>
  )
}

// ── Inner game ─────────────────────────────────────────────────
function SneakyGame({ settings, onRestart }) {
  const { min, max } = settings
  const [validSet, setValidSet] = useState(() => buildSet(min, max))
  const [history,  setHistory]  = useState([])
  const [status,   setStatus]   = useState('playing')
  const [input,    setInput]    = useState('')
  const [error,    setError]    = useState('')
  const [showConfetti, setShowConfetti] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  function handleSubmit(e) {
    e.preventDefault()
    const val = parseInt(input, 10)

    if (isNaN(val) || val < min || val > max) {
      setError(`Enter a number between ${min} and ${max}.`)
      return
    }
    if (!validSet.has(val)) {
      setError(`${val} has been eliminated. Try a number still in play.`)
      return
    }

    setError('')
    const answer  = adversarialAnswer(validSet, val)
    const nextSet = applyAnswer(validSet, val, answer)
    const nextHistory = [...history, { guess: val, answer, remaining: nextSet.size }]

    setHistory(nextHistory)
    setValidSet(nextSet)
    setInput('')

    if (answer === 'correct') {
      setStatus('won')
      setShowConfetti(true)
    }
  }

  const playing  = status === 'playing'
  const cornered = validSet.size === 1

  const validArr = [...validSet].sort((a, b) => a - b)
  const displayRange = validSet.size <= 20
    ? validArr.join(', ')
    : `${validArr[0]} – ${validArr[validArr.length - 1]}`

  const answerLabel = { higher: '↑ Higher', lower: '↓ Lower', correct: '= Correct' }

  return (
    <>
      {showConfetti && <Confetti active />}

      <p className="game-desc">
        The hidden number shifts after every guess but must stay consistent with
        all previous answers. Corner it until only one valid number remains, then guess it.
      </p>

      <div className="sneaky-meta">
        <div className="sneaky-stat">
          <span className="sneaky-stat-label">Valid left</span>
          <span className="sneaky-stat-value">{validSet.size}</span>
        </div>
        <div className="sneaky-stat">
          <span className="sneaky-stat-label">Guesses</span>
          <span className="sneaky-stat-value">{history.length}</span>
        </div>
        <div className="sneaky-stat">
          <span className="sneaky-stat-label">Range</span>
          <span className="sneaky-stat-value" style={{ fontSize: '0.8rem', fontWeight: 500 }}>
            {min} – {max}
          </span>
        </div>
      </div>

      {cornered && playing && (
        <div className="status-msg info">Cornered — only 1 number remains. Guess it.</div>
      )}
      {status === 'won' && (
        <div className="status-msg win">
          You cornered it — the number was {history[history.length - 1].guess}.
          Solved in {history.length} guess{history.length !== 1 ? 'es' : ''}.
        </div>
      )}
      {error && <p className="status-msg info">{error}</p>}

      {playing && (
        <>
          <p className="range-info">Still valid: {displayRange}</p>
          <form className="input-row" onSubmit={handleSubmit}>
            <input
              id="sneaky-guess-input"
              ref={inputRef}
              type="number"
              min={min}
              max={max}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={`${min} – ${max}`}
              autoComplete="off"
            />
            <button id="sneaky-guess-btn" type="submit" className="btn">Guess</button>
          </form>
        </>
      )}

      {history.length > 0 && (
        <table className="history-table" aria-label="Guess history">
          <thead>
            <tr>
              <th>#</th><th>Guess</th><th>Answer</th><th>Left</th>
            </tr>
          </thead>
          <tbody>
            {[...history].reverse().map((h, i) => (
              <tr key={i}>
                <td>{history.length - i}</td>
                <td>{h.guess}</td>
                <td className={`hint-${h.answer}`}>{answerLabel[h.answer]}</td>
                <td>{h.answer === 'correct' ? '0' : h.remaining}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!playing && (
        <div className="restart-row">
          <button id="sneaky-restart-btn" className="btn" onClick={onRestart}>Play Again</button>
        </div>
      )}
    </>
  )
}
