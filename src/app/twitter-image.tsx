import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'wwew.tech | Full-Stack Developer';
export const size = {
  width: 1200,
  height: 600,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#050505',
          backgroundImage: 'radial-gradient(circle at 25% 25%, #111 0%, transparent 50%), radial-gradient(circle at 75% 75%, #0a0a0a 0%, transparent 50%)',
        }}
      >
        {/* Accent glow */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(181, 255, 109, 0.15) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />
        
        {/* Logo */}
        <div
          style={{
            fontSize: '72px',
            fontWeight: 700,
            color: '#ededed',
            letterSpacing: '-2px',
            marginBottom: '30px',
          }}
        >
          wwew
          <span style={{ color: '#B5FF6D' }}>.tech</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: '32px',
            color: '#888888',
          }}
        >
          Full-Stack Developer
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
