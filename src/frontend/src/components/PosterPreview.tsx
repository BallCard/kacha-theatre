import { AnalyzeResult } from "../types";

interface PosterPreviewProps {
  score: number;
  levelTier: "打工新丁" | "划水学徒" | "摸鱼修士" | "划水侍郎" | "摸鱼大将军" | "假寐天尊";
  selectedTitle: string;
  compiledCanvasUrl: string | null;
  report: AnalyzeResult["report"];
}

// 紫禁城轮廓（简化 SVG silhouette），底图淡水印
const FORBIDDEN_CITY_SVG = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 220' width='600' height='220'>
  <g fill='#c89a3a' opacity='0.9'>
    <!-- 中央正殿 -->
    <polygon points='220,90 380,90 360,60 240,60' />
    <rect x='240' y='90' width='120' height='90' />
    <rect x='270' y='110' width='14' height='40' />
    <rect x='316' y='110' width='14' height='40' />
    <!-- 屋顶曲线（简化） -->
    <path d='M220,90 Q300,40 380,90 Z' />
    <!-- 左侧偏殿 -->
    <polygon points='100,130 200,130 190,110 110,110' />
    <rect x='110' y='130' width='80' height='50' />
    <!-- 右侧偏殿 -->
    <polygon points='400,130 500,130 490,110 410,110' />
    <rect x='410' y='130' width='80' height='50' />
    <!-- 城墙基座 -->
    <rect x='40' y='180' width='520' height='30' />
    <rect x='60' y='170' width='40' height='12' />
    <rect x='280' y='168' width='40' height='14' />
    <rect x='500' y='170' width='40' height='12' />
  </g>
</svg>
`;
const FORBIDDEN_CITY_URI = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  FORBIDDEN_CITY_SVG.trim()
)}`;

// 龙纹小图标（侧边装饰）
function DragonIcon({ color = "#f0c869" }: { color?: string }) {
  return (
    <svg viewBox="0 0 32 32" width="22" height="22">
      <g fill={color} opacity="0.9">
        <path d="M4 16 Q8 8 16 12 Q22 14 28 10 Q26 18 18 18 Q12 20 4 16 Z" />
        <circle cx="24" cy="13" r="1.2" fill="#2a0a0c" />
      </g>
    </svg>
  );
}

