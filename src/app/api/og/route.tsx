import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title') || 'PipelineIQ';
    const subtitle = searchParams.get('subtitle') || 'CRM & Sales Operations Workspace';

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
            backgroundColor: '#030712',
            color: '#f8fafc',
            fontFamily: 'sans-serif',
            padding: '40px 80px',
            position: 'relative',
          }}
        >
          {/* Subtle Grid Background */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              opacity: 0.1,
            }}
          >
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ height: '1px', backgroundColor: '#e2e8f0', width: '100%' }} />
            ))}
          </div>

          {/* Logo container */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              marginBottom: '32px',
            }}
          >
            <div
              style={{
                height: '48px',
                width: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
              }}
            >
              {/* Fake SVG symbol representation */}
              <div style={{ color: '#030712', fontSize: '24px', fontWeight: 'bold' }}>⌘</div>
            </div>
            <span
              style={{
                fontSize: '28px',
                fontWeight: 'bold',
                letterSpacing: '-0.05em',
                background: 'linear-gradient(to right, #ffffff, #94a3b8)',
                backgroundClip: 'text',
              }}
            >
              PipelineIQ
            </span>
          </div>

          {/* Heading */}
          <div
            style={{
              fontSize: '60px',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              textAlign: 'center',
              marginBottom: '16px',
              background: 'linear-gradient(to right, #34d399, #60a5fa)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            {title}
          </div>

          {/* Subheading */}
          <div
            style={{
              fontSize: '24px',
              color: '#94a3b8',
              textAlign: 'center',
              maxWidth: '700px',
              fontWeight: 500,
            }}
          >
            {subtitle}
          </div>

          {/* Details footer */}
          <div
            style={{
              position: 'absolute',
              bottom: '40px',
              display: 'flex',
              justifyContent: 'space-between',
              width: '100%',
              padding: '0 80px',
              fontSize: '14px',
              color: '#64748b',
              fontWeight: 'semibold',
              fontFamily: 'monospace',
            }}
          >
            <span>PIPELINE-IQ.VERCEL.APP</span>
            <span>SECURE SESSION AUTH</span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('OG generation failed:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}
