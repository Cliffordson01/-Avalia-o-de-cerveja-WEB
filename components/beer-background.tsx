"use client"

import { useEffect, useRef } from 'react'

export function BeerBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Função para detectar o tema atual
    const getCurrentTheme = (): 'light' | 'dark' | 'fresh' => {
      if (document.documentElement.classList.contains('dark')) return 'dark'
      if (document.documentElement.classList.contains('fresh')) return 'fresh'
      return 'light'
    }

    // Configurar canvas
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Bolhas de cerveja
    class Bubble {
      x: number
      y: number
      radius: number
      speed: number
      opacity: number
      color: string
      currentTheme: string

      constructor(canvasWidth: number, canvasHeight: number) {
        this.x = Math.random() * canvasWidth
        this.y = canvasHeight + Math.random() * 100
        this.radius = Math.random() * 20 + 5
        this.speed = Math.random() * 2 + 1
        this.opacity = Math.random() * 0.3 + 0.1
        this.currentTheme = getCurrentTheme()
        this.color = this.getBubbleColor()
      }

      getBubbleColor(): string {
        switch (this.currentTheme) {
          case 'light':
            return `rgba(245, 192, 68, ${this.opacity})` // Amarelo cerveja do tema light
          case 'fresh':
            return `rgba(56, 189, 248, ${this.opacity})` // Azul do tema fresh
          case 'dark':
          default:
            return `rgba(255, 193, 7, ${this.opacity})` // Amarelo original
        }
      }

      update(canvasWidth: number, canvasHeight: number) {
        this.y -= this.speed
        if (this.y < -this.radius) {
          this.y = canvasHeight + this.radius
          this.x = Math.random() * canvasWidth
        }
        // Atualizar cor se o tema mudou
        const newTheme = getCurrentTheme()
        if (newTheme !== this.currentTheme) {
          this.currentTheme = newTheme
          this.color = this.getBubbleColor()
        }
      }

      draw(context: CanvasRenderingContext2D) {
        context.beginPath()
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
        context.fillStyle = this.color
        context.fill()
        
        // Brilho da bolha
        context.beginPath()
        context.arc(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.3, 0, Math.PI * 2)
        context.fillStyle = `rgba(255, 255, 255, ${this.opacity * 0.5})`
        context.fill()
      }
    }

    // Criar bolhas
    const bubbles: Bubble[] = []
    for (let i = 0; i < 30; i++) {
      bubbles.push(new Bubble(canvas.width, canvas.height))
    }

    // Função para obter gradiente baseado no tema
    const getBackgroundGradient = (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      const gradient = context.createLinearGradient(0, 0, 0, canvas.height)
      const theme = getCurrentTheme()

      switch (theme) {
        case 'light':
          gradient.addColorStop(0, '#fef7e6') // beer-100
          gradient.addColorStop(0.5, '#fdecc2') // beer-200
          gradient.addColorStop(1, '#fbdf8e') // beer-300
          break
        case 'fresh':
          gradient.addColorStop(0, '#e0f2fe') // sky-100
          gradient.addColorStop(0.5, '#bae6fd') // sky-200
          gradient.addColorStop(1, '#7dd3fc') // sky-300
          break
        case 'dark':
        default:
          gradient.addColorStop(0, '#7c2d12')
          gradient.addColorStop(0.5, '#9a3412')
          gradient.addColorStop(1, '#c2410c')
      }
      
      return gradient
    }

    // Observar mudanças de tema
    const observer = new MutationObserver(() => {
      // As bolhas já atualizam automaticamente no loop de animação
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    // Animação
    const animate = () => {
      if (!ctx || !canvas) return
      
      // Limpar com gradiente baseado no tema atual
      const gradient = getBackgroundGradient(ctx, canvas)
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Atualizar e desenhar bolhas
      bubbles.forEach(bubble => {
        bubble.update(canvas.width, canvas.height)
        bubble.draw(ctx)
      })

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      observer.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full -z-10 pointer-events-none transition-colors duration-300"
    />
  )
}