import { useState, useRef, useEffect } from 'react'

const MAX_GUESSES = 8

function randDigitNumber(len) {
  // Guaranteed to have exactly `len` digits (no leading zeros)
  const min = Math.pow(10, len - 1)
  const max = Math.pow(10, len) - 1
  return String(Math.floor(Math.random() * (max - min + 1)) + min)
}

// Returns per-digit feedback: 'correct' | 'absent'
// Per spec: wrong-position digits get no special reveal — only exact matches shown
function getFeedback(secret, guess) {
  return guess.split('').map((ch, i) => {
    if (ch === secret[i]) return 'correct'
    return 'absent'
  })
}

function DigitGame({ len, onRestart, onChangLen }) {
  const [secret]  = useState(() => randDigitNumber(len))
  const [input,   setInput]   = useState('')
  const [guesses, setGuesses] = useState([]) // [{digits: string[], feedback: string[]}]
  const [status,  setStatus]  = useState('playing')
  const [error,   setError]   = useState('')
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  function handleSubmit(e) {
    e.preventDefault()
    const val = input.trim()

    if (!/^\d+$/.test(val)) {
      setError('Digits only.')
      return
    }
    if (val.length !== len) {
      setError(`Enter exactly ${len} digits.`)
      return
    }
    if (guesses.some(g => g.digits.join('') === val)) {
      setError('Already guessed that.')
      return
    }

    setError('')
    const feedback = getFeedback(secret, val)
    const next = [...guesses, { digits: val.split(''), feedback }]
    setGuesses(next)
    setInput('')

    if (val === secret) {
      setStatus('won')
    } else if (next.length >= MAX_GUESSES) {
      setStatus('lost')
    }
  }

  const playing = status === 'playing'

  return (
    <>
      <h2 className="game-title">Digit Mode</h2>
      <p className="game-desc">
        Guess the hidden {len}-digit number. After each guess, filled squares (&#9632;) mark
        digits that are correct and in the right position. Everything else is blank — no partial hints.
        You have {MAX_GUESSES} attempts.
      </p>

      <div className="len-select">
        <label>Digits:</label>
        <button
          id="len-4-btn"
          className={`len-btn${len === 4 ? ' active' : ''}`}
          onClick={() => onChangLen(4)}
          disabled={!playing && guesses.length > 0}
        >
          4
        </button>
        <button
          id="len-5-btn"
          className={`len-btn${len === 5 ? ' active' : ''}`}
          onClick={() => onChangLen(5)}
          disabled={!playing && guesses.length > 0}
        >
          5
        </button>
      </div>

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

      {error && <p className="status-msg info">{error}</p>}

      <div className="digit-grid" aria-label="Guess grid">
        {guesses.map((g, gi) => (
          <div key={gi} className="digit-row">
            {g.digits.map((d, di) => (
              <div
                key={di}
                className={`digit-cell${g.feedback[di] === 'correct' ? ' correct' : ' empty'}`}
                title={g.feedback[di] === 'correct' ? 'Correct position' : ''}
              >
                {d}
                {g.feedback[di] === 'correct' && <span className="cell-mark">&#9632;</span>}
              </div>
            ))}
          </div>
        ))}

        {/* Empty rows for remaining attempts */}
        {playing && Array.from({ length: MAX_GUESSES - guesses.length }).map((_, i) => (
          <div key={`empty-${i}`} className="digit-row">
            {Array.from({ length: len }).map((_, di) => (
              <div key={di} className="digit-cell empty" />
            ))}
          </div>
        ))}
      </div>

      {playing && (
        <form className="input-row" onSubmit={handleSubmit}>
          <input
            id="digit-guess-input"
            ref={inputRef}
            type="text"
            inputMode="numeric"
            maxLength={len}
            value={input}
            onChange={e => setInput(e.target.value.replace(/\D/g, '').slice(0, len))}
            placeholder={'_'.repeat(len)}
            autoComplete="off"
          />
          <button id="digit-guess-btn" type="submit" className="btn">Guess</button>
        </form>
      )}

      {!playing && (
        <div className="restart-row">
          <button id="digit-restart-btn" className="btn" onClick={onRestart}>
            Play Again
          </button>
        </div>
      )}
    </>
  )
}

export default function DigitMode() {
  const [len, setLen]   = useState(4)
  const [gameKey, setGameKey] = useState(0)

  function restart() { setGameKey(k => k + 1) }
  function handleLen(l) { setLen(l); setGameKey(k => k + 1) }

  return <DigitGame key={gameKey} len={len} onRestart={restart} onChangLen={handleLen} />
}
