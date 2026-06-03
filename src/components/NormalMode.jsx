import { useState, useRef, useEffect } from 'react'

const MIN = 1
const MAX = 100
const MAX_GUESSES = 10

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export default function NormalMode() {
  const [secret]    = useState(() => randInt(MIN, MAX))
  const [input,   setInput]   = useState('')
  const [guesses, setGuesses] = useState([])   // [{value, hint}]
  const [status,  setStatus]  = useState('playing') // 'playing' | 'won' | 'lost'
  const [key,     setKey]     = useState(0)    // force remount on restart
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [key])

  function handleSubmit(e) {
    e.preventDefault()
    const val = parseInt(input, 10)
    if (isNaN(val) || val < MIN || val > MAX) return
    if (guesses.some(g => g.value === val)) return

    let hint
    if (val === secret)      hint = 'correct'
    else if (val < secret)   hint = 'higher'
    else                     hint = 'lower'

    const next = [...guesses, { value: val, hint }]
    setGuesses(next)
    setInput('')

    if (hint === 'correct') {
      setStatus('won')
    } else if (next.length >= MAX_GUESSES) {
      setStatus('lost')
    }
  }

  function restart() {
    setKey(k => k + 1)
  }

  return <NormalGame key={key} onRestart={restart} />
}

// Separate inner component so key-remount resets all state cleanly
function NormalGame({ onRestart }) {
  const [secret]   = useState(() => randInt(MIN, MAX))
  const [input,    setInput]   = useState('')
  const [guesses,  setGuesses] = useState([])
  const [status,   setStatus]  = useState('playing')
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  function handleSubmit(e) {
    e.preventDefault()
    const val = parseInt(input, 10)
    if (isNaN(val) || val < MIN || val > MAX) return
    if (guesses.some(g => g.value === val)) return

    let hint
    if (val === secret)    hint = 'correct'
    else if (val < secret) hint = 'higher'
    else                   hint = 'lower'

    const next = [...guesses, { value: val, hint }]
    setGuesses(next)
    setInput('')

    if (hint === 'correct') setStatus('won')
    else if (next.length >= MAX_GUESSES) setStatus('lost')
  }

  const remaining = MAX_GUESSES - guesses.length
  const playing   = status === 'playing'

  const hintLabel = {
    higher:  '↑ Higher',
    lower:   '↓ Lower',
    correct: '= Correct',
  }

  return (
    <>
      <h2 className="game-title">Normal Mode</h2>
      <p className="game-desc">
        Guess a number between {MIN} and {MAX}.
        You have {MAX_GUESSES} attempts.
        Each guess tells you whether the answer is higher or lower.
      </p>

      <p className="range-info">
        Range: {MIN} – {MAX} &nbsp;|&nbsp; Attempts left: {playing ? remaining : '—'}
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
            min={MIN}
            max={MAX}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={`${MIN} – ${MAX}`}
            autoComplete="off"
          />
          <button id="normal-guess-btn" type="submit" className="btn">Guess</button>
        </form>
      )}

      {guesses.length > 0 && (
        <ul className="guess-list" aria-label="Guess history">
          {[...guesses].reverse().map((g, i) => (
            <li key={i}>
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
  )
}
