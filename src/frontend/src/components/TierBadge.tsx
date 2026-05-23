import { TIER_CONFIG } from "../config/tiers";
import { getTierSealUrl } from "../utils/assets";

interface TierBadgeProps {
  score: number;
  levelTier: "打工新丁" | "划水学徒" | "摸鱼修士" | "划水侍郎" | "摸鱼大将军" | "假寐天尊";
  selectedTitle: string;
}

export function TierBadge({ score, levelTier, selectedTitle }: TierBadgeProps) {
  const config = TIER_CONFIG[levelTier] || TIER_CONFIG["打工新丁"];
  const sealUrl = getTierSealUrl(config.seal);

  return (
    <div id="tier-badge-component" className="flex flex-col items-center w-full px-4 py-3 bg-white/70 backdrop-blur-md rounded-2xl border border-[#ecebeb] shadow-sm">
      
      {/* Visual Seal and Selected Title Block */}
      <div className="relative flex flex-col items-center justify-center my-2">
        
        {/* Colorful Glow Aura breathing for TIANZUN highest grade */}
        {config.aura && (
          <div 
            id="aura-halo"
            className="absolute rounded-full w-28 h-28 blur-md opacity-70 animate-pulse bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 mix-blend-multiply"
            style={{
              animation: "auraPulse 3.5s infinite ease-in-out",
            }}
          />
        )}

        {/* Seal SVG container */}
        <div 
          id="seal-container" 
          className="relative z-10 w-28 h-28 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 duration-200 cursor-pointer"
        >
          <img 
            src={sealUrl} 
            alt={levelTier} 
            className="w-full h-full object-contain animate-bounce-subtle"
            style={{ filter: `drop-shadow(0 4px 6px rgba(0,0,0,0.06))` }}
          />
        </div>

        {/* Selected Title Heading Text */}
        <div id="censor-title-word" className="relative z-10 mt-3 flex flex-col items-center text-center">
          <span 
            className="text-4xl font-bold font-serif tracking-widest text-[#d4222b] drop-shadow-sm"
            style={{ fontFamily: "'STKaiti', 'Kaiti', 'BiauKai', 'KaiTi', serif" }}
          >
            {selectedTitle}
          </span>
          <div className="flex items-center gap-1.5 mt-2 px-3 py-0.5 rounded-full bg-[#f6f6f6] border border-[#ebe9e9]">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: config.color }} />
            <span className="text-[11px] font-mono font-medium text-[#8a8a8a] tracking-wider uppercase">
              {levelTier} • {score}分
            </span>
          </div>
        </div>
      </div>

      {/* Progress Scale Bar */}
      <div id="progress-scale-bar" className="w-full mt-3.5 px-1">
        <div className="flex justify-between items-center text-[10px] text-[#8a8a8a] font-mono mb-1">
          <span>0 (新丁)</span>
          <span className="font-semibold text-xs transition-all" style={{ color: config.color }}>
            摸鱼指数: {score}%
          </span>
          <span>100 (天尊)</span>
        </div>
        <div className="relative w-full h-2.5 bg-[#e5e5e5] rounded-full overflow-hidden shadow-inner border border-[#e0dddd]">
          <div 
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{ 
              width: `${score}%`, 
              backgroundColor: config.color,
              backgroundImage: "linear-gradient(90deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)"
            }}
          />
        </div>
      </div>

      {/* CSS stylesheet rule injects for aura performance */}
      <style>{`
        @keyframes auraPulse {
          0%, 100% {
            transform: scale(1) rotate(0deg);
            filter: blur(12px) hue-rotate(0deg);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.18) rotate(180deg);
            filter: blur(16px) hue-rotate(120deg);
            opacity: 0.85;
          }
        }
        @keyframes bounceSubtle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }
        .animate-bounce-subtle {
          animation: bounceSubtle 3s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}
