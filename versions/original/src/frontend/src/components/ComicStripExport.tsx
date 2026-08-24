import type { StoryWalkStep, StoryTheme, StoryArtStyle } from '../types';

interface ComicStripExportProps {
  theme: StoryTheme;
  artStyle: StoryArtStyle;
  characterAName: string;
  steps: StoryWalkStep[];               // 4 步：root + A + A.B + A.B.C
}

// 离屏渲染的纵向连环画，用于 html-to-image 长图导出
export function ComicStripExport({ theme, artStyle, characterAName, steps }: ComicStripExportProps) {
  return (
    <div
      id="comic-strip-export"
      style={{
        position: 'absolute',
        left: '-99999px',
        top: 0,
        width: 720,
        background: '#0e0e10',
        color: '#fdfaf2',
        fontFamily: '"PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif',
        padding: 24,
      }}
    >
      <header style={{ textAlign: 'center', padding: '12px 0 20px' }}>
        <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: 4 }}>咔嚓剧场 · 互动剧情</div>
        <div style={{ fontSize: 16, opacity: 0.7, marginTop: 8 }}>
          {theme} · {artStyle} · 主角光环 vs {characterAName}
        </div>
      </header>

      {steps.map((step, idx) => (
        <div key={step.pathKey} style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 14, opacity: 0.6, marginBottom: 8 }}>
            第 {idx + 1} 幕 / 路径 {step.pathKey}
          </div>
          <img
            src={step.node.imageUrl}
            crossOrigin="anonymous"
            style={{ width: '100%', borderRadius: 12, display: 'block' }}
            alt=""
          />
          <div style={{ marginTop: 12, fontSize: 18, lineHeight: 1.7 }}>{step.node.narration}</div>
          {step.node.characterLine && (
            <div style={{ marginTop: 8, fontSize: 16, opacity: 0.85, fontStyle: 'italic' }}>
              「{step.node.characterLine}」
            </div>
          )}
          {step.chosen && step.node.choices && (
            <div style={{ marginTop: 10, fontSize: 14, color: '#f0c869' }}>
              → 我选了：{step.node.choices.find((c) => c.id === step.chosen)?.text}
            </div>
          )}
        </div>
      ))}

      {steps.length > 0 && steps[steps.length - 1].node.ending && (
        <div style={{
          padding: 24, borderRadius: 16,
          background: steps[steps.length - 1].node.ending!.aWins ? '#3b2c1a' : '#1a2e3b',
          border: '1px solid rgba(240,200,105,.4)', marginTop: 12,
        }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#f0c869', marginBottom: 10 }}>
            【{steps[steps.length - 1].node.ending!.type}】
            {steps[steps.length - 1].node.ending!.aWins ? ` · ${characterAName} 翻身` : ' · 我的主场'}
          </div>
          <div style={{ fontSize: 18, lineHeight: 1.7 }}>
            {steps[steps.length - 1].node.ending!.verdict}
          </div>
        </div>
      )}

      <footer style={{ textAlign: 'center', marginTop: 24, opacity: 0.5, fontSize: 12 }}>
        © 咔嚓剧场 · Generated on {new Date().toLocaleDateString()}
      </footer>
    </div>
  );
}
