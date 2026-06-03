import { useState, useRef, useEffect } from 'react'

const RANGE_MIN = 1
const RANGE_MAX = 1000

// Build the initial set of all valid numbers
function buildFullSet() {
  const s = new Set()
  for (let i = RANGE_MIN; i <= RANGE_MAX; i++) s.add(i)
  return s
}

// Adversarial answer: pick whichever response ('higher' | 'lower') leaves
// the most valid numbers remaining, consistent with the guess.
// - 'higher' means the answer > guess  → keep numbers > guess
// - 'lower'  means the answer < guess  → keep numbers < guess
// If the guess is literally the only number left, we must say 'correct'.
function adversarialAnswer(validSet, guess) {
  if (validSet.size === 1 && validSet.has(guess)) return 'correct'

  const higherSet = new Set([...validSet].filter(n => n > guess))
  const lowerSet  = new Set([...validSet].filter(n => n < guess))

  // Prefer the larger remaining set (keep game alive longest)
  if (higherSet.size >= lowerSet.size) {
    return higherSet.size > 0 ? 'higher' : 'correct'
  } else {
    return lowerSet.size > 0 ? 'lower' : 'correct'
  }
}

function applyAnswer(validSet, guess, answer) {
  if (answer === 'higher') return new Set([...validSet].filter(n => n > guess))
  if (answer === 'lower')  return new Set([...validSet].filter(n => n < guess))
  return new Set([guess])
}

function SneakyGame({ onRestart }) {
  const [validSet, setValidSet] = useState(() => buildFullSet())
  // history: [{guess, answer, remaining}]  — remaining = valid set size AFTER this guess
  const [history,  setHistory]  = useState([])
  const [status,   setStatus]   = useState('playing')
  const [input,    setInput]    = useState('')
  const [error,    setError]    = useState('')
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  function handleSubmit(e) {
    e.preventDefault()
    const val = parseInt(input, 10)

    if (isNaN(val) || val < RANGE_MIN || val > RANGE_MAX) {
      setError(`Enter a number between ${RANGE_MIN} and ${RANGE_MAX}.`)
      return
    }
    if (!validSet.has(val)) {
      setError(`${val} has already been eliminated. Try a number still in play.`)
      return
    }

    setError('')
    const answer = adversarialAnswer(validSet, val)
    const nextSet = applyAnswer(validSet, val, answer)
    const nextHistory = [...history, { guess: val, answer, remaining: nextSet.size }]

    setHistory(nextHistory)
    setValidSet(nextSet)
    setInput('')

    if (answer === 'correct') {
      setStatus('won')
    }
  }

  const playing = status === 'playing'
  const cornered = validSet.size === 1

  const validArr = [...validSet].sort((a, b) => a - b)
  const displayRange = validSet.size <= 20
    ? validArr.join(', ')
    : `${validArr[0]} – ${validArr[validArr.length - 1]}`

  const answerLabel = {
    higher:  '↑ Higher',
    lower:   '↓ Lower',
    correct: '= Correct',
  }

  return (
    <>
      <h2 className="game-title">Sneaky Mode</h2>
      <p className="game-desc">
        The hidden number shifts after every guess — but it must stay consistent with
        every previous answer. Your goal: use logic to corner the game until only one
        valid number remains, then guess it.
      </p>

      <div className="sneaky-meta">
        <div className="sneaky-stat">
          <span className="sneaky-stat-label">Valid numbers left</span>
          <span className="sneaky-stat-value">{validSet.size}</span>
        </div>
        <div className="sneaky-stat">
          <span className="sneaky-stat-label">Guesses made</span>
          <span className="sneaky-stat-value">{history.length}</span>
        </div>
        <div className="sneaky-stat">
          <span className="sneaky-stat-label">Range</span>
          <span className="sneaky-stat-value" style={{ fontSize: '0.8rem', fontWeight: 500 }}>
            {RANGE_MIN} – {RANGE_MAX}
          </span>
        </div>
      </div>

      {cornered && playing && (
        <div className="status-msg info">
          Cornered — only 1 number remains. Guess it to win.
        </div>
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
          <p className="range-info">
            Still valid: {displayRange}
          </p>
          <form className="input-row" onSubmit={handleSubmit}>
            <input
              id="sneaky-guess-input"
              ref={inputRef}
              type="number"
              min={RANGE_MIN}
              max={RANGE_MAX}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={`${RANGE_MIN} – ${RANGE_MAX}`}
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
              <th>#</th>
              <th>Guess</th>
              <th>Answer</th>
              <th>Left after</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
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
          <button id="sneaky-restart-btn" className="btn" onClick={onRestart}>
            Play Again
          </button>
        </div>
      )}
    </>
  )
}

export default function SneakyMode() {
  const [gameKey, setGameKey] = useState(0)
  return <SneakyGame key={gameKey} onRestart={() => setGameKey(k => k + 1)} />
}
