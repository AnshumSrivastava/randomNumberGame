import { useState, useRef, useEffect } from 'react'
import NumberRoll from './NumberRoll'
import Confetti from './Confetti'

const DEFAULTS = { min: 1, max: 100, maxGuesses: 10 }

function clamp(val, lo, hi) { return Math.max(lo, Math.min(hi, val)) }

function validateSettings(p) {
  let min = parseInt(p.min, 10)
  let max = parseInt(p.max, 10)
  let maxGuesses = parseInt(p.maxGuesses, 10)
  const errors = []

  if (isNaN(min) || min < 0)       { min = 0; errors.push('Min set to 0.') }
  if (isNaN(max) || max <= min)    { max = min + 10; errors.push(`Max set to ${max}.`) }
  if (max - min < 1)               { max = min + 1 }
  if (isNaN(maxGuesses) || maxGuesses < 1) { maxGuesses = 1; errors.push('Guesses set to 1.') }
  maxGuesses = clamp(maxGuesses, 1, 50)

  return { valid: { min, max, maxGuesses }, errors }
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// ── Outer wrapper: manages settings + game key ─────────────────
export default function NormalMode() {
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
    const { valid, errors } = validateSettings(pending)
    if (errors.length) setSettingsErr(errors)
    setSettings(valid)
    setPending(valid)
    setKey(k => k + 1)
    setSettingsOpen(false)
  }

  return (
    <>
      <div className="game-header-row">
        <h2 className="game-title">Normal Mode</h2>
        <button
          id="normal-settings-btn"
          className={`gear-btn${settingsOpen ? ' active' : ''}`}
          onClick={settingsOpen ? () => setSettingsOpen(false) : openSettings}
          aria-label="Game settings"
          title="Settings"
        >
          ⚙
        </button>
      </div>

      {settingsOpen && (
        <div className="settings-panel" role="region" aria-label="Normal mode settings">
          <p className="settings-panel-title">Settings — Normal Mode</p>

          <div className="settings-row">
            <label className="settings-label">
              Minimum number
            </label>
            <div className="settings-control">
              <input
                id="normal-min"
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
            </label>
            <div className="settings-control">
              <input
                id="normal-max"
                className="settings-input"
                type="number"
                min={1}
                value={pending.max}
                onChange={e => setPending(p => ({ ...p, max: e.target.value }))}
              />
            </div>
          </div>

          <div className="settings-row">
            <label className="settings-label">
              Max guesses
              <span className="settings-sublabel">1 – 50</span>
            </label>
            <div className="settings-control">
              <input
                id="normal-max-guesses"
                className="settings-input"
                type="number"
                min={1}
                max={50}
                value={pending.maxGuesses}
                onChange={e => setPending(p => ({ ...p, maxGuesses: e.target.value }))}
              />
            </div>
          </div>

          {settingsErr.length > 0 && (
            <p className="settings-error">{settingsErr.join(' ')}</p>
          )}

          <div className="settings-actions">
            <button id="normal-apply-settings" className="btn" onClick={applySettings}>
              Apply &amp; Restart
            </button>
            <button className="btn btn-ghost" onClick={() => setSettingsOpen(false)}>
              Cancel
            </button>
          </div>
          <p className="settings-note">Takes effect on restart.</p>
        </div>
      )}

      <NormalGame key={key} settings={settings} onRestart={() => setKey(k => k + 1)} />
    </>
  )
}

// ── Inner game ─────────────────────────────────────────────────
function NormalGame({ settings, onRestart }) {
  const { min, max, maxGuesses } = settings
  const [generating, setGenerating] = useState(true)
  const [secret]  = useState(() => randInt(min, max))
  const [input,   setInput]   = useState('')
  const [guesses, setGuesses] = useState([])
  const [status,  setStatus]  = useState('playing')
  const [showConfetti, setShowConfetti] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!generating) inputRef.current?.focus()
  }, [generating])

  function handleSubmit(e) {
    e.preventDefault()
    const val = parseInt(input, 10)
    if (isNaN(val) || val < min || val > max) return
    if (guesses.some(g => g.value === val)) return

    let hint
    if (val === secret)    hint = 'correct'
    else if (val < secret) hint = 'higher'
    else                   hint = 'lower'

    const next = [...guesses, { value: val, hint }]
    setGuesses(next)
    setInput('')

    if (hint === 'correct') {
      setStatus('won')
      setShowConfetti(true)
    } else if (next.length >= maxGuesses) {
      setStatus('lost')
    }
  }

  const playing = status === 'playing'
  const remaining = maxGuesses - guesses.length
  const hintLabel = { higher: '↑ Higher', lower: '↓ Lower', correct: '= Correct' }

  return (
    <>
      {showConfetti && <Confetti active />}
      <p className="game-desc">
        Guess a number between {min} and {max}.
        You have {maxGuesses} attempt{maxGuesses !== 1 ? 's' : ''}.
        Each guess tells you if the answer is higher or lower.
      </p>

      {generating ? (
        <NumberRoll onDone={() => setGenerating(false)} min={min} max={max} />
      ) : (
        <>
          <p className="range-info">
            Range: {min} – {max} &nbsp;|&nbsp; Attempts left: {playing ? remaining : '—'}
          </p>

          {status === 'won' && (
            <div className="status-msg win">
              Correct — the number was {secret}. Found in {guesses.length} guess{guesses.length !== 1 ? 'es' : ''}.
            </div>
          )}
          {status === 'lost' && (
            <div className="status-msg">
              Out of guesses. The number was {secret}.
            </div>
          )}

          {playing && (
            <form className="input-row" onSubmit={handleSubmit}>
              <input
                id="normal-guess-input"
                ref={inputRef}
                type="number"
                min={min}
                max={max}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={`${min} – ${max}`}
                autoComplete="off"
              />
              <button id="normal-guess-btn" type="submit" className="btn">Guess</button>
            </form>
          )}

          {guesses.length > 0 && (
            <ul className="guess-list" aria-label="Guess history">
              {[...guesses].reverse().map((g, i) => (
                <li key={guesses.length - i}>
                  <span className="guess-number">{g.value}</span>
                  <span className={`guess-hint${g.hint === 'correct' ? ' correct' : ''}`}>
                    {hintLabel[g.hint]}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {!playing && (
            <div className="restart-row">
              <button id="normal-restart-btn" className="btn" onClick={onRestart}>
                Play Again
              </button>
            </div>
          )}
        </>
      )}
    </>
  )
}
