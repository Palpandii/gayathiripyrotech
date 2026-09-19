import { useEffect, useRef } from 'react'

const COLORS = ['#ff2d78', '#ffd166', '#8b5cf6', '#22d3ee', '#f97316', '#4ade80']

function rand(min, max) {
    return Math.random() * (max - min) + min
}

class Particle {
    constructor(x, y, color) {
        this.x = x
        this.y = y
        this.color = color
        const angle = rand(0, Math.PI * 2)
        const speed = rand(1.5, 6)
        this.vx = Math.cos(angle) * speed
        this.vy = Math.sin(angle) * speed
        this.alpha = 1
        this.decay = rand(0.008, 0.02)
        this.gravity = 0.04
        this.size = rand(1.5, 3)
    }

    update() {
        this.vy += this.gravity
        this.vx *= 0.99
        this.vy *= 0.99
        this.x += this.vx
        this.y += this.vy
        this.alpha -= this.decay
    }

    draw(ctx) {
        if (this.alpha <= 0) return
        ctx.save()
        ctx.globalAlpha = Math.max(this.alpha, 0)
        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
    }
}

class Rocket {
    constructor(width, height) {
        this.x = rand(width * 0.1, width * 0.9)
        this.y = height
        this.targetY = rand(height * 0.15, height * 0.5)
        this.color = COLORS[Math.floor(rand(0, COLORS.length))]
        this.speed = rand(4, 7)
        this.exploded = false
    }

    update() {
        this.y -= this.speed
    }

    draw(ctx) {
        ctx.save()
        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
    }
}

export default function FireworksOverlay({ intervalMs = 900, particleCount = 55 }) {
    const canvasRef = useRef(null)

    useEffect(() => {
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        let width = (canvas.width = window.innerWidth)
        let height = (canvas.height = window.innerHeight)

        let rockets = []
        let particles = []
        let rafId
        let spawnTimer

        function handleResize() {
            width = canvas.width = window.innerWidth
            height = canvas.height = window.innerHeight
        }
        window.addEventListener('resize', handleResize)

        function spawnRocket() {
            rockets.push(new Rocket(width, height))
        }
        spawnTimer = setInterval(spawnRocket, intervalMs)
        spawnRocket()

        function loop() {
            ctx.clearRect(0, 0, width, height)

            rockets = rockets.filter((r) => {
                r.update()
                r.draw(ctx)
                if (r.y <= r.targetY) {
                    for (let i = 0; i < particleCount; i++) {
                        particles.push(new Particle(r.x, r.y, r.color))
                    }
                    return false
                }
                return true
            })

            particles = particles.filter((p) => {
                p.update()
                p.draw(ctx)
                return p.alpha > 0
            })

            rafId = requestAnimationFrame(loop)
        }
        loop()

        return () => {
            cancelAnimationFrame(rafId)
            clearInterval(spawnTimer)
            window.removeEventListener('resize', handleResize)
        }
    }, [intervalMs, particleCount])

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                pointerEvents: 'none',
                zIndex: 9999,
            }}
            aria-hidden="true"
        />
    )
}