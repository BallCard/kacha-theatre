// 「咔嚓」相机快门动画：手伸出 + 快门白闪 + 入梦
import { useEffect, useState } from 'react';

export function CameraShutter({ imageUrl, onDone }: { imageUrl: string; onDone: () => void }) {
  const [phase, setPhase] = useState<'hand' | 'flash' | 'dream'>('hand');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('flash'), 900);
    const t2 = setTimeout(() => setPhase('dream'), 1400);
    const t3 = setTimeout(() => onDone(), 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
      background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <img src={imageUrl} alt="" style={{
        width: '100%', height: '100%', objectFit: 'cover',
        filter: phase === 'dream' ? 'blur(20px) brightness(0.4)' : 'none',
        transition: 'filter .8s ease',
      }} />

      <div style={{
        position: 'absolute', right: 24, bottom: 18,
        fontSize: 12, color: '#fdfaf2', opacity: 0.85,
        background: 'rgba(0,0,0,.4)', padding: '4px 10px', borderRadius: 12,
        fontFamily: 'JetBrains Mono, monospace',
      }}>
        SHUTTER
      </div>

      {/* 手 */}
      <div style={{
        position: 'absolute',
        right: phase === 'hand' ? '-10%' : '50%',
        bottom: phase === 'hand' ? '-30%' : '50%',
        transform: phase === 'hand' ? 'rotate(-25deg)' : 'translate(50%, 50%) rotate(0)',
        width: 200, height: 200, transition: 'all .8s cubic-bezier(.2,.7,.3,1)',
        opacity: phase === 'flash' ? 0 : 0.95, pointerEvents: 'none',
      }}>
        <div style={{
          width: 100, height: 140, background: '#f6d2b0', borderRadius: 24,
          margin: '0 auto', position: 'relative',
          boxShadow: '0 8px 24px rgba(0,0,0,.5)',
        }}>
          {/* 手指 */}
          <div style={{ position: 'absolute', top: -22, left: 18, width: 16, height: 30, background: '#f6d2b0', borderRadius: 8 }} />
          <div style={{ position: 'absolute', top: -28, left: 40, width: 16, height: 36, background: '#f6d2b0', borderRadius: 8 }} />
          <div style={{ position: 'absolute', top: -24, left: 62, width: 16, height: 32, background: '#f6d2b0', borderRadius: 8 }} />
        </div>
      </div>

      {/* 快门白闪 */}
      {phase === 'flash' && (
        <div style={{
          position: 'absolute', inset: 0, background: '#fff',
          animation: 'shutter-flash 480ms ease forwards',
        }} />
      )}

      {/* 「咔嚓」字 */}
      {phase !== 'dream' && (
        <div style={{
          position: 'absolute', top: '40%',
          fontSize: 56, fontWeight: 900, color: '#f0c869',
          textShadow: '0 4px 16px rgba(0,0,0,.7)', letterSpacing: 8,
          opacity: phase === 'flash' ? 1 : 0,
          transition: 'opacity .3s',
        }}>
          咔 · 嚓
        </div>
      )}

      {/* dream 入境提示 */}
      {phase === 'dream' && (
        <div style={{
          position: 'absolute', textAlign: 'center', color: '#fdfaf2',
          padding: 24, fontSize: 18, lineHeight: 1.8, letterSpacing: 2,
          textShadow: '0 2px 12px rgba(0,0,0,.8)',
        }}>
          意识被某种引力扯进去——<br/>
          我闯进了一段不属于我的梦。
        </div>
      )}

      <style>{`
        @keyframes shutter-flash {
          0% { opacity: 0; } 30% { opacity: 1; } 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
