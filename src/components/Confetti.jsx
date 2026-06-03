import { useEffect, useRef } from 'react'

const COLORS = [
  '#e63946', '#2a9d8f', '#e9c46a', '#457b9d',
  '#f4a261', '#6d6875', '#b5e48c', '#90e0ef',
  '#f72585', '#4cc9f0', '#ff9f1c', '#cbf3f0',
]

export default function Confetti({ active }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!active) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()

    // Two bursts: center and slightly offset
    const particles = Array.from({ length: 130 }, (_, i) => {
      const angle  = (Math.random() * Math.PI * 2)
      const speed  = Math.random() * 8 + 3
      const side   = i < 65 ? canvas.width * 0.35 : canvas.width * 0.65
      return {
        x:     side,
        y:     canvas.height * 0.4,
        w:     Math.random() * 10 + 5,
        h:     Math.random() * 5 + 3,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        vx:    Math.cos(angle) * speed,
        vy:    Math.sin(angle) * speed - 6,
        rot:   Math.random() * Math.PI * 2,
        rotV:  (Math.random() - 0.5) * 0.25,
        alpha: 1,
      }
    })

    const start = performance.now()
    let raf

    function draw(now) {
      const elapsed = now - start
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      let any = false

      for (const p of particles) {
        p.x   += p.vx
        p.y   += p.vy
        p.vy  += 0.22   // gravity
        p.vx  *= 0.99   // air resistance
        p.rot += p.rotV
        if (elapsed > 1800) p.alpha = Math.max(0, p.alpha - 0.016)

        if (p.y < canvas.height + 40 && p.alpha > 0) {
          any = true
          ctx.save()
          ctx.translate(p.x, p.y)
          ctx.rotate(p.rot)
          ctx.globalAlpha = p.alpha
          ctx.fillStyle = p.color
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
          ctx.restore()
        }
      }

      if (any && elapsed < 4000) raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [active])

  if (!active) return null

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  )
}
