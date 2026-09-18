import { useRef, useCallback } from 'react'

export function useClickSound(src = '/sounds/click.mp3') {
    const audioRef = useRef(null)

    if (!audioRef.current) {
        audioRef.current = new Audio(src)
    }

    const play = useCallback(() => {
        const audio = audioRef.current
        audio.currentTime = 0
        audio.play().catch(() => {
            // autoplay restriction la first interaction varaikkum silent-a fail aagum, adha ignore pannunga
        })
    }, [])

    return play
}