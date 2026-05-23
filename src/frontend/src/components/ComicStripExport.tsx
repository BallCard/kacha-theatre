import { PanelSpec, StoryNode, EndingSpec } from '../types';

interface ComicStripExportProps {
  themeName: string;
  protagonistName?: string;         // 玩家自定义的主角名字，落款用
  introPanel: PanelSpec;
  visitedNodes: StoryNode[];        // 玩家实际走过的节点（按时间序）
  visitedChoiceLabels: string[];    // 与 visitedNodes 等长，记录每个节点最终选了哪个选项
  ending: EndingSpec;
  finalStats: Record<string, number>;
}

/**
 * 用于 html-to-image 截图的长条连环画：
 * 每页是一帧分镜（图 + 旁白 + 对白 + 玩家选择），最后接结局卡。
 *
 * 该组件渲染到离屏位置（opacity:0 + 绝对定位），平时不可见，截图时也不需要展示给用户。
 */
export function ComicStripExport({
  themeName,
  protagonistName,
  introPanel,
  visitedNodes,
  visitedChoiceLabels,
  ending,
  finalStats,
}: ComicStripExportProps) {
  const totalPages = 1 + visitedNodes.length + 1; // intro + nodes + ending

  return (
    <div
      id="printable-comic-strip"
      className="bg-[#f5efe1] text-[#2a2830] select-none"
      style={{
        width: 720,
        padding: 28,
        boxSizing: 'border-box',
        backgroundImage: 'radial-gradient(#eedca2 0.8px, transparent 0.8px)',
        backgroundSize: '24px 24px',
      }}
    >
      {/* 顶部封面条 */}
      <div className="border-[8px] border-[#d4222b] rounded-2xl p-5 mb-5 bg-white/40 text-center relative overflow-hidden">
        <div className="absolute top-1 left-1 w-5 h-5 border-t-2 border-l-2 border-[#f0c869]" />
        <div className="absolute top-1 right-1 w-5 h-5 border-t-2 border-r-2 border-[#f0c869]" />
        <div className="absolute bottom-1 left-1 w-5 h-5 border-b-2 border-l-2 border-[#f0c869]" />
        <div className="absolute bottom-1 right-1 w-5 h-5 border-b-2 border-r-2 border-[#f0c869]" />
        <div className="text-[10px] font-mono tracking-[0.4em] text-[#85744f] font-bold mb-1">
          IMPERIAL · STORY · COMIC
        </div>
        <h1
          className="text-3xl font-black text-[#d4222b] tracking-[0.2em] font-serif"
          style={{ fontFamily: "'STKaiti', 'Kaiti', 'STSong', serif" }}
        >
          {themeName} · 全本
        </h1>
        {protagonistName && (
          <p
            className="text-sm text-[#2a2830] mt-2 font-serif tracking-wider"
            style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}
          >
            主 角 · {protagonistName}
          </p>
        )}
        <p
          className="text-xs text-[#85744f] mt-2 font-serif"
          style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}
        >
          甲辰年 · 共 {totalPages} 卷
        </p>
      </div>

      {/* 第 1 页：开篇 */}
      <ComicPage
        pageIndex={0}
        totalPages={totalPages}
        label="开 篇"
        panel={introPanel}
      />

      {/* 中间页：玩家走过的互动节点 */}
      {visitedNodes.map((node, i) => (
        <ComicPage
          key={node.id}
          pageIndex={i + 1}
          totalPages={totalPages}
          label={`第 ${i + 1} 卷`}
          panel={node}
          choiceLabel={visitedChoiceLabels[i]}
        />
      ))}

      {/* 最后一页：结局 */}
      <ComicPage
        pageIndex={totalPages - 1}
        totalPages={totalPages}
        label={`结 · ${ending.title}`}
        panel={ending}
        isEnding
      />

      {/* 数值面板 */}
      <div className="bg-[#fdfaf2] border border-[#dfd9bf] rounded-2xl p-4 mt-2 mb-4">
        <div className="text-[10px] font-bold text-[#85744f] uppercase tracking-[0.3em] font-mono mb-3 text-center">
          ⚖ 最 终 御 评
        </div>
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(finalStats).map(([name, value]) => (
            <div
              key={name}
              className="flex flex-col items-center bg-white/70 rounded-xl py-3 border border-[#e8dfc7]"
            >
              <span
                className="text-xs text-[#85744f] font-serif"
                style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}
              >
                {name}
              </span>
              <span className="text-2xl font-bold text-[#d4222b] font-mono mt-0.5">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 落款 */}
      <div className="flex items-center justify-between pt-4 border-t border-dashed border-[#dcbca0]">
        <div className="flex flex-col text-left">
          <span className="text-[10px] font-semibold text-[#8a8a8a] uppercase font-mono tracking-wider">
            Imperial Story Engine · Full Album
          </span>
          <span
            className="text-[11px] text-[#b39e70] font-serif font-bold mt-0.5"
            style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}
          >
            御 史 台 · 全 本 摹 印 · 甲 辰 年
          </span>
        </div>
        <div className="w-14 h-14 border-2 border-red-600 rounded flex items-center justify-center font-serif text-xs font-black leading-tight text-red-600 -rotate-6 px-1 py-0.5 shadow-xs text-center">
          御史
          <br />
          监印
        </div>
      </div>
    </div>
  );
}

function ComicPage({
  pageIndex,
  totalPages,
  label,
  panel,
  choiceLabel,
  isEnding,
}: {
  pageIndex: number;
  totalPages: number;
  label: string;
  panel: PanelSpec | StoryNode | EndingSpec;
  choiceLabel?: string;
  isEnding?: boolean;
}) {
  const title = isEnding ? (panel as EndingSpec).title : undefined;

  return (
    <div className={`mb-5 rounded-2xl border-4 ${isEnding ? 'border-[#d4222b]' : 'border-[#e8dfc7]'} bg-white/60 overflow-hidden shadow-sm`}>
      {/* 页眉 */}
      <div className="flex items-center justify-between bg-[#d4222b] text-[#fdfaf2] px-4 py-2">
        <span
          className="text-sm font-bold tracking-widest font-serif"
          style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}
        >
          {label}
        </span>
        <span className="text-[10px] font-mono tracking-widest opacity-90">
          P {pageIndex + 1} / {totalPages}
        </span>
      </div>

      {/* 图像 */}
      <div className="relative w-full bg-[#0e0c0a]" style={{ aspectRatio: '3 / 4' }}>
        {panel.imageUrl ? (
          <img
            src={panel.imageUrl}
            alt={label}
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[#b39e70] text-sm font-serif">
            （御史落墨中，本卷尚未生成）
          </div>
        )}

        {/* 旁白条 */}
        {panel.narration && (
          <div
            className="absolute top-0 left-0 right-0 px-4 pt-3 pb-6"
            style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.85), transparent)' }}
          >
            <p
              className="text-[#fdfaf2] text-sm leading-relaxed font-serif"
              style={{ fontFamily: "'STKaiti', 'Kaiti', serif", textShadow: '0 2px 6px rgba(0,0,0,0.85)' }}
            >
              {panel.narration}
            </p>
          </div>
        )}

        {/* 对白气泡 */}
        {'characterLine' in panel && panel.characterLine && (
          <div
            className="absolute bottom-0 left-0 right-0 px-4 pt-8 pb-4"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)' }}
          >
            <div className="inline-block bg-[#d4222b] border border-[#f0c869] rounded-r-2xl rounded-tl-2xl px-3 py-1.5 max-w-[88%]">
              <p
                className="text-[#fdfaf2] text-sm font-bold font-serif"
                style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}
              >
                「{panel.characterLine}」
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 选择记录条（仅互动节点） */}
      {choiceLabel && (
        <div className="px-4 py-2.5 bg-[#fdfaf2] border-t border-[#e8dfc7] flex items-center gap-2">
          <span className="text-[10px] font-bold text-[#85744f] tracking-widest font-mono shrink-0">
            御 笔 定 夺 →
          </span>
          <span
            className="text-sm font-bold text-[#2a2830] font-serif"
            style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}
          >
            {choiceLabel}
          </span>
        </div>
      )}

      {/* 结局长文案 */}
      {isEnding && (
        <div className="px-4 py-3 bg-[#fdfaf2] border-t border-[#e8dfc7]">
          {title && (
            <div
              className="text-lg font-black text-[#d4222b] mb-1.5 font-serif tracking-wider text-center"
              style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}
            >
              {title}
            </div>
          )}
          <p
            className="text-xs leading-loose text-[#2a2830] font-serif"
            style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}
          >
            {(panel as EndingSpec).narration}
          </p>
        </div>
      )}
    </div>
  );
}
