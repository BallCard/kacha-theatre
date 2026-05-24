import { CheckCircle2, AlertOctagon } from "lucide-react";

interface ReportCardProps {
  paragraph: string;
  yi: string[];
  ji: string[];
}

export function ReportCard({ paragraph, yi, ji }: ReportCardProps) {
  return (
    <div id="report-card-component" className="w-full flex flex-col p-4 bg-[#fdfaf2] border-2 border-[#e6dcbe] rounded-2xl shadow-sm relative overflow-hidden">
      
      {/* Traditional Parchment Texture Overlays */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />
      <div className="absolute top-0 bottom-0 left-3 w-[1px] bg-[#f0e8cf] border-l border-dashed border-[#e3d7b3]" />
      <div className="absolute top-0 bottom-0 right-3 w-[1px] bg-[#f0e8cf] border-r border-dashed border-[#e3d7b3]" />

      {/* Title Header */}
      <div className="flex items-center justify-between border-b-2 border-dashed border-[#e0cca0] pb-2 px-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[#d4222b] font-serif text-[18px] font-black">▌</span>
          <span className="font-serif text-[#2a2830] font-bold text-sm tracking-wider" style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}>
            咔嚓剧场·御史房批复
          </span>
        </div>
        <span className="text-[10px] font-serif font-semibold text-[#8a8a8a] bg-[#ebe2c7] px-2 py-0.5 rounded-full" style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}>
          甲辰年 • 御史台
        </span>
      </div>

      {/* Paragraph content review */}
      <div className="py-3 px-1">
        <p 
          className="text-[14px] leading-relaxed text-[#403e45] text-justify indent-8 tracking-wide font-medium"
          style={{ 
            fontFamily: "'STKaiti', 'Kaiti', 'STSong', serif",
            textShadow: "0.2px 0.2px 0px rgba(0,0,0,0.1)"
          }}
        >
          {paragraph}
        </p>
      </div>

      {/* Separator Brush */}
      <div className="relative flex items-center justify-center my-1.5">
        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#dcbca0] to-transparent" />
        <div className="absolute px-3 bg-[#fdfaf2] text-[10px] text-[#b39e70] font-serif tracking-widest">
          宜忌吉凶 • 莫忘藏拙
        </div>
      </div>

      {/* Two columns Yi and Ji */}
      <div className="grid grid-cols-2 gap-3.5 pt-1.5 px-1 pb-1">
        
        {/* YI Column */}
        <div className="flex flex-col bg-[#f3f9f4] border border-[#d6eedb] rounded-xl p-2.5">
          <div className="flex items-center gap-1 mb-2">
            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-[#3f8c5a] text-white text-[11px] font-serif font-black shadow-sm">
              宜
            </span>
            <span className="text-xs font-bold text-[#2e6440] font-serif" style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}>修身藏锋</span>
          </div>
          <ul className="space-y-1">
            {yi.map((item, idx) => (
              <li key={idx} className="flex items-center gap-1.5 text-[11px] text-[#3c5e47] font-medium font-serif" style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}>
                <CheckCircle2 size={10} className="text-[#3f8c5a] shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* JI Column */}
        <div className="flex flex-col bg-[#fdf5f5] border border-[#f7dede] rounded-xl p-2.5">
          <div className="flex items-center gap-1 mb-2">
            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-[#d4222b] text-white text-[11px] font-serif font-black shadow-sm">
              忌
            </span>
            <span className="text-xs font-bold text-[#94272c] font-serif" style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}>外露招摇</span>
          </div>
          <ul className="space-y-1">
            {ji.map((item, idx) => (
              <li key={idx} className="flex items-center gap-1.5 text-[11px] text-[#7d3f42] font-medium font-serif" style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}>
                <AlertOctagon size={10} className="text-[#d4222b] shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>

    </div>
  );
}
