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
