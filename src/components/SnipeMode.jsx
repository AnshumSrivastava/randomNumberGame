import { useState, useRef, useEffect } from 'react'
import NumberRoll from './NumberRoll'
import Confetti from './Confetti'

const DEFAULTS = { min: 1, max: 100, revealNumber: true }

function randInt(a, b) {
  return Math.floor(Math.random() * (b - a + 1)) + a
}

function getCompGuess(low, high, expertPct) {
  if (low >= high) return low
  const mid = Math.floor((low + high) / 2)
  const rnd = randInt(low, high)
  return Math.random() * 100 < expertPct ? mid : rnd
}

function levelName(v) {
  if (v <= 10) return 'Noob'
  if (v <= 30) return 'Easy'
  if (v <= 70) return 'Balanced'
  if (v <= 90) return 'Advanced'
  return 'Expert'
}

const HINT = { higher: '↑ Higher', lower: '↓ Lower', correct: '= Correct' }

// ── Outer wrapper ──────────────────────────────────────────────
export default function SnipeMode() {
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

    if (isNaN(min) || min < 0)    { min = 0;        errors.push('Min set to 0.') }
    if (isNaN(max) || max <= min) { max = min + 10;  errors.push(`Max set to ${min + 10}.`) }

    const valid = { min, max, revealNumber: pending.revealNumber }
    setSettings(valid)
    setPending(valid)
    setKey(k => k + 1)
    setSettingsOpen(false)
    if (errors.length) setSettingsErr(errors)
  }

  return (
    <>
      <div className="game-header-row">
        <h2 className="game-title">Snipe Mode</h2>
        <button
          id="snipe-settings-btn"
          className={`gear-btn${settingsOpen ? ' active' : ''}`}
          onClick={settingsOpen ? () => setSettingsOpen(false) : openSettings}
          aria-label="Game settings"
          title="Settings"
        >
          ⚙
        </button>
      </div>

      {settingsOpen && (
        <div className="settings-panel" role="region" aria-label="Snipe mode settings">
          <p className="settings-panel-title">Settings — Snipe Mode</p>

          <div className="settings-row">
            <label className="settings-label">Minimum number</label>
            <div className="settings-control">
              <input
                id="snipe-min"
                className="settings-input"
                type="number"
                min={0}
                value={pending.min}
                onChange={e => setPending(p => ({ ...p, min: e.target.value }))}
              />
            </div>
          </div>

          <div className="settings-row">
            <label className="settings-label">Maximum number</label>
            <div className="settings-control">
              <input
                id="snipe-max"
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
              Your secret number
              <span className="settings-sublabel">
                Reveal: you enter it upfront, computer auto-checks.
                Hidden: you keep it in your head, you judge each computer guess manually.
              </span>
            </label>
            <div className="settings-control">
              <div className="toggle-switch">
                <button
                  id="snipe-reveal-btn"
                  className={`toggle-btn${pending.revealNumber ? ' active' : ''}`}
                  onClick={() => setPending(p => ({ ...p, revealNumber: true }))}
                >
                  Reveal
                </button>
                <button
                  id="snipe-hidden-btn"
                  className={`toggle-btn${!pending.revealNumber ? ' active' : ''}`}
                  onClick={() => setPending(p => ({ ...p, revealNumber: false }))}
                >
                  Hidden
                </button>
              </div>
            </div>
          </div>

          {settingsErr.length > 0 && (
            <p className="settings-error">{settingsErr.join(' ')}</p>
          )}

          <div className="settings-actions">
            <button id="snipe-apply-settings" className="btn" onClick={applySettings}>
              Apply &amp; Restart
            </button>
            <button className="btn btn-ghost" onClick={() => setSettingsOpen(false)}>
              Cancel
            </button>
          </div>
          <p className="settings-note">Takes effect on restart.</p>
        </div>
      )}

      <SnipeGame key={key} settings={settings} onRestart={() => setKey(k => k + 1)} />
    </>
  )
}

// ── Inner game ─────────────────────────────────────────────────
function SnipeGame({ settings, onRestart }) {
  const { min, max, revealNumber } = settings

  /* phases: setup → generating → game → result */
  const [phase, setPhase] = useState('setup')

  /* setup */
  const [secretInput,  setSecretInput]  = useState('')
  const [secretError,  setSecretError]  = useState('')
  const [level,        setLevel]        = useState(50)

  /* stable refs — safe to read inside setTimeout callbacks */
  const playerSecretRef = useRef(null)
  const compSecretRef   = useRef(null)
  const compRangeRef    = useRef({ low: min, high: max })

  /* game display */
  const [playerRange,      setPlayerRange]      = useState({ low: min, high: max })
  const [compRangeDisplay, setCompRangeDisplay] = useState({ low: min, high: max })
  const [history,          setHistory]          = useState([])
  const [turn,             setTurn]             = useState('player')
  const [compThinking,     setCompThinking]     = useState(false)
  const [guessInput,       setGuessInput]       = useState('')
  const [guessError,       setGuessError]       = useState('')

  /* hidden-mode: waiting for player to judge the computer's guess */
  const [awaitingFeedback,  setAwaitingFeedback]  = useState(false)
  const [pendingCompGuess,  setPendingCompGuess]   = useState(null)

  /* result */
  const [winner,       setWinner]       = useState(null)
  const [showConfetti, setShowConfetti] = useState(false)

  const guessInputRef = useRef(null)
  const levelRef      = useRef(50)

  useEffect(() => { levelRef.current = level }, [level])

  useEffect(() => {
    if (phase === 'game' && turn === 'player' && !compThinking && !awaitingFeedback) {
      guessInputRef.current?.focus()
    }
  }, [phase, turn, compThinking, awaitingFeedback])

  /* ── Setup ── */
  function handleSetup(e) {
    e.preventDefault()

    if (revealNumber) {
      const val = parseInt(secretInput, 10)
      if (isNaN(val) || val < min || val > max) {
        setSecretError(`Enter a whole number between ${min} and ${max}.`)
        return
      }
      playerSecretRef.current = val
    } else {
      playerSecretRef.current = null  // kept in player's head
    }

    setSecretError('')
    compSecretRef.current = randInt(min, max)
    compRangeRef.current  = { low: min, high: max }
    setPhase('generating')
  }

  /* ── Player guesses computer's number ── */
  function handlePlayerGuess(e) {
    e.preventDefault()
    const val = parseInt(guessInput, 10)
    if (isNaN(val) || val < min || val > max) {
      setGuessError(`Enter a number between ${min} and ${max}.`)
      return
    }

    const cs = compSecretRef.current
    let feedback
    if (val === cs)    feedback = 'correct'
    else if (val < cs) feedback = 'higher'
    else               feedback = 'lower'

    // Narrow player's knowledge of computer's number
    setPlayerRange(prev => {
      const next = { ...prev }
      if (feedback === 'higher') next.low  = Math.max(next.low,  val + 1)
      if (feedback === 'lower')  next.high = Math.min(next.high, val - 1)
      return next
    })

    setGuessError('')
    setGuessInput('')
    setHistory(prev => [...prev, { who: 'player', guess: val, feedback }])

    if (feedback === 'correct') {
      setWinner('player')
      setShowConfetti(true)
      setPhase('result')
      return
    }

    // Computer's turn
    setTurn('computer')
    setCompThinking(true)
    const lvl   = levelRef.current
    const delay = 900 + Math.random() * 800

    setTimeout(() => {
      const range = compRangeRef.current
      const guess = getCompGuess(range.low, range.high, lvl)
      setCompThinking(false)

      if (revealNumber) {
        // Auto-compute feedback
        const ps = playerSecretRef.current
        let fb
        if (guess === ps)    fb = 'correct'
        else if (guess < ps) fb = 'higher'
        else                 fb = 'lower'
        processCompFeedback(guess, fb)
      } else {
        // Ask the player to judge
        setPendingCompGuess(guess)
        setAwaitingFeedback(true)
      }
    }, delay)
  }

  /* ── Player judges computer's guess (hidden mode) ── */
  function handleHiddenFeedback(feedback) {
    const guess = pendingCompGuess
    setAwaitingFeedback(false)
    setPendingCompGuess(null)
    processCompFeedback(guess, feedback)
  }

  /* ── Shared: process computer's guess result ── */
  function processCompFeedback(guess, feedback) {
    const newRange = { ...compRangeRef.current }
    if (feedback === 'higher') newRange.low  = guess + 1
    if (feedback === 'lower')  newRange.high = guess - 1
    compRangeRef.current = newRange
    setCompRangeDisplay({ ...newRange })

    setHistory(prev => [...prev, { who: 'computer', guess, feedback }])

    if (feedback === 'correct') {
      setWinner('computer')
      setPhase('result')
      return
    }

    setTurn('player')
  }

  /* ── Render: Setup ── */
  if (phase === 'setup') {
    return (
      <>
        <p className="game-desc">
          {revealNumber
            ? 'Enter your secret number, then take turns guessing each other\'s. First to guess correctly wins.'
            : 'Think of a secret number. The computer will try to guess it — you judge each guess. You also try to guess the computer\'s number. First to be correct wins.'
          }
        </p>

        <form onSubmit={handleSetup}>
          {revealNumber ? (
            <>
              <label htmlFor="snipe-secret-input" className="field-label">
                Your secret number ({min}–{max})
              </label>
              <div className="input-row">
                <input
                  id="snipe-secret-input"
                  type="number"
                  min={min}
                  max={max}
                  value={secretInput}
                  onChange={e => setSecretInput(e.target.value)}
                  placeholder={`${min} – ${max}`}
                  autoComplete="off"
                  autoFocus
                />
              </div>
              {secretError && (
                <p className="status-msg info" style={{ marginBottom: '12px' }}>{secretError}</p>
              )}
            </>
          ) : (
            <div className="status-msg info" style={{ marginBottom: '16px' }}>
              Think of a number between {min} and {max} and keep it in your head.
              When the computer guesses, you will judge each guess.
            </div>
          )}

          <div className="snipe-level-block">
            <div className="snipe-level-header">
              <label htmlFor="snipe-level-slider" className="field-label" style={{ margin: 0 }}>
                Computer difficulty
              </label>
              <span className="snipe-level-badge">
                {levelName(level)} &mdash; {level}% binary search
              </span>
            </div>
            <div className="snipe-slider-row">
              <span className="slider-label">Noob</span>
              <input
                id="snipe-level-slider"
                type="range"
                min={0}
                max={100}
                value={level}
                onChange={e => setLevel(Number(e.target.value))}
                className="snipe-slider"
              />
              <span className="slider-label">Expert</span>
            </div>
            <p className="snipe-level-desc">
              {level === 0
                ? 'Pure random — guesses anywhere in the remaining range.'
                : level === 100
                ? 'Pure binary search — always guesses the midpoint.'
                : `${level}% chance of picking the midpoint, ${100 - level}% random.`
              }
            </p>
          </div>

          <button id="snipe-start-btn" type="submit" className="btn" style={{ marginTop: '20px' }}>
            Start Game
          </button>
        </form>
      </>
    )
  }

  /* ── Render: Generating ── */
  if (phase === 'generating') {
    return (
      <NumberRoll
        onDone={() => setPhase('game')}
        min={min}
        max={max}
        label="Computer choosing its number..."
      />
    )
  }

  /* ── Render: Game + Result ── */
  const playerGuesses = history.filter(h => h.who === 'player').length
  const compGuesses   = history.filter(h => h.who === 'computer').length

  // For result: figure out what number the computer found (last correct comp guess)
  const compFoundEntry = history.find(h => h.who === 'computer' && h.feedback === 'correct')

  return (
    <>
      {showConfetti && <Confetti active />}

      {/* Stats bar */}
      <div className="sneaky-meta">
        <div className="sneaky-stat">
          <span className="sneaky-stat-label">Your guesses</span>
          <span className="sneaky-stat-value">{playerGuesses}</span>
        </div>
        <div className="sneaky-stat">
          <span className="sneaky-stat-label">Your range</span>
          <span className="sneaky-stat-value snipe-range">
            {playerRange.low}–{playerRange.high}
          </span>
        </div>
        <div className="sneaky-stat">
          <span className="sneaky-stat-label">CPU range</span>
          <span className="sneaky-stat-value snipe-range">
            {compRangeDisplay.low}–{compRangeDisplay.high}
          </span>
        </div>
        <div className="sneaky-stat">
          <span className="sneaky-stat-label">CPU level</span>
          <span className="sneaky-stat-value snipe-range">{levelName(level)}</span>
        </div>
      </div>

      {/* Result banner */}
      {phase === 'result' && (
        <div className={`status-msg${winner === 'player' ? ' win' : ''}`}>
          {winner === 'player'
            ? `You win! Found the computer's number (${compSecretRef.current}) in ${playerGuesses} guess${playerGuesses !== 1 ? 'es' : ''}.`
            : revealNumber
              ? `Computer wins — it found your number (${playerSecretRef.current}) in ${compGuesses} guess${compGuesses !== 1 ? 'es' : ''}. Its number was ${compSecretRef.current}.`
              : `Computer wins — it guessed your number (${compFoundEntry?.guess ?? '?'}) in ${compGuesses} guess${compGuesses !== 1 ? 'es' : ''}. Its number was ${compSecretRef.current}.`
          }
        </div>
      )}

      {/* Computer thinking */}
      {phase === 'game' && compThinking && (
        <div className="turn-indicator">
          Computer is thinking<span className="thinking-dots">...</span>
        </div>
      )}

      {/* Hidden-mode: waiting for player to judge computer's guess */}
      {phase === 'game' && awaitingFeedback && pendingCompGuess !== null && (
        <div className="comp-prompt">
          <p className="comp-prompt-label">Computer guesses</p>
          <p className="comp-prompt-number">{pendingCompGuess}</p>
          <p className="comp-prompt-question">
            Is your number higher, lower, or is this correct?
          </p>
          <div className="feedback-btns">
            <button
              id="feedback-higher"
              className="feedback-btn"
              onClick={() => handleHiddenFeedback('higher')}
            >
              ↑ Higher
            </button>
            <button
              id="feedback-lower"
              className="feedback-btn"
              onClick={() => handleHiddenFeedback('lower')}
            >
              ↓ Lower
            </button>
            <button
              id="feedback-correct"
              className="feedback-btn"
              onClick={() => handleHiddenFeedback('correct')}
            >
              = Correct
            </button>
          </div>
        </div>
      )}

      {/* Player input */}
      {phase === 'game' && turn === 'player' && !compThinking && !awaitingFeedback && (
        <>
          <div className="turn-indicator">
            Your turn — guess the computer&apos;s number ({playerRange.low}–{playerRange.high})
          </div>
          {guessError && <p className="status-msg info">{guessError}</p>}
          <form className="input-row" onSubmit={handlePlayerGuess}>
            <input
              id="snipe-guess-input"
              ref={guessInputRef}
              type="number"
              min={min}
              max={max}
              value={guessInput}
              onChange={e => setGuessInput(e.target.value)}
              placeholder={`${playerRange.low} – ${playerRange.high}`}
              autoComplete="off"
            />
            <button id="snipe-guess-btn" type="submit" className="btn">Guess</button>
          </form>
        </>
      )}

      {/* History feed */}
      {history.length > 0 && (
        <div className="table-scroll">
          <table className="history-table" aria-label="Game history">
            <thead>
              <tr>
                <th>#</th><th>Who</th><th>Guess</th><th>Answer</th>
              </tr>
            </thead>
            <tbody>
              {[...history].reverse().map((h, i) => (
                <tr key={history.length - i} className={h.who === 'computer' ? 'cpu-row' : ''}>
                  <td>{history.length - i}</td>
                  <td>{h.who === 'player' ? 'You' : 'CPU'}</td>
                  <td>{h.guess}</td>
                  <td className={`hint-${h.feedback}`}>{HINT[h.feedback]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}


      {phase === 'result' && (
        <div className="restart-row">
          <button id="snipe-restart-btn" className="btn" onClick={onRestart}>Play Again</button>
        </div>
      )}
    </>
  )
}
