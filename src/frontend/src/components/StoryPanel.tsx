import { StoryNode, PanelSpec, StoryChoice } from '../types';
import { Loader2 } from 'lucide-react';

interface StoryPanelProps {
  /** 当前显示的分镜（intro panel 或互动 node） */
  panel: PanelSpec | StoryNode;
  /** 当前数值，用于底部条 */
  stats: Record<string, number>;
  /** 是否是带选项的节点 */
  isNode: boolean;
  /** 图片是否还在生成中 */
  imageLoading: boolean;
  /** 节点进度提示，例如 "1 / 3" */
  progressLabel?: string;
  /** 选项点击 */
  onChoose?: (choice: StoryChoice, index: number) => void;
  /** intro 页的"开始"按钮 */
  onStart?: () => void;
}

export function StoryPanel({
  panel,
  stats,
  isNode,
  imageLoading,
  progressLabel,
  onChoose,
  onStart,
}: StoryPanelProps) {
  const node = isNode ? (panel as StoryNode) : null;
  const hasImage = !!panel.imageUrl && !imageLoading;

  return (
    <div className="flex flex-col w-full flex-1 min-h-0 bg-[#1d1916] overflow-hidden">
      {/* ===== 1. 进度条 ===== */}
      {progressLabel && (
        <div className="absolute top-12 right-3 z-30 bg-black/40 backdrop-blur-sm border border-[#f0c869]/40 px-2.5 py-0.5 rounded-full">
          <span
            className="text-[10px] font-bold text-[#f0c869] tracking-widest font-serif"
            style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}
          >
            {progressLabel}
          </span>
        </div>
      )}

      {/* ===== 2. 主分镜插画区 ===== */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#2a1f1a] via-[#1d1916] to-[#0e0c0a]">
        {hasImage ? (
          <img
            src={panel.imageUrl!}
            alt="story panel"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover animate-panel-fade"
          />
        ) : (
          <PanelLoadingState />
        )}

        {/* 顶部旁白带 */}
        {panel.narration && (
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/85 via-black/60 to-transparent px-5 pt-5 pb-10 z-20">
            <p
              className="text-[#fdfaf2] text-[13px] leading-relaxed font-serif drop-shadow-md"
              style={{ fontFamily: "'STKaiti', 'Kaiti', serif", textShadow: '0 2px 6px rgba(0,0,0,0.85)' }}
            >
              {panel.narration}
            </p>
          </div>
        )}

        {/* 底部角色对白带 */}
        {panel.characterLine && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent px-5 pt-10 pb-5 z-20">
            <div className="bg-[#d4222b]/95 border border-[#f0c869] rounded-r-2xl rounded-tl-2xl px-4 py-2.5 max-w-[88%]">
              <p
                className="text-[#fdfaf2] text-[14px] font-bold leading-relaxed font-serif"
                style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}
              >
                「{panel.characterLine}」
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ===== 3. 数值条 ===== */}
      <div className="shrink-0 bg-[#0e0c0a] border-t border-[#3a2f24] px-4 py-2 flex items-center justify-around gap-2">
        {Object.entries(stats).map(([name, value]) => (
          <div key={name} className="flex flex-col items-center min-w-0 flex-1">
            <span
              className="text-[9px] text-[#b39e70] font-serif tracking-wide truncate"
              style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}
            >
              {name}
            </span>
            <span className="text-sm font-bold text-[#f0c869] font-mono mt-0.5">{value}</span>
          </div>
        ))}
      </div>

      {/* ===== 4. 选项 / 开始按钮 ===== */}
      <div className="shrink-0 bg-[#1d1916] border-t border-[#3a2f24] p-4 flex flex-col gap-2.5">
        {isNode && node && onChoose ? (
          <>
            <div className="text-[10px] text-[#b39e70] font-serif text-center mb-1 tracking-widest">
              · 御史请定夺 ·
            </div>
            {node.choices.map((c, i) => (
              <button
                key={i}
                onClick={() => onChoose(c, i)}
                disabled={imageLoading}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-[#2a2520] to-[#3a2f24] border border-[#f0c869]/50 rounded-xl text-[#fdfaf2] text-sm font-bold tracking-wider text-left hover:border-[#f0c869] hover:from-[#3a2f24] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-between font-serif"
                style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}
              >
                <span>{c.label}</span>
                <ChoiceStatPreview delta={c.statDelta} />
              </button>
            ))}
          </>
        ) : onStart ? (
          <button
            onClick={onStart}
            disabled={imageLoading}
            className="w-full py-3.5 bg-[#d4222b] hover:bg-[#b01c23] text-white rounded-full font-bold text-sm tracking-widest disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all shadow-lg"
            style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}
          >
            {imageLoading ? '御史落墨中...' : '✒ 入卷'}
          </button>
        ) : null}
      </div>

      <style>{`
        @keyframes panelFade {
          from { opacity: 0; transform: scale(1.04); }
          to   { opacity: 1; transform: scale(1); }
        }
        .animate-panel-fade { animation: panelFade 0.6s ease-out; }
      `}</style>
    </div>
  );
}

function ChoiceStatPreview({ delta }: { delta: Record<string, number> }) {
  const entries = Object.entries(delta);
  if (entries.length === 0) return null;
  return (
    <span className="flex items-center gap-1 text-[10px] font-mono shrink-0 ml-2">
      {entries.slice(0, 2).map(([name, v]) => (
        <span
          key={name}
          className={`px-1.5 py-0.5 rounded ${v > 0 ? 'bg-emerald-900/50 text-emerald-300' : 'bg-rose-900/50 text-rose-300'}`}
        >
          {name.slice(0, 2)}
          {v > 0 ? '+' : ''}
          {v}
        </span>
      ))}
    </span>
  );
}

function PanelLoadingState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-8 text-center">
      <div className="relative">
        <Loader2 size={42} className="animate-spin text-[#f0c869]" />
        <div className="absolute inset-0 rounded-full bg-[#f0c869]/20 blur-xl animate-pulse" />
      </div>
      <p
        className="text-[#f0c869] text-sm font-serif tracking-widest animate-pulse"
        style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}
      >
        御史落墨中...
      </p>
      <p className="text-[#7a6748] text-[10px] font-mono tracking-wider">
        AI 正在绘制本帧分镜，请稍候
      </p>
    </div>
  );
}
