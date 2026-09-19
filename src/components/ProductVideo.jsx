import { useState } from 'react'
import { playableVideoUrl } from '../utils/video.js'

// Normal <video> player (same look as a video in the phone gallery) for
// videos the admin uploaded directly, as opposed to YouTube embeds.
export default function ProductVideo({ src, className }) {
    const [useOriginal, setUseOriginal] = useState(false)
    const url = useOriginal ? src : playableVideoUrl(src)

    return (
        <video
            className={className}
            src={url}
            controls
            playsInline
            preload="metadata"
            onError={() => {
                if (!useOriginal && url !== src) setUseOriginal(true)
            }}
        />
    )
}