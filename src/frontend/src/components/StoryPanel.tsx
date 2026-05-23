import { StoryNode, PanelSpec, StoryChoice, ChoiceStrategy, YijiMatch } from '../types';
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
  /** Part 2 宜忌命中（用于底部计数） */
  yiHits?: number;
  jiHits?: number;
  /** 选项点击 */
  onChoose?: (choice: StoryChoice, index: number) => void;
  /** intro 页的"开始"按钮 */
  onStart?: () => void;
}

const STRATEGY_BADGE: Record<ChoiceStrategy, { label: string; cls: string }> = {
  '顺应天命': { label: '顺', cls: 'bg-emerald-900/60 text-emerald-300 border-emerald-700/60' },
  '逆天而行': { label: '逆', cls: 'bg-rose-900/60 text-rose-300 border-rose-700/60' },
  '中立观望': { label: '中', cls: 'bg-amber-900/60 text-amber-300 border-amber-700/60' },
};

const YIJI_BADGE: Record<YijiMatch, { label: string; cls: string }> = {
  yi: { label: '宜', cls: 'bg-[#f0c869]/15 text-[#f0c869] border-[#f0c869]/60' },
  ji: { label: '忌', cls: 'bg-[#d4222b]/20 text-[#ff8a8a] border-[#d4222b]/70' },
  neutral: { label: '·', cls: 'bg-white/5 text-[#b39e70] border-[#3a2f24]' },
};

export function StoryPanel({
  panel,
  stats,
  isNode,
  imageLoading,
  progressLabel,
  yiHits,
  jiHits,
  onChoose,
  onStart,
}: StoryPanelProps) {
  const node = isNode ? (panel as StoryNode) : null;
  const hasImage = !!panel.imageUrl && !imageLoading;
  const sceneTitle = node?.sceneTitle;

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

        {/* 场景标题（仅 node 有） */}
        {sceneTitle && (
          <div className="absolute top-3 left-3 z-20 bg-[#d4222b] border border-[#f0c869] rounded-r-full rounded-tl-full px-3 py-1">
            <span
              className="text-[11px] font-bold text-[#fdfaf2] tracking-widest font-serif"
              style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}
            >
              {sceneTitle}
            </span>
          </div>
        )}

        {/* 顶部旁白带 */}
        {panel.narration && (
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/85 via-black/60 to-transparent px-5 pt-5 pb-10 z-10">
            <p
              className={`text-[#fdfaf2] text-[13px] leading-relaxed font-serif drop-shadow-md ${sceneTitle ? 'mt-7' : ''}`}
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

      {/* ===== 3. 宜忌命中条 + 数值条 ===== */}
      <div className="shrink-0 bg-[#0e0c0a] border-t border-[#3a2f24] px-3 py-1.5 flex items-center justify-between gap-2">
        {/* 左：宜忌命中 */}
        {(yiHits !== undefined || jiHits !== undefined) && (
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#f0c869]/15 border border-[#f0c869]/60">
              <span
                className="text-[10px] font-bold text-[#f0c869] font-serif"
                style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}
              >
                宜
              </span>
              <span className="text-xs font-bold text-[#f0c869] font-mono">{yiHits ?? 0}</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#d4222b]/20 border border-[#d4222b]/70">
              <span
                className="text-[10px] font-bold text-[#ff8a8a] font-serif"
                style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}
              >
                忌
              </span>
              <span className="text-xs font-bold text-[#ff8a8a] font-mono">{jiHits ?? 0}</span>
            </div>
          </div>
        )}

        {/* 右：原有数值（紧凑展示） */}
        <div className="flex items-center gap-2 min-w-0 overflow-x-auto">
          {Object.entries(stats).map(([name, value]) => (
            <div key={name} className="flex items-center gap-1 shrink-0">
              <span
                className="text-[9px] text-[#b39e70] font-serif"
                style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}
              >
                {name}
              </span>
              <span className="text-xs font-bold text-[#f0c869] font-mono">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ===== 4. 选项 / 开始按钮 ===== */}
      <div className="shrink-0 bg-[#1d1916] border-t border-[#3a2f24] p-3 flex flex-col gap-2">
        {isNode && node && onChoose ? (
          <>
            <div className="text-[10px] text-[#b39e70] font-serif text-center mb-0.5 tracking-widest">
              · 御史请定夺 ·
            </div>
            {node.choices.map((c, i) => (
              <ChoiceButton
                key={i}
                choice={c}
                disabled={imageLoading}
                onClick={() => onChoose(c, i)}
              />
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

function ChoiceButton({
  choice,
  disabled,
  onClick,
}: {
  choice: StoryChoice;
  disabled: boolean;
  onClick: () => void;
}) {
  const strategy = choice.strategy;
  const yiji = choice.yijiMatch;
  const strategyBadge = strategy ? STRATEGY_BADGE[strategy] : null;
  const yijiBadge = yiji ? YIJI_BADGE[yiji] : null;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full px-3 py-2.5 bg-gradient-to-r from-[#2a2520] to-[#3a2f24] border border-[#f0c869]/50 rounded-xl text-[#fdfaf2] text-sm font-bold tracking-wide text-left hover:border-[#f0c869] hover:from-[#3a2f24] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 font-serif"
      style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}
    >
      {/* 策略色标 */}
      {strategyBadge && (
        <span
          className={`shrink-0 w-7 h-7 rounded-full border text-[12px] font-black flex items-center justify-center ${strategyBadge.cls}`}
          title={strategy ?? ''}
        >
          {strategyBadge.label}
        </span>
      )}
      <span className="flex-1 min-w-0 leading-snug">{choice.label}</span>
      {/* 宜忌标签 */}
      {yijiBadge && (
        <span
          className={`shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-mono ${yijiBadge.cls}`}
        >
          <span
            className="font-serif font-black"
            style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}
          >
            {yijiBadge.label}
          </span>
          {choice.yijiKeyword && (
            <span className="font-serif" style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}>
              {choice.yijiKeyword}
            </span>
          )}
        </span>
      )}
    </button>
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
