export const STICKERS = [
  // 1. 朱红印 (Red Seals)
  {
    id: "seal_red_01",
    name: "准奏",
    category: "seal" as const,
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <rect x="5" y="5" width="110" height="110" rx="10" fill="none" stroke="#d4222b" stroke-width="4" stroke-dasharray="2 1" />
        <rect x="10" y="10" width="100" height="100" rx="6" fill="none" stroke="#d4222b" stroke-width="6" />
        <text x="60" y="72" font-family="'STKaiti', 'Kaiti', 'STSong', serif" font-size="34" font-weight="900" fill="#d4222b" text-anchor="middle" dominant-baseline="middle">准奏</text>
      </svg>
    `
  },
  {
    id: "seal_red_02",
    name: "驳回",
    category: "seal" as const,
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <rect x="10" y="10" width="100" height="100" rx="2" fill="none" stroke="#d4222b" stroke-width="6" />
        <line x1="10" y1="10" x2="110" y2="110" stroke="#d4222b" stroke-width="2" opacity="0.4" />
        <text x="60" y="72" font-family="'STKaiti', 'Kaiti', 'STSong', serif" font-size="34" font-weight="900" fill="#d4222b" text-anchor="middle" dominant-baseline="middle">驳回</text>
      </svg>
    `
  },
  {
    id: "seal_red_03",
    name: "神游太虚",
    category: "seal" as const,
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <circle cx="60" cy="60" r="48" fill="none" stroke="#d4222b" stroke-width="5" />
        <circle cx="60" cy="60" r="42" fill="none" stroke="#d4222b" stroke-width="1.5" stroke-dasharray="3 3" />
        <text x="60" y="48" font-family="'STKaiti', 'Kaiti', 'STSong', serif" font-size="18" font-weight="900" fill="#d4222b" text-anchor="middle">神游</text>
        <text x="60" y="80" font-family="'STKaiti', 'Kaiti', 'STSong', serif" font-size="18" font-weight="900" fill="#d4222b" text-anchor="middle">太虚</text>
      </svg>
    `
  },
  {
    id: "seal_red_04",
    name: "大吉",
    category: "seal" as const,
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <rect x="10" y="10" width="100" height="100" rx="50" fill="none" stroke="#d4222b" stroke-width="5" />
        <rect x="16" y="16" width="88" height="88" rx="44" fill="none" stroke="#d4222b" stroke-width="1" />
        <text x="60" y="72" font-family="'STKaiti', 'Kaiti', 'STSong', serif" font-size="34" font-weight="900" fill="#d4222b" text-anchor="middle" dominant-baseline="middle">大吉</text>
      </svg>
    `
  },
  {
    id: "seal_red_05",
    name: "奉天承运",
    category: "seal" as const,
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <rect x="10" y="10" width="100" height="100" fill="none" stroke="#d4222b" stroke-width="5" />
        <text x="38" y="45" font-family="'STKaiti', 'Kaiti', serif" font-size="15" font-weight="bold" fill="#d4222b" text-anchor="middle">奉天</text>
        <text x="38" y="85" font-family="'STKaiti', 'Kaiti', serif" font-size="15" font-weight="bold" fill="#d4222b" text-anchor="middle">承运</text>
        <line x1="60" y1="15" x2="60" y2="105" stroke="#d4222b" stroke-width="1.5" />
        <text x="82" y="45" font-family="'STKaiti', 'Kaiti', serif" font-size="15" font-weight="bold" fill="#d4222b" text-anchor="middle">摸鱼</text>
        <text x="82" y="85" font-family="'STKaiti', 'Kaiti', serif" font-size="15" font-weight="bold" fill="#d4222b" text-anchor="middle">特诏</text>
      </svg>
    `
  },
  {
    id: "seal_red_06",
    name: "摸鱼有理",
    category: "seal" as const,
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
        <rect x="10" y="10" width="100" height="100" rx="15" fill="none" stroke="#d4222b" stroke-width="4.5" />
        <text x="38" y="48" font-family="'STKaiti', 'Kaiti', serif" font-size="18" font-weight="bold" fill="#d4222b" text-anchor="middle">摸鱼</text>
        <text x="82" y="48" font-family="'STKaiti', 'Kaiti', serif" font-size="18" font-weight="bold" fill="#d4222b" text-anchor="middle">有理</text>
        <text x="60" y="88" font-family="'STKaiti', 'Kaiti', serif" font-size="18" font-weight="bold" fill="#d4222b" text-anchor="middle">御史房</text>
        <line x1="15" y1="60" x2="105" y2="60" stroke="#d4222b" stroke-dasharray="2 2" />
      </svg>
    `
  },

  // 2. 漫画气泡 (Comic Bubbles)
  {
    id: "bubble_01",
    name: "我想下班",
    category: "bubble" as const,
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 80" width="160" height="80">
        <rect x="5" y="5" width="150" height="55" rx="15" fill="#ffffff" stroke="#2a2830" stroke-width="3" />
        <path d="M 40 60 L 30 75 L 55 60 Z" fill="#ffffff" stroke="#2a2830" stroke-width="3" />
        <path d="M 39 58 L 31 73 L 54 58" fill="#ffffff" />
        <text x="80" y="38" font-family="sans-serif" font-weight="bold" font-size="16" fill="#2a2830" text-anchor="middle">我想下班 😭</text>
      </svg>
    `
  },
  {
    id: "bubble_02",
    name: "脑电波断线",
    category: "bubble" as const,
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 80" width="160" height="80">
        <rect x="5" y="5" width="150" height="55" rx="15" fill="#ffffff" stroke="#2a2830" stroke-width="3" />
        <path d="M 120 60 L 135 75 L 110 60 Z" fill="#ffffff" stroke="#2a2830" stroke-width="3" />
        <path d="M 119 58 L 134 73 L 111 58" fill="#ffffff" />
        <text x="80" y="38" font-family="sans-serif" font-weight="bold" font-size="14" fill="#2a2830" text-anchor="middle">脑电波断线... 💤</text>
      </svg>
    `
  },
  {
    id: "bubble_03",
    name: "正在努力",
    category: "bubble" as const,
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 80" width="160" height="80">
        <rect x="5" y="5" width="150" height="55" rx="15" fill="#ffffff" stroke="#2a2830" stroke-width="3" />
        <path d="M 80 60 L 80 75 L 90 60 Z" fill="#ffffff" stroke="#2a2830" stroke-width="3" />
        <path d="M 79 58 L 80 73 L 89 58" fill="#ffffff" />
        <text x="80" y="38" font-family="sans-serif" font-weight="bold" font-size="14" fill="#3f8c5a" text-anchor="middle">正在努力搬砖(假)</text>
      </svg>
    `
  },
  {
    id: "bubble_04",
    name: "在改了在改了",
    category: "bubble" as const,
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 80" width="160" height="80">
        <rect x="5" y="5" width="150" height="55" rx="8" fill="#ffffff" stroke="#2a2830" stroke-width="3" />
        <path d="M 120 60 L 125 76 L 105 60 Z" fill="#ffffff" stroke="#2a2830" stroke-width="3" />
        <path d="M 119 58 L 124 74 L 106 58" fill="#ffffff" />
        <text x="80" y="38" font-family="sans-serif" font-weight="bold" font-size="14" fill="#d4222b" text-anchor="middle">在改了在改了 📁</text>
      </svg>
    `
  },
  {
    id: "bubble_05",
    name: "啊？",
    category: "bubble" as const,
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 80" width="100" height="80">
        <rect x="5" y="5" width="90" height="55" rx="20" fill="#ffffff" stroke="#2a2830" stroke-width="3" />
        <path d="M 50 60 L 40 76 L 60 60 Z" fill="#ffffff" stroke="#2a2830" stroke-width="3" />
        <path d="M 49 58 L 41 74 L 59 58" fill="#ffffff" />
        <text x="50" y="38" font-family="sans-serif" font-weight="bold" font-size="20" fill="#2a2830" text-anchor="middle">啊？❓</text>
      </svg>
    `
  },
  {
    id: "bubble_06",
    name: "拒绝搬砖",
    category: "bubble" as const,
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 80" width="160" height="80">
        <rect x="5" y="5" width="150" height="55" rx="15" fill="#ffffff" stroke="#d4222b" stroke-width="3" />
        <path d="M 30 60 L 25 76 L 45 60 Z" fill="#ffffff" stroke="#d4222b" stroke-width="3" />
        <path d="M 29 58 L 26 74 L 44 58" fill="#ffffff" />
        <text x="80" y="38" font-family="sans-serif" font-weight="bold" font-size="14" fill="#d4222b" text-anchor="middle">已读，但拒绝回复</text>
      </svg>
    `
  },

  // 3. 便利贴 (Yellow tags)
  {
    id: "yellow_tag_01",
    name: "急件",
    category: "tag" as const,
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 70" width="140" height="70">
        <rect x="5" y="5" width="130" height="60" rx="3" fill="#f0c869" stroke="#d4222b" stroke-width="2" />
        <line x1="5" y1="20" x2="135" y2="20" stroke="#d4222b" stroke-width="1.5" />
        <text x="70" y="15" font-family="sans-serif" font-size="10" font-weight="bold" fill="#d4222b" text-anchor="middle">★ IMMEDIATE ATN ★</text>
        <text x="70" y="48" font-family="'STKaiti', 'Kaiti', serif" font-weight="black" font-size="22" fill="#d4222b" text-anchor="middle">急件 🔥</text>
      </svg>
    `
  },
  {
    id: "yellow_tag_02",
    name: "假装在忙",
    category: "tag" as const,
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 70" width="140" height="70">
        <rect x="5" y="5" width="130" height="60" rx="4" fill="#faf0b4" stroke="#e0c032" stroke-width="2" />
        <line x1="15" y1="15" x2="125" y2="15" stroke="#e0c032" stroke-dasharray="2 2" />
        <text x="70" y="44" font-family="'STKaiti', 'Kaiti', serif" font-weight="bold" font-size="16" fill="#6d5a11" text-anchor="middle">【 假装在忙 】</text>
      </svg>
    `
  },
  {
    id: "yellow_tag_03",
    name: "核心机密",
    category: "tag" as const,
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 70" width="140" height="70">
        <rect x="5" y="5" width="130" height="60" rx="2" fill="#f0c869" stroke="#222" stroke-width="2" />
        <rect x="10" y="10" width="120" height="50" fill="none" stroke="#222" stroke-width="0.7" />
        <text x="70" y="42" font-family="'STKaiti', 'Kaiti', serif" font-weight="bold" font-size="17" fill="#222" text-anchor="middle">⚠️ 核心机密</text>
      </svg>
    `
  },
  {
    id: "yellow_tag_04",
    name: "暂缓处理",
    category: "tag" as const,
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 70" width="140" height="70">
        <rect x="5" y="5" width="130" height="60" rx="6" fill="#faf0b4" stroke="#8a8a8a" stroke-width="1.5" />
        <line x1="5" y1="15" x2="135" y2="15" stroke="#8a8a8a" stroke-width="0.5" />
        <text x="70" y="44" font-family="'STKaiti', 'Kaiti', serif" font-size="15" fill="#555" text-anchor="middle">💤 暂缓处理</text>
      </svg>
    `
  },
  {
    id: "yellow_tag_05",
    name: "已阅",
    category: "tag" as const,
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 70" width="140" height="70">
        <rect x="5" y="5" width="130" height="60" rx="3" fill="#f0c869" stroke="#3f8c5a" stroke-width="2.5" />
        <circle cx="28" cy="35" r="16" fill="none" stroke="#3f8c5a" stroke-width="1.5" />
        <text x="28" y="40" font-family="'STKaiti', 'Kaiti', serif" font-weight="bold" font-size="15" fill="#3f8c5a" text-anchor="middle">阅</text>
        <text x="85" y="40" font-family="'STKaiti', 'Kaiti', serif" font-weight="bold" font-size="16" fill="#2a2830" text-anchor="middle">御史过目</text>
      </svg>
    `
  },
  {
    id: "yellow_tag_06",
    name: "心不在焉",
    category: "tag" as const,
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 70" width="140" height="70">
        <rect x="5" y="5" width="130" height="60" rx="4" fill="#faf0b4" stroke="#2a2830" stroke-width="1.5" />
        <circle cx="120" cy="18" r="8" fill="#d4222b" />
        <text x="120" y="21" font-size="9" font-family="sans-serif" font-weight="bold" fill="#fff" text-anchor="middle">!</text>
        <text x="65" y="42" font-family="'STKaiti', 'Kaiti', serif" font-size="16" fill="#2a2830" text-anchor="middle">💭 心不在焉</text>
      </svg>
    `
  },

  // 4. 特殊 (Special)
  {
    id: "face_seal_big",
    name: "御史封脸大印",
    category: "special" as const,
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 150" width="150" height="150">
        <rect x="5" y="5" width="140" height="140" fill="none" stroke="#d4222b" stroke-width="8" />
        <rect x="15" y="15" width="120" height="120" fill="none" stroke="#d4222b" stroke-width="2" />
        <line x1="5" y1="5" x2="145" y2="145" stroke="#d4222b" stroke-width="2" stroke-dasharray="3 3" opacity="0.6" />
        <line x1="145" y1="5" x2="5" y2="145" stroke="#d4222b" stroke-width="2" stroke-dasharray="3 3" opacity="0.6" />
        <rect x="35" y="35" width="80" height="80" fill="#d4222b" />
        <text x="75" y="66" font-family="'STKaiti', 'Kaiti', serif" font-size="22" font-weight="900" fill="#ffffff" text-anchor="middle">御史</text>
        <text x="75" y="98" font-family="'STKaiti', 'Kaiti', serif" font-size="22" font-weight="900" fill="#ffffff" text-anchor="middle">封印</text>
      </svg>
    `
  },
  {
    id: "bubble_zzz",
    name: "ZZZ 神游气泡",
    category: "special" as const,
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 100" width="150" height="100">
        <rect x="6" y="6" width="138" height="62" rx="30" fill="#ffffff" stroke="#1a1a1a" stroke-width="4" />
        <path d="M 50 66 L 38 92 L 78 66 Z" fill="#ffffff" stroke="#1a1a1a" stroke-width="4" stroke-linejoin="round" />
        <path d="M 50 64 L 39 89 L 76 64" fill="#ffffff" />
        <text x="75" y="50" font-family="'Impact','Arial Black',sans-serif" font-weight="900" font-size="36" fill="#1a1a1a" text-anchor="middle" letter-spacing="3">ZZZ</text>
      </svg>
    `
  },
  {
    id: "armband_taofu",
    name: "在朕这逃不掉袖标",
    category: "special" as const,
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 70" width="220" height="70">
        <defs>
          <linearGradient id="armbandbg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#e8d8b0"/>
            <stop offset="100%" stop-color="#c9b58c"/>
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="212" height="62" rx="6" fill="url(#armbandbg)" stroke="#8a5a20" stroke-width="2" />
        <rect x="10" y="10" width="200" height="50" rx="3" fill="none" stroke="#8a5a20" stroke-width="0.8" stroke-dasharray="3 2" />
        <text x="110" y="46" font-family="'STKaiti','Kaiti',serif" font-size="28" font-weight="900" fill="#7a3318" text-anchor="middle" letter-spacing="2">在朕这逃不掉</text>
      </svg>
    `
  }
];

export const TIER_SEALS: { [key: string]: string } = {
  "tier_seal_01_xinding": `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
      <circle cx="80" cy="80" r="70" fill="none" stroke="#9aa1a8" stroke-width="6" />
      <circle cx="80" cy="80" r="62" fill="none" stroke="#9aa1a8" stroke-width="1" />
      <path d="M 40 80 Q 80 50 120 80 Q 80 110 40 80" fill="none" stroke="#9aa1a8" stroke-width="1.5" stroke-dasharray="2 2" />
      <text x="80" y="72" font-family="'STKaiti', 'Kaiti', serif" font-size="18" font-weight="black" fill="#9aa1a8" text-anchor="middle">打工</text>
      <text x="80" y="104" font-family="'STKaiti', 'Kaiti', serif" font-size="22" font-weight="black" fill="#9aa1a8" text-anchor="middle">新丁</text>
    </svg>
  `,
  "tier_seal_02_xuetu": `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
      <rect x="15" y="15" width="130" height="130" rx="8" fill="none" stroke="#3b6fa0" stroke-width="6" />
      <rect x="25" y="25" width="110" height="110" rx="4" fill="none" stroke="#3b6fa0" stroke-width="1.5" />
      <text x="80" y="70" font-family="'STKaiti', 'Kaiti', serif" font-size="18" font-weight="black" fill="#3b6fa0" text-anchor="middle">划水</text>
      <text x="80" y="104" font-family="'STKaiti', 'Kaiti', serif" font-size="22" font-weight="black" fill="#3b6fa0" text-anchor="middle">学徒</text>
    </svg>
  `,
  "tier_seal_03_xiushi": `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
      <circle cx="80" cy="80" r="72" fill="none" stroke="#3f8c5a" stroke-width="6" />
      <polygon points="80,24 125,116 35,116" fill="none" stroke="#3f8c5a" stroke-width="1" opacity="0.3" />
      <text x="80" y="70" font-family="'STKaiti', 'Kaiti', serif" font-size="18" font-weight="black" fill="#3f8c5a" text-anchor="middle">摸鱼</text>
      <text x="80" y="104" font-family="'STKaiti', 'Kaiti', serif" font-size="22" font-weight="black" fill="#3f8c5a" text-anchor="middle">修士</text>
    </svg>
  `,
  "tier_seal_04_shilang": `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
      <rect x="15" y="15" width="130" height="130" fill="none" stroke="#7a3c8f" stroke-width="6" />
      <line x1="15" y1="80" x2="145" y2="80" stroke="#7a3c8f" stroke-width="1" opacity="0.4" />
      <text x="80" y="70" font-family="'STKaiti', 'Kaiti', serif" font-size="18" font-weight="black" fill="#7a3c8f" text-anchor="middle">划水</text>
      <text x="80" y="104" font-family="'STKaiti', 'Kaiti', serif" font-size="22" font-weight="black" fill="#7a3c8f" text-anchor="middle">侍郎</text>
    </svg>
  `,
  "tier_seal_05_dajiangjun": `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
      <rect x="15" y="15" width="130" height="130" rx="30" fill="none" stroke="#d4222b" stroke-width="6" />
      <circle cx="80" cy="80" r="48" fill="none" stroke="#d4222b" stroke-width="1.5" stroke-dasharray="4 2" />
      <text x="80" y="68" font-family="'STKaiti', 'Kaiti', serif" font-size="16" font-weight="black" fill="#d4222b" text-anchor="middle">摸鱼</text>
      <text x="80" y="102" font-family="'STKaiti', 'Kaiti', serif" font-size="19" font-weight="black" fill="#d4222b" text-anchor="middle">大将军</text>
    </svg>
  `,
  "tier_seal_06_tianzun": `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
      <rect x="12" y="12" width="136" height="136" fill="none" stroke="#d4222b" stroke-width="8" />
      <rect x="22" y="22" width="116" height="116" fill="none" stroke="#d4222b" stroke-width="1.5" stroke-dasharray="3 1" />
      <text x="80" y="70" font-family="'STKaiti', 'Kaiti', serif" font-size="19" font-weight="black" fill="#d4222b" text-anchor="middle">假寐</text>
      <text x="80" y="104" font-family="'STKaiti', 'Kaiti', serif" font-size="22" font-weight="black" fill="#d4222b" text-anchor="middle">天尊</text>
    </svg>
  `
};

export function getRawSvgUrl(svgString: string): string {
  const formatted = svgString.trim();
  return `data:image/svg+xml;utf8,${encodeURIComponent(formatted)}`;
}

export function getStickerById(id: string) {
  return STICKERS.find(s => s.id === id);
}

export function getStickerUrl(id: string): string {
  const s = getStickerById(id);
  if (!s) return "";
  return getRawSvgUrl(s.svg);
}

export function getTierSealUrl(key: string): string {
  const svg = TIER_SEALS[key];
  if (!svg) return "";
  return getRawSvgUrl(svg);
}

// === 大段位印章（参考海报右上角朱红双框印） ===
// 每个 tier 名拆 2/剩余 两行，红色双框 + 留白纹理
const BIG_TIER_STAMP_SPLITS: Record<string, [string, string]> = {
  "打工新丁": ["打工", "新丁"],
  "划水学徒": ["划水", "学徒"],
  "摸鱼修士": ["摸鱼", "修士"],
  "划水侍郎": ["划水", "侍郎"],
  "摸鱼大将军": ["摸鱼", "大将军"],
  "假寐天尊": ["假寐", "天尊"],
};

export function getBigTierStampSvg(tier: string): string {
  const [top, bot] = BIG_TIER_STAMP_SPLITS[tier] || ["御史", "判官"];
  const botSize = bot.length >= 3 ? 50 : 64;
  // 朱红色统一，保留 weathered 感
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220" width="220" height="220">
      <defs>
        <filter id="stampNoise" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.18 0" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
      </defs>
      <rect x="14" y="14" width="192" height="192" fill="none" stroke="#a31a20" stroke-width="9" />
      <rect x="26" y="26" width="168" height="168" fill="none" stroke="#a31a20" stroke-width="2.5" stroke-dasharray="5 3" />
      <rect x="32" y="32" width="156" height="156" fill="none" stroke="#a31a20" stroke-width="1" opacity="0.5" />
      <text x="110" y="92" font-family="'STKaiti','Kaiti','STSong',serif" font-size="68" font-weight="900" fill="#a31a20" text-anchor="middle" letter-spacing="6">${top}</text>
      <text x="110" y="172" font-family="'STKaiti','Kaiti','STSong',serif" font-size="${botSize}" font-weight="900" fill="#a31a20" text-anchor="middle" letter-spacing="4">${bot}</text>
      <rect x="14" y="14" width="192" height="192" fill="#a31a20" filter="url(#stampNoise)" opacity="0.55" />
    </svg>
  `;
}

export function getBigTierStampUrl(tier: string): string {
  return getRawSvgUrl(getBigTierStampSvg(tier));
}

// === 摸鱼+N 金牌票据（参考海报左下角丝带牌） ===
export function getScoreTicketSvg(score: number): string {
  const delta = Math.max(1, Math.min(99, score)); // 显示用，避免 0/负数
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 110" width="240" height="110">
      <defs>
        <linearGradient id="goldgrad${delta}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ffe892"/>
          <stop offset="45%" stop-color="#f0c44a"/>
          <stop offset="100%" stop-color="#a87a20"/>
        </linearGradient>
      </defs>
      <!-- 票据外影 -->
      <path d="M10,35 L208,35 L222,55 L222,75 L208,95 L10,95 L24,75 L24,55 Z" fill="rgba(0,0,0,0.18)" transform="translate(3,4)" />
      <!-- 票据主体 -->
      <path d="M10,30 L208,30 L222,50 L222,70 L208,90 L10,90 L24,70 L24,50 Z" fill="url(#goldgrad${delta})" stroke="#6a3a10" stroke-width="3" />
      <!-- 内描边 -->
      <path d="M18,38 L200,38 L210,55 L210,65 L200,82 L18,82 L32,65 L32,55 Z" fill="none" stroke="#fff8c8" stroke-width="1.2" stroke-dasharray="3 2" opacity="0.8" />
      <!-- 两侧星 -->
      <text x="36" y="68" font-family="serif" font-size="16" fill="#fff8c8" font-weight="900">✦</text>
      <text x="195" y="68" font-family="serif" font-size="16" fill="#fff8c8" font-weight="900">✦</text>
      <!-- 主文字 -->
      <text x="120" y="72" font-family="'Impact','Arial Black','STHeiti',sans-serif" font-size="36" font-weight="900" fill="#5a2a08" text-anchor="middle" letter-spacing="2">摸鱼+${delta}</text>
    </svg>
  `;
}

export function getScoreTicketUrl(score: number): string {
  return getRawSvgUrl(getScoreTicketSvg(score));
}
