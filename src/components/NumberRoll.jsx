import { useState, useEffect, useRef } from 'react'

/**
 * Rapidly cycles through random numbers then calls onDone.
 * min/max control the display range shown while rolling.
 */
export default function NumberRoll({ onDone, min = 1, max = 100, label = 'Generating number...' }) {
  const [num, setNum] = useState(() =>
    Math.floor(Math.random() * (max - min + 1)) + min
  )
  const doneRef = useRef(false)

  useEffect(() => {
    doneRef.current = false

    const interval = setInterval(() => {
      setNum(Math.floor(Math.random() * (max - min + 1)) + min)
    }, 55)

    // After 1s slow it down then call done
    const slowTimer = setTimeout(() => {
      clearInterval(interval)
      // Slow flicker for 300ms then stop
      let ticks = 0
      const slowInterval = setInterval(() => {
        setNum(Math.floor(Math.random() * (max - min + 1)) + min)
        ticks++
        if (ticks >= 5) {
          clearInterval(slowInterval)
          if (!doneRef.current) {
            doneRef.current = true
            onDone()
          }
        }
      }, 80)
    }, 900)

    return () => {
      doneRef.current = true
      clearInterval(interval)
      clearTimeout(slowTimer)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Pad display to avoid layout shifts
  const display = String(num).padStart(String(max).length, ' ')

  return (
    <div className="generating-box">
      <div className="generating-number" aria-live="polite" aria-atomic="true">
        {display}
      </div>
      <div className="generating-label">{label}</div>
    </div>
  )
}
