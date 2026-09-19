// Uploaded product videos live on Cloudinary. Phones often record HEVC/.mov
// files that some browsers can't play, so we ask Cloudinary for a plain
// H.264 .mp4 copy (also lighter on mobile data). If that copy isn't ready or
// fails, <ProductVideo> falls back to the original file.
export function playableVideoUrl(url) {
    if (!url || !url.includes('res.cloudinary.com') || !url.includes('/video/upload/')) return url
    return url
        .replace('/video/upload/', '/video/upload/vc_h264,q_auto/')
        .replace(/\.[a-z0-9]+$/i, '.mp4')
}