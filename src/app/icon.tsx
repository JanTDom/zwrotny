import { ImageResponse } from 'next/og'

export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

export default function Icon() {
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
          borderRadius: 80,
        }}
      >
        <span
          style={{
            color: 'white',
            fontSize: 280,
            fontWeight: 700,
            fontFamily: 'sans-serif',
            letterSpacing: '-8px',
          }}
        >
          Z
        </span>
      </div>
    ),
    { ...size }
  )
}
