import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'ZWROTNY.pl - System kaucyjny bez nudy'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1a5c2a',
        }}
      >
        <span
          style={{
            color: 'white',
            fontSize: 120,
            fontWeight: 700,
            fontFamily: 'sans-serif',
            letterSpacing: '-3px',
          }}
        >
          ZWROTNY.pl
        </span>
        <span
          style={{
            color: 'rgba(255,255,255,0.75)',
            fontSize: 42,
            fontFamily: 'sans-serif',
            marginTop: 20,
          }}
        >
          System kaucyjny bez nudy
        </span>
      </div>
    ),
    { ...size }
  )
}