function DecreeRow({
  tag,
  bgColor,
  borderColor,
  items,
}: {
  tag: string;
  bgColor: string;
  borderColor: string;
  items: string[];
}) {
  return (
    <div
      className="flex items-stretch rounded-md overflow-hidden shadow-sm"
      style={{
        background: bgColor,
        border: `1.5px solid ${borderColor}`,
        boxShadow: `inset 0 0 0 1px ${borderColor}40`,
      }}
    >
      <div
        className="w-11 flex items-center justify-center shrink-0"
        style={{ borderRight: `1px solid ${borderColor}60` }}
      >
        <DragonIcon color="#f0c869" />
      </div>
      <div className="flex-1 flex items-center px-3.5 py-2.5 gap-3 min-w-0">
        <span
          className="text-[18px] font-black tracking-wider shrink-0"
          style={{
            fontFamily: "'STKaiti','Kaiti',serif",
            color: "#f0c869",
            textShadow: "0 1px 2px rgba(0,0,0,0.55)",
          }}
        >
          {tag}：
        </span>
        <span
          className="text-[14px] tracking-[0.18em] truncate"
          style={{
            fontFamily: "'STKaiti','Kaiti',serif",
            color: "#fce8b0",
            textShadow: "0 1px 1.5px rgba(0,0,0,0.5)",
          }}
        >
          {items.join("  ")}
        </span>
      </div>
    </div>
  );
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
      className="w-full flex flex-col bg-[#2a0a0c] overflow-hidden shadow-2xl select-none rounded-2xl relative"
      style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.25)" }}
    >
      {/* ============ 顶部：照片满铺（含 canvas 贴纸合成） ============ */}
      <div className="relative w-full aspect-square bg-[#1a1a1a] overflow-hidden">
        {compiledCanvasUrl ? (
          <img
            referrerPolicy="no-referrer"
            src={compiledCanvasUrl}
            alt="摸鱼实录"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[#8a8a8a] text-xs font-serif">
            图片封藏中...
          </div>
        )}
      </div>

      {/* ============ 底部：御史房深红诏书面板 ============ */}
      <div
        className="relative w-full px-5 pt-6 pb-7 overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, #5a1418 0%, #3a0e12 55%, #2a0a0c 100%)",
        }}
      >
        {/* 紫禁城底纹 */}
        <div
          className="absolute left-0 right-0 bottom-0 h-44 pointer-events-none"
          style={{
            backgroundImage: `url("${FORBIDDEN_CITY_URI}")`,
            backgroundSize: "contain",
            backgroundPosition: "bottom center",
            backgroundRepeat: "no-repeat",
            opacity: 0.18,
          }}
        />

        {/* 金粉颗粒底纹 */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(rgba(240,200,105,0.45) 0.5px, transparent 0.5px)",
            backgroundSize: "16px 16px",
            opacity: 0.18,
          }}
        />

        {/* 金色双框 */}
        <div
          className="relative rounded-md p-5 pt-4"
          style={{
            border: "2px solid rgba(200,154,58,0.65)",
            boxShadow:
              "inset 0 0 0 1px rgba(200,154,58,0.25), inset 0 0 60px rgba(0,0,0,0.35)",
          }}
        >
          {/* 内描边 */}
          <div
            className="absolute inset-[5px] rounded-sm pointer-events-none"
            style={{ border: "1px solid rgba(200,154,58,0.35)" }}
          />

          {/* 角花装饰 */}
          <CornerOrnament className="absolute top-1 left-1" />
          <CornerOrnament className="absolute top-1 right-1 rotate-90" />
          <CornerOrnament className="absolute bottom-1 left-1 -rotate-90" />
          <CornerOrnament className="absolute bottom-1 right-1 rotate-180" />

          {/* 标题 */}
          <div className="relative flex items-center justify-center gap-3 mb-3">
            <span style={{ color: "#c89a3a", fontSize: 12 }}>✦</span>
            <h2
              className="text-[26px] font-black tracking-[0.25em] leading-none whitespace-nowrap"
              style={{
                fontFamily: "'STKaiti','Kaiti','STSong',serif",
                color: "#f5d27a",
                textShadow:
                  "0 1px 2px rgba(0,0,0,0.7), 0 0 8px rgba(240,200,105,0.25)",
              }}
            >
              御史房 · 今日批复
            </h2>
            <span style={{ color: "#c89a3a", fontSize: 12 }}>✦</span>
          </div>

          {/* 段位/称号/分数小标 */}
          <div className="relative flex items-center justify-center mb-4">
            <span
              className="text-[10px] tracking-[0.3em] px-3 py-0.5 rounded-full"
              style={{
                fontFamily: "'STKaiti','Kaiti',serif",
                color: "#f0c869",
                background: "rgba(0,0,0,0.25)",
                border: "1px solid rgba(200,154,58,0.4)",
              }}
            >
              {selectedTitle} • {levelTier} • {score}分
            </span>
          </div>

          {/* 批文段落 */}
          <p
            className="relative z-10 text-[13.5px] leading-[2] tracking-[0.05em] text-justify indent-8 mb-5"
            style={{
              fontFamily: "'STKaiti','Kaiti','STSong',serif",
              color: "#f5d27a",
              textShadow: "0 1px 1.5px rgba(0,0,0,0.55)",
            }}
          >
            {report.paragraph}
          </p>

          {/* 宜/忌双行 */}
          <div className="relative z-10 flex flex-col gap-2.5">
            <DecreeRow
              tag="宜"
              bgColor="linear-gradient(90deg, #1a3a22, #20452a 50%, #1a3a22)"
              borderColor="#3f8c5a"
              items={report.yi}
            />
            <DecreeRow
              tag="忌"
              bgColor="linear-gradient(90deg, #3a1416, #4a181c 50%, #3a1416)"
              borderColor="#a31a20"
              items={report.ji}
            />
          </div>

          {/* 底部署名 */}
          <div className="relative z-10 flex items-center justify-between mt-5 pt-3 border-t border-dashed border-[#c89a3a]/30">
            <span
              className="text-[10px] tracking-[0.3em]"
              style={{
                fontFamily: "'STKaiti','Kaiti',serif",
                color: "#c89a3a",
                opacity: 0.8,
              }}
            >
              御史台 • 印 • 甲辰年
            </span>
            <div
              className="px-2 py-0.5 rounded-sm rotate-[-6deg]"
              style={{
                border: "1.5px solid #a31a20",
                background: "rgba(163,26,32,0.15)",
              }}
            >
              <span
                className="text-[10px] font-black tracking-wider"
                style={{
                  fontFamily: "'STKaiti','Kaiti',serif",
                  color: "#e8a0a4",
                  textShadow: "0 0 4px rgba(163,26,32,0.6)",
                }}
              >
                御史 监印
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CornerOrnament({ className }: { className?: string }) {
  return (
    <div className={`w-3 h-3 pointer-events-none ${className || ""}`}>
      <svg viewBox="0 0 12 12" width="12" height="12">
        <path
          d="M0,0 L6,0 L6,1.5 L1.5,1.5 L1.5,6 L0,6 Z"
          fill="#c89a3a"
          opacity="0.85"
        />
      </svg>
    </div>
  );
}
