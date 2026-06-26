import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1a5c2a',
          borderRadius: 36,
        }}
      >
        <span
          style={{
            color: 'white',
            fontSize: 80,
            fontWeight: 700,
            fontFamily: 'sans-serif',
            letterSpacing: '-2px',
          }}
        >
          Z
        </span>
      </div>
    ),
    { ...size }
  )
}
