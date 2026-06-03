import { useState, useRef, useEffect } from 'react'
import NumberRoll from './NumberRoll'
import Confetti from './Confetti'

const MIN = 1
const MAX = 100

function randInt(a, b) {
  return Math.floor(Math.random() * (b - a + 1)) + a
}

/**
 * Computer guessing strategy.
 * expertPct = 0  → pure random in [low, high]
 * expertPct = 100 → pure binary search (midpoint)
 * Between: probabilistic mix of both.
 */
function getCompGuess(low, high, expertPct) {
  if (low >= high) return low
  const mid = Math.floor((low + high) / 2)
  const rnd = randInt(low, high)
  return Math.random() * 100 < expertPct ? mid : rnd
}

function levelName(v) {
  if (v <=  10) return 'Noob'
  if (v <=  30) return 'Easy'
  if (v <=  70) return 'Balanced'
  if (v <=  90) return 'Advanced'
  return 'Expert'
}

const HINT = {
  higher:  '↑ Higher',
  lower:   '↓ Lower',
  correct: '= Correct',
}

// ─── outer wrapper — key trick for clean restart ───────────────────────────
export default function SnipeMode() {
  const [key, setKey] = useState(0)
  return <SnipeGame key={key} onRestart={() => setKey(k => k + 1)} />
}

// ─── main game component ────────────────────────────────────────────────────
function SnipeGame({ onRestart }) {
  /* phases: setup → generating → game → result */
  const [phase, setPhase] = useState('setup')

  /* setup */
  const [secretInput, setSecretInput] = useState('')
  const [secretError, setSecretError] = useState('')
  const [level, setLevel]             = useState(50)

  /* stable refs for async callbacks */
  const playerSecretRef = useRef(null)
  const compSecretRef   = useRef(null)
  const compRangeRef    = useRef({ low: MIN, high: MAX })

  /* game display state */
  const [playerRange,     setPlayerRange]     = useState({ low: MIN, high: MAX })
  const [compRangeDisplay, setCompRangeDisplay] = useState({ low: MIN, high: MAX })
  const [history,  setHistory]    = useState([])  // {who, guess, feedback}
  const [turn,     setTurn]       = useState('player')
  const [compThinking, setCompThinking] = useState(false)
  const [guessInput,   setGuessInput]   = useState('')
  const [guessError,   setGuessError]   = useState('')

  /* result */
  const [winner,      setWinner]      = useState(null)
  const [showConfetti, setShowConfetti] = useState(false)

  const guessInputRef = useRef(null)
  const levelRef      = useRef(50)

  useEffect(() => { levelRef.current = level }, [level])

  useEffect(() => {
    if (phase === 'game' && turn === 'player' && !compThinking) {
      guessInputRef.current?.focus()
    }
  }, [phase, turn, compThinking])

  /* ── Setup ── */
  function handleSetup(e) {
    e.preventDefault()
    const val = parseInt(secretInput, 10)
    if (isNaN(val) || val < MIN || val > MAX) {
      setSecretError(`Enter a whole number between ${MIN} and ${MAX}.`)
      return
    }
    setSecretError('')
    playerSecretRef.current = val
    compSecretRef.current   = randInt(MIN, MAX)
    compRangeRef.current    = { low: MIN, high: MAX }
    setPhase('generating')
  }

  /* ── Player guess ── */
  function handlePlayerGuess(e) {
    e.preventDefault()
    const val = parseInt(guessInput, 10)
    if (isNaN(val) || val < MIN || val > MAX) {
      setGuessError(`Enter a number between ${MIN} and ${MAX}.`)
      return
    }

    const cs = compSecretRef.current
    let feedback
    if (val === cs)    feedback = 'correct'
    else if (val < cs) feedback = 'higher'
    else               feedback = 'lower'

    // Update player's knowledge of comp's number
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

    // Hand off to computer
    setTurn('computer')
    setCompThinking(true)

    // Capture level now (stable for the callback)
    const lvl = levelRef.current
    const delay = 900 + Math.random() * 800

    setTimeout(() => {
      const range = compRangeRef.current
      const guess = getCompGuess(range.low, range.high, lvl)
      const ps    = playerSecretRef.current

      let fb
      if (guess === ps)    fb = 'correct'
      else if (guess < ps) fb = 'higher'
      else                 fb = 'lower'

      // Narrow comp's range
      const newRange = { ...range }
      if (fb === 'higher') newRange.low  = guess + 1
      if (fb === 'lower')  newRange.high = guess - 1
      compRangeRef.current = newRange
      setCompRangeDisplay({ ...newRange })

      setHistory(prev => [...prev, { who: 'computer', guess, feedback: fb }])
      setCompThinking(false)

      if (fb === 'correct') {
        setWinner('computer')
        setPhase('result')
        return
      }

      setTurn('player')
    }, delay)
  }

  /* ── Render: Setup ── */
  if (phase === 'setup') {
    return (
      <>
        <h2 className="game-title">Snipe Mode</h2>
        <p className="game-desc">
          Pick your secret number. The computer picks one too.
          You take turns guessing each other — first to guess correctly wins.
          Set how smart the computer plays with the difficulty slider.
        </p>

        <form onSubmit={handleSetup}>
          <label htmlFor="snipe-secret-input" className="field-label">
            Your secret number ({MIN}–{MAX})
          </label>
          <div className="input-row">
            <input
              id="snipe-secret-input"
              type="number"
              min={MIN}
              max={MAX}
              value={secretInput}
              onChange={e => setSecretInput(e.target.value)}
              placeholder={`${MIN} – ${MAX}`}
              autoComplete="off"
              autoFocus
            />
          </div>

          {secretError && (
            <p className="status-msg info" style={{ marginBottom: '12px' }}>
              {secretError}
            </p>
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
      <>
        <h2 className="game-title">Snipe Mode</h2>
        <NumberRoll
          onDone={() => setPhase('game')}
          min={MIN}
          max={MAX}
          label="Computer choosing its number..."
        />
      </>
    )
  }

  /* ── Render: Game + Result ── */
  const playerGuesses = history.filter(h => h.who === 'player').length
  const compGuesses   = history.filter(h => h.who === 'computer').length

  return (
    <>
      {showConfetti && <Confetti active />}

      <h2 className="game-title">Snipe Mode</h2>

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
            : `Computer wins — it found your number (${playerSecretRef.current}) in ${compGuesses} guess${compGuesses !== 1 ? 'es' : ''}. Its number was ${compSecretRef.current}.`
          }
        </div>
      )}

      {/* Turn indicator */}
      {phase === 'game' && (
        <div className="turn-indicator">
          {compThinking
            ? <span>Computer is thinking<span className="thinking-dots">...</span></span>
            : <span>Your turn — guess the computer&apos;s number ({playerRange.low}–{playerRange.high})</span>
          }
        </div>
      )}

      {/* Player input */}
      {phase === 'game' && turn === 'player' && !compThinking && (
        <>
          {guessError && <p className="status-msg info">{guessError}</p>}
          <form className="input-row" onSubmit={handlePlayerGuess}>
            <input
              id="snipe-guess-input"
              ref={guessInputRef}
              type="number"
              min={MIN}
              max={MAX}
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
        <table className="history-table" aria-label="Game history">
          <thead>
            <tr>
              <th>#</th>
              <th>Who</th>
              <th>Guess</th>
              <th>Answer</th>
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
      )}

      {phase === 'result' && (
        <div className="restart-row">
          <button id="snipe-restart-btn" className="btn" onClick={onRestart}>
            Play Again
          </button>
        </div>
      )}
    </>
  )
}
