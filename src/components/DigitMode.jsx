import { useState, useRef, useEffect } from 'react'
import NumberRoll from './NumberRoll'
import Confetti from './Confetti'

const DEFAULTS = { maxGuesses: 8 }

function randDigitNumber(len) {
  const min = Math.pow(10, len - 1)
  const max = Math.pow(10, len) - 1
  return String(Math.floor(Math.random() * (max - min + 1)) + min)
}

function getFeedback(secret, guess) {
  return guess.split('').map((ch, i) => ch === secret[i] ? 'correct' : 'absent')
}

// ── Outer wrapper ──────────────────────────────────────────────
export default function DigitMode() {
  const [len,          setLen]          = useState(4)
  const [gameKey,      setGameKey]      = useState(0)
  const [settings,     setSettings]     = useState(DEFAULTS)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [pending,      setPending]      = useState(DEFAULTS)
  const [settingsErr,  setSettingsErr]  = useState('')

  function openSettings() {
    setPending({ ...settings })
    setSettingsErr('')
    setSettingsOpen(true)
  }

  function applySettings() {
    let maxGuesses = parseInt(pending.maxGuesses, 10)
    if (isNaN(maxGuesses) || maxGuesses < 1) maxGuesses = 1
    if (maxGuesses > 20) maxGuesses = 20
    setSettings({ maxGuesses })
    setPending({ maxGuesses })
    setGameKey(k => k + 1)
    setSettingsOpen(false)
  }

  function handleLen(l) { setLen(l); setGameKey(k => k + 1) }
  const restart = () => setGameKey(k => k + 1)

  return (
    <>
      <div className="game-header-row">
        <h2 className="game-title">Digit Mode</h2>
        <button
          id="digit-settings-btn"
          className={`gear-btn${settingsOpen ? ' active' : ''}`}
          onClick={settingsOpen ? () => setSettingsOpen(false) : openSettings}
          aria-label="Game settings"
          title="Settings"
        >
          ⚙
        </button>
      </div>

      {settingsOpen && (
        <div className="settings-panel" role="region" aria-label="Digit mode settings">
          <p className="settings-panel-title">Settings — Digit Mode</p>

          <div className="settings-row">
            <label className="settings-label">
              Max guesses
              <span className="settings-sublabel">1 – 20</span>
            </label>
            <div className="settings-control">
              <input
                id="digit-max-guesses"
                className="settings-input"
                type="number"
                min={1}
                max={20}
                value={pending.maxGuesses}
                onChange={e => setPending({ maxGuesses: e.target.value })}
              />
            </div>
          </div>

          {settingsErr && <p className="settings-error">{settingsErr}</p>}

          <div className="settings-actions">
            <button id="digit-apply-settings" className="btn" onClick={applySettings}>
              Apply &amp; Restart
            </button>
            <button className="btn btn-ghost" onClick={() => setSettingsOpen(false)}>
              Cancel
            </button>
          </div>
          <p className="settings-note">Takes effect on restart.</p>
        </div>
      )}

      <DigitGame
        key={gameKey}
        len={len}
        settings={settings}
        onRestart={restart}
        onChangeLen={handleLen}
      />
    </>
  )
}

