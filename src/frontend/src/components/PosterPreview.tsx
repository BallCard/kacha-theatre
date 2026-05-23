import { AnalyzeResult } from "../types";
import { TierBadge } from "./TierBadge";
import { ReportCard } from "./ReportCard";

interface PosterPreviewProps {
  score: number;
  levelTier: "打工新丁" | "划水学徒" | "摸鱼修士" | "划水侍郎" | "摸鱼大将军" | "假寐天尊";
  selectedTitle: string;
  compiledCanvasUrl: string | null; // high-definition flattened canvas PNG string
  report: AnalyzeResult["report"];
}

export function PosterPreview({
  score,
  levelTier,
  selectedTitle,
  compiledCanvasUrl,
  report,
}: PosterPreviewProps) {
  return (
    <div 
      id="printable-poster-area"
      className="w-full flex flex-col bg-[#f5efe1] border-[12px] border-[#d4222b] rounded-3xl overflow-hidden p-5 shadow-xl relative text-[#2a2830] select-none"
      style={{
        boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
        backgroundImage: "radial-gradient(#eedca2 0.8px, transparent 0.8px)",
        backgroundSize: "24px 24px"
      }}
    >
      {/* Visual Silk Gold Framing Deco corners */}
      <div className="absolute top-1 left-1 w-5 h-5 border-t-2 border-l-2 border-[#f0c869] pointer-events-none" />
      <div className="absolute top-1 right-1 w-5 h-5 border-t-2 border-r-2 border-[#f0c869] pointer-events-none" />
      <div className="absolute bottom-1 left-1 w-5 h-5 border-b-2 border-l-2 border-[#f0c869] pointer-events-none" />
      <div className="absolute bottom-1 right-1 w-5 h-5 border-b-2 border-r-2 border-[#f0c869] pointer-events-none" />

      {/* Main heading badge block */}
      <header className="flex flex-col items-center mb-4 mt-1 border-b-2 border-double border-[#d4222b] pb-3 text-center">
        <h1 
          className="text-3xl font-black text-[#d4222b] tracking-widest font-serif drop-shadow-xs"
          style={{ fontFamily: "'STKaiti', 'Kaiti', 'STSong', serif" }}
        >
          摸 鱼 诏 书
        </h1>
        <p className="text-[10px] uppercase font-mono tracking-widest text-[#85744f] mt-1.5 font-bold">
          Censorate Inspection Record • Imperial Decree
        </p>
      </header>

      {/* 1. Level Stamp Badge Overlay */}
      <section className="mb-4">
        <TierBadge 
          score={score} 
          levelTier={levelTier} 
          selectedTitle={selectedTitle} 
        />
      </section>

      {/* 2. Uploaded image content representation (with sticker annotations compiled) */}
      <section className="mb-4">
        <div className="rounded-2xl border-4 border-[#fff] overflow-hidden shadow-md bg-white aspect-square relative flex items-center justify-center">
          {compiledCanvasUrl ? (
            <img 
              referrerPolicy="no-referrer"
              src={compiledCanvasUrl} 
              alt="Moyu canvas graphic" 
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-[#8a8a8a] text-xs font-serif p-4 text-center">
              图片封藏中...
            </div>
          )}
        </div>
      </section>

      {/* 3. Parchment Decree content report */}
      <section className="mb-3">
        <ReportCard 
          paragraph={report.paragraph} 
          yi={report.yi} 
          ji={report.ji} 
        />
      </section>

      {/* 4. Footer Imperial Seals & Credits */}
      <footer className="flex items-center justify-between pt-3 border-t border-dashed border-[#dcbca0] mt-1">
        <div className="flex flex-col text-left">
          <span className="text-[10px] font-semibold text-[#8a8a8a] uppercase font-mono tracking-wider">
            Office Censor System
          </span>
          <span className="text-[9px] text-[#b39e70] font-serif font-bold mt-0.5">
            大明御史台 • 当代监审司合辑
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Censor Imperial Red Logo Stamp vector decoration */}
          <div className="w-10 h-10 border-2 border-red-600 rounded flex items-center justify-center font-serif text-[11px] font-black leading-tight text-red-600 rotate-[-8deg] px-1 py-0.5 shadow-xs">
            御史
            <br />
            监印
          </div>
          <span 
            className="text-[10px] text-gray-500 font-serif leading-tight font-semibold"
            style={{ writingMode: "vertical-rl" }}
          >
            御史台 • 印 • 甲辰年
          </span>
        </div>
      </footer>

    </div>
  );
}
