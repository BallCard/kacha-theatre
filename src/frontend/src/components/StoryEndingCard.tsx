import { EndingSpec } from '../types';
import { Loader2 } from 'lucide-react';

interface StoryEndingCardProps {
  ending: EndingSpec;
  finalStats: Record<string, number>;
  themeName: string;
  protagonistName?: string;
  imageLoading: boolean;
  // Part 2 增量：宜忌命中数 + 命中关键词
  yiHits?: number;
  jiHits?: number;
  matchedYiKeywords?: string[];
  matchedJiKeywords?: string[];
}

/**
 * 结局纪念图卡：
 * - 顶部：御史风印章 + 结局标题
 * - 中部：写实风结局插画
 * - 下部：旁白结语 + 数值面板
 * - 底部装饰：印章 + 落款
 *
 * 通过 id="printable-ending-card" 暴露给 html-to-image 用作截图节点。
 */
export function StoryEndingCard({
  ending,
  finalStats,
  themeName,
  protagonistName,
  imageLoading,
  yiHits,
  jiHits,
  matchedYiKeywords,
  matchedJiKeywords,
}: StoryEndingCardProps) {
  return (
    <div
      id="printable-ending-card"
      className="w-full flex flex-col bg-[#f5efe1] border-[12px] border-[#d4222b] rounded-3xl overflow-hidden p-5 shadow-xl relative text-[#2a2830] select-none"
      style={{
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
        backgroundImage: 'radial-gradient(#eedca2 0.8px, transparent 0.8px)',
        backgroundSize: '24px 24px',
      }}
    >
      {/* 金边四角装饰 */}
      <div className="absolute top-1 left-1 w-5 h-5 border-t-2 border-l-2 border-[#f0c869] pointer-events-none" />
      <div className="absolute top-1 right-1 w-5 h-5 border-t-2 border-r-2 border-[#f0c869] pointer-events-none" />
      <div className="absolute bottom-1 left-1 w-5 h-5 border-b-2 border-l-2 border-[#f0c869] pointer-events-none" />
      <div className="absolute bottom-1 right-1 w-5 h-5 border-b-2 border-r-2 border-[#f0c869] pointer-events-none" />

      {/* 顶部标题区 */}
      <header className="flex flex-col items-center mb-3 border-b-2 border-double border-[#d4222b] pb-3 text-center">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono tracking-widest text-[#85744f] font-bold">
            ENDING · 御 印
          </span>
        </div>
        {ending.endingType && (
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#d4222b] mb-1.5 shadow-xs">
            <span
              className="text-[11px] font-black text-[#fdfaf2] tracking-[0.3em] font-serif"
              style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}
            >
              ★ {ending.endingType} ★
            </span>
          </div>
        )}
        <h1
          className="text-2xl font-black text-[#d4222b] tracking-widest font-serif drop-shadow-xs leading-tight"
          style={{ fontFamily: "'STKaiti', 'Kaiti', 'STSong', serif" }}
        >
          {ending.title}
        </h1>
        {ending.titleAward && (
          <p
            className="text-xs text-[#8a7243] mt-1.5 font-serif tracking-widest font-bold"
            style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}
          >
            授 封 · {ending.titleAward}
          </p>
        )}
        {protagonistName && (
          <p
            className="text-xs text-[#2a2830] mt-1.5 font-serif tracking-wider font-bold"
            style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}
          >
            主 角 · {protagonistName}
          </p>
        )}
        <p
          className="text-[10px] text-[#85744f] mt-1.5 font-serif tracking-wider"
          style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}
        >
          {themeName}
        </p>
      </header>

      {/* 结局插画 */}
      <section className="mb-3">
        <div className="rounded-2xl border-4 border-white overflow-hidden shadow-md bg-[#0e0c0a] aspect-[3/4] relative flex items-center justify-center">
          {ending.imageUrl && !imageLoading ? (
            <img
              src={ending.imageUrl}
              alt={ending.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover animate-ending-fade"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-[#f0c869]">
              <Loader2 size={36} className="animate-spin" />
              <span
                className="text-xs font-serif tracking-widest"
                style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}
              >
                御史摹制结局图中...
              </span>
            </div>
          )}
        </div>
      </section>

      {/* 旁白结语 */}
      <section className="mb-3 bg-white/60 backdrop-blur-sm border border-[#e8dfc7] rounded-2xl p-3.5 shadow-2xs">
        <span className="text-[10px] font-bold text-[#85744f] block uppercase tracking-wider font-mono mb-1.5">
          📜 御 史 结 语
        </span>
        <p
          className="text-xs leading-loose text-[#2a2830] font-serif"
          style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}
        >
          {ending.narration}
        </p>
      </section>

      {/* 宜忌命中总结 */}
      {(yiHits !== undefined || jiHits !== undefined) && (
        <section className="mb-3 grid grid-cols-2 gap-2">
          <div className="bg-[#f0c869]/10 border border-[#f0c869]/60 rounded-xl px-3 py-2">
            <div className="flex items-center justify-between mb-1">
              <span
                className="text-[10px] font-bold text-[#8a7243] tracking-widest font-serif"
                style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}
              >
                今 日 宜
              </span>
              <span className="text-base font-black text-[#d4222b] font-mono">
                {yiHits ?? 0}
              </span>
            </div>
            <p
              className="text-[10px] text-[#85744f] font-serif leading-relaxed"
              style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}
            >
              {matchedYiKeywords && matchedYiKeywords.length > 0
                ? matchedYiKeywords.join('、')
                : '今日未命中'}
            </p>
          </div>
          <div className="bg-[#d4222b]/10 border border-[#d4222b]/60 rounded-xl px-3 py-2">
            <div className="flex items-center justify-between mb-1">
              <span
                className="text-[10px] font-bold text-[#8a3a3a] tracking-widest font-serif"
                style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}
              >
                今 日 忌
              </span>
              <span className="text-base font-black text-[#d4222b] font-mono">
                {jiHits ?? 0}
              </span>
            </div>
            <p
              className="text-[10px] text-[#85744f] font-serif leading-relaxed"
              style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}
            >
              {matchedJiKeywords && matchedJiKeywords.length > 0
                ? matchedJiKeywords.join('、')
                : '今日未触犯'}
            </p>
          </div>
        </section>
      )}

      {/* 数值面板 */}
      <section className="mb-3 bg-[#fdfaf2] border border-[#dfd9bf] rounded-2xl p-3">
        <span className="text-[10px] font-bold text-[#85744f] block uppercase tracking-wider font-mono mb-2">
          ⚖ 最 终 御 评
        </span>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(finalStats).map(([name, value]) => (
            <div key={name} className="flex flex-col items-center bg-white/70 rounded-xl py-2 border border-[#e8dfc7]">
              <span
                className="text-[10px] text-[#85744f] font-serif"
                style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}
              >
                {name}
              </span>
              <span className="text-lg font-bold text-[#d4222b] font-mono mt-0.5">{value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 落款 */}
      <footer className="flex items-center justify-between pt-3 border-t border-dashed border-[#dcbca0] mt-1">
        <div className="flex flex-col text-left">
          <span className="text-[9px] font-semibold text-[#8a8a8a] uppercase font-mono tracking-wider">
            Imperial Story Engine
          </span>
          <span className="text-[9px] text-[#b39e70] font-serif font-bold mt-0.5">
            御 史 台 · 结 局 摹 本 · 甲 辰 年
          </span>
        </div>
        <div className="w-10 h-10 border-2 border-red-600 rounded flex items-center justify-center font-serif text-[11px] font-black leading-tight text-red-600 rotate-[-8deg] px-1 py-0.5 shadow-xs">
          御史
          <br />
          监印
        </div>
      </footer>

      <style>{`
        @keyframes endingFade {
          from { opacity: 0; transform: scale(1.06); filter: blur(8px); }
          to   { opacity: 1; transform: scale(1); filter: blur(0); }
        }
        .animate-ending-fade { animation: endingFade 0.9s ease-out; }
      `}</style>
    </div>
  );
}