// ── Inner game ─────────────────────────────────────────────────
function DigitGame({ len, settings, onRestart, onChangeLen }) {
  const { maxGuesses } = settings
  const [generating, setGenerating] = useState(true)
  const [secret]  = useState(() => randDigitNumber(len))
  
  // Track inputs as an array of characters, padded with empty strings
  const [inputDigits, setInputDigits] = useState(Array(len).fill(''))
  
  const [guesses, setGuesses] = useState([])
  const [status,  setStatus]  = useState('playing')
  const [error,   setError]   = useState('')
  const [showConfetti, setShowConfetti] = useState(false)
  
  // Refs for each input to manage focus
  const inputRefs = useRef(Array(len).fill(null))

  useEffect(() => {
    if (!generating && status === 'playing') {
      inputRefs.current[0]?.focus()
    }
  }, [generating, status])

  function handleInputChange(index, e) {
    const value = e.target.value
    // Allow only numeric digits, take the last typed char if multiple
    const digit = value.replace(/\D/g, '').slice(-1)
    
    if (digit) {
      const newDigits = [...inputDigits]
      newDigits[index] = digit
      setInputDigits(newDigits)
      
      // Auto-advance focus
      if (index < len - 1) {
        inputRefs.current[index + 1]?.focus()
      }
    } else {
      // If cleared, just clear this box
      const newDigits = [...inputDigits]
      newDigits[index] = ''
      setInputDigits(newDigits)
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace') {
      if (!inputDigits[index] && index > 0) {
        // If empty, delete previous and move focus back
        const newDigits = [...inputDigits]
        newDigits[index - 1] = ''
        setInputDigits(newDigits)
        inputRefs.current[index - 1]?.focus()
      } else {
        // If has value, just clear it
        const newDigits = [...inputDigits]
        newDigits[index] = ''
        setInputDigits(newDigits)
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < len - 1) {
      inputRefs.current[index + 1]?.focus()
    } else if (e.key === 'Enter') {
      handleSubmit(e)
    }
  }

  function handleFocus(e) {
    // Select contents on focus for easy overwriting
    e.target.select()
  }

  function handleSubmit(e) {
    e.preventDefault()
    const val = inputDigits.join('')

    if (val.length !== len)  { setError(`Enter exactly ${len} digits.`); return }
    if (guesses.some(g => g.digits.join('') === val)) { setError('Already guessed that.'); return }

    setError('')
    const feedback = getFeedback(secret, val)
    const next = [...guesses, { digits: val.split(''), feedback }]
    setGuesses(next)
    
    // Clear inputs and refocus first box
    setInputDigits(Array(len).fill(''))
    inputRefs.current[0]?.focus()

    if (val === secret) {
      setStatus('won')
      setShowConfetti(true)
    } else if (next.length >= maxGuesses) {
      setStatus('lost')
    }
  }

  const playing  = status === 'playing'
  const rollMin  = Math.pow(10, len - 1)
  const rollMax  = Math.pow(10, len) - 1

  return (
    <>
      {showConfetti && <Confetti active />}
      <p className="game-desc">
        Guess the hidden {len}-digit number. Filled squares (&#9632;) mark digits
        correct in the right position. Wrong-position digits give no hint.
        You have {maxGuesses} attempts.
      </p>

      <div className="len-select">
        <label>Digits:</label>
        <button id="len-4-btn" className={`len-btn${len === 4 ? ' active' : ''}`} onClick={() => onChangeLen(4)}>4</button>
        <button id="len-5-btn" className={`len-btn${len === 5 ? ' active' : ''}`} onClick={() => onChangeLen(5)}>5</button>
      </div>

      {generating ? (
        <NumberRoll onDone={() => setGenerating(false)} min={rollMin} max={rollMax} label={`Generating ${len}-digit number...`} />
      ) : (
        <>
          {status === 'won' && (
            <div className="status-msg win">
              Correct — the number was {secret}. Found in {guesses.length} guess{guesses.length !== 1 ? 'es' : ''}.
            </div>
          )}
          {status === 'lost' && (
            <div className="status-msg">Out of guesses. The number was {secret}.</div>
          )}
          {error && <p className="status-msg info">{error}</p>}

          <div className="digit-grid" aria-label="Guess grid">
            {guesses.map((g, gi) => (
              <div key={gi} className="digit-row revealed">
                {g.digits.map((d, di) => (
                  <div key={di} className={`digit-cell${g.feedback[di] === 'correct' ? ' correct' : ' empty'}`}>
                    {d}
                    {g.feedback[di] === 'correct' && <span className="cell-mark">&#9632;</span>}
                  </div>
                ))}
              </div>
            ))}

            {playing && Array.from({ length: maxGuesses - guesses.length }).map((_, i) => (
              <div key={`e-${i}`} className="digit-row">
                {Array.from({ length: len }).map((_, di) => (
                  <div key={di} className="digit-cell empty" />
                ))}
              </div>
            ))}
          </div>

          {playing && (
            <form onSubmit={handleSubmit}>
              <div className="digit-input-row" aria-label="Enter guess digits">
                {Array.from({ length: len }).map((_, i) => (
                  <input
                    key={i}
                    ref={el => inputRefs.current[i] = el}
                    type="text"
                    inputMode="numeric"
                    className="digit-input-cell"
                    value={inputDigits[i]}
                    onChange={(e) => handleInputChange(i, e)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onFocus={handleFocus}
                    maxLength={2}
                    aria-label={`Digit ${i + 1}`}
                  />
                ))}
              </div>
              <div className="digit-guess-submit">
                <button id="digit-guess-btn" type="submit" className="btn">Guess</button>
              </div>
            </form>
          )}

          {!playing && (
            <div className="restart-row">
              <button id="digit-restart-btn" className="btn" onClick={onRestart}>Play Again</button>
            </div>
          )}
        </>
      )}
    </>
  )
}
