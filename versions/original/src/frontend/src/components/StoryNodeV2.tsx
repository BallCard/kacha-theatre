// 单个剧情节点渲染（含终幕展示）

import type { StoryNodeResponse, StoryChoiceId } from '../types';
import { resolveImageUrl } from '../services/storyApi';

interface Props {
  node: StoryNodeResponse;
  depth: number;                // 0..3
  characterAName: string;
  onChoose: (id: StoryChoiceId) => void;
  onRestart: () => void;
  onExport: () => void;
}

export function StoryNodeV2({ node, depth, characterAName, onChoose, onRestart, onExport }: Props) {
  const isFinal = !!node.ending;

  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      background: '#0e0e10', color: '#fdfaf2',
    }}>
      {/* 顶部 */}
      <div style={{
        height: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', fontSize: 12, opacity: 0.7, fontFamily: 'JetBrains Mono, monospace',
      }}>
        <span>幕 {depth + 1} / 4</span>
        <span>{node.cacheHit ? '⚡ CACHE' : '✨ FRESH'}</span>
      </div>

      {/* 画面 */}
      <div style={{
        flex: '1 1 auto', minHeight: 0, position: 'relative', overflow: 'hidden',
        margin: '0 14px', borderRadius: 16, background: '#000',
      }}>
        <img
          src={resolveImageUrl(node.imageUrl)}
          alt=""
          crossOrigin="anonymous"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {isFinal && (
          <div style={{
            position: 'absolute', top: 12, left: 12,
            background: node.ending!.aWins ? '#7a5a1f' : '#1f4a7a',
            color: '#fff', padding: '4px 10px', borderRadius: 12,
            fontSize: 12, fontWeight: 700, letterSpacing: 1,
          }}>
            {node.ending!.aWins ? `${characterAName} 翻身` : '我·主场'}
          </div>
        )}
      </div>

      {/* 文案 */}
      <div style={{ padding: '14px 18px 4px', maxHeight: '32%', overflow: 'auto' }}>
        {isFinal && (
          <div style={{ color: '#f0c869', fontSize: 18, fontWeight: 900, marginBottom: 6 }}>
            【{node.ending!.type}】
          </div>
        )}
        <div style={{ fontSize: 15, lineHeight: 1.7 }}>
          {isFinal ? node.ending!.verdict : node.narration}
        </div>
        {!isFinal && node.characterLine && (
          <div style={{ marginTop: 8, fontSize: 14, opacity: 0.8, fontStyle: 'italic' }}>
            「{node.characterLine}」
          </div>
        )}
      </div>

      {/* 选项 / 终幕按钮 */}
      <div style={{ padding: '8px 14px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {!isFinal && node.choices && node.choices.map((c) => (
          <button
            key={c.id}
            onClick={() => onChoose(c.id)}
            style={{
              background: 'rgba(240,200,105,.08)',
              color: '#fdfaf2', border: '1px solid rgba(240,200,105,.4)',
              borderRadius: 10, padding: '12px 14px', textAlign: 'left',
              fontSize: 14, cursor: 'pointer', transition: 'all .15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(240,200,105,.18)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(240,200,105,.08)')}
          >
            <span style={{ color: '#f0c869', marginRight: 8, fontWeight: 700 }}>{c.id}</span>
            {c.text}
          </button>
        ))}
        {isFinal && (
          <>
            <button onClick={onExport} style={btnPrimary}>📥 导出连环画长图</button>
            <button onClick={onRestart} style={btnSecondary}>🔁 换条路重玩</button>
          </>
        )}
      </div>
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  background: '#d4222b', color: '#fff', border: 'none',
  borderRadius: 999, padding: '12px 18px',
  fontSize: 14, fontWeight: 700, cursor: 'pointer',
};
const btnSecondary: React.CSSProperties = {
  background: 'transparent', color: '#fdfaf2',
  border: '1px solid rgba(255,255,255,.3)',
  borderRadius: 999, padding: '12px 18px',
  fontSize: 14, cursor: 'pointer',
};
