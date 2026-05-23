# 摸鱼御史 · 后端 + Prompt + 兜底 + 联调 + 演示 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 25 小时黑客松窗口内，独自交付后端 `/analyze` 接口 + 御史 Prompt + 兜底素材 + 前后端联调 + 现场演示物料，确保主闭环可演示且现场断网/VLM 抽风也能跑。

**Architecture:** Vercel Serverless（`/api/analyze.ts` + `/api/health.ts`）+ TypeScript + ajv schema 校验 + 双 VLM（豆包 vision-pro 主、GPT-4o 备）+ 三档预录兜底（按 sha1(image) 匹配）+ 前端 `?offline=1` 双保险。后端只做 prompt 包装、schema 校验、score/tier 强一致、兜底降级，不做业务逻辑、不存图。

**Tech Stack:** Node 20 / TypeScript / Vercel Serverless / Express（本地 dev） / ajv / undici / dotenv / 豆包 vision-pro / GPT-4o（备选）

**设计依据:** [设计文档](../specs/2026-05-23-摸鱼御史-design.md) §3 §6 §11 §13；[API 契约](../../api-contract.md)

**时间预算:** 12 小时纯开发 + 3 小时联调 + 2 小时演示物料 = 17h，留 8h buffer 给 prompt 调优和睡眠。

---

## 文件结构

```
server/                              # 后端独立工程，与前端 src/ 隔离
├── package.json
├── tsconfig.json
├── vercel.json                      # Vercel 部署配置（rewrite + env）
├── .env.example                     # ARK_API_KEY / OPENAI_API_KEY / DEMO_MATCH_ON
├── .gitignore                       # node_modules / .env / dist / data
├── api/
│   ├── analyze.ts                   # /analyze 入口（Vercel serverless）
│   └── health.ts                    # /health 入口
├── lib/
│   ├── tier.ts                      # score → tier 映射 + 一致性强制
│   ├── schema.ts                    # ajv schema + validateAnalyzeResult
│   ├── prompt.ts                    # system + user prompt + few-shot
│   ├── vlm-doubao.ts                # 豆包 vision-pro 客户端
│   ├── vlm-gpt4o.ts                 # GPT-4o 备选客户端
│   ├── vlm.ts                       # 调度：豆包 → retry → GPT-4o → 兜底
│   ├── fallback.ts                  # §6.5 兜底模板
│   ├── demo-match.ts                # sha1(image) → 预录 JSON
│   ├── logger.ts                    # 埋点 JSONL append
│   └── types.ts                     # AnalyzeResult 类型
├── data/                            # 运行时埋点（不进 git）
│   └── events-YYYY-MM-DD.jsonl
├── scripts/
│   ├── prompt-bench.ts              # 批量跑测试图，输出对比 markdown
│   └── seed-demo-json.ts            # 拍完样本后，让 VLM 跑一遍并写入 assets/demo/*.json
└── test/
    ├── tier.test.ts
    ├── schema.test.ts
    ├── fallback.test.ts
    └── demo-match.test.ts

assets/demo/                          # 兜底素材（演示日命根子）
├── demo_01_趴桌.jpg
├── demo_01.json
├── demo_02_仰头.jpg
├── demo_02.json
├── demo_03_假思考.jpg
├── demo_03.json
└── hash-map.json                    # { sha1: "demo_01", ... }

docs/演示物料/                        # 5.24 上午前完成
├── 二维码-A4立牌.pdf
├── 名片-20张拼版.pdf
└── 演示checklist.md
```

---

## 阶段总览

| 阶段 | 任务 | 预估 | 截止 |
|---|---|---|---|
| 0 setup | T1 | 30m | 5.23 14:00 |
| 1 schema/tier/fallback | T2-T5 | 1.5h | 5.23 16:00 |
| 2 prompt | T6 | 1h | 5.23 17:00 |
| 3 VLM 客户端 | T7-T9 | 1.5h | 5.23 19:00 |
| 4 接口 | T10-T12 | 1h | 5.23 20:00 |
| 5 prompt 调试 | T13-T14 | 1.5h | 5.23 22:00 |
| 6 兜底素材 | T15-T17 | 1.5h | 5.24 00:30 |
| 7 部署 | T18 | 30m | 5.24 01:00 ←**死线** |
| 8 联调 | T19-T21 | 2h | 5.24 04:00（含小睡） |
| 9 演示物料 | T22-T25 | 2h | 5.24 11:00 |

死线约束：**5.24 01:00 主闭环必须能在 Vercel 公网链接上跑通（含 offline=1 路径）**。01:00 还跑不通就立即砍非核心：GPT-4o 备选 → 用兜底替；prompt-bench → 删；只保留豆包 + schema + 兜底 + 三张预录。

---

## Task 1: 后端工程脚手架

**Files:**
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `server/vercel.json`
- Create: `server/.env.example`
- Create: `server/.gitignore`

- [ ] **Step 1: 初始化 server 目录**

```bash
cd D:/Workspace/competitions/抖音创变者26.05.22
mkdir -p server/api server/lib server/test server/scripts server/data
cd server
```

- [ ] **Step 2: 写 `server/package.json`**

```json
{
  "name": "moyu-yushi-server",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vercel dev --listen 3000",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "bench": "tsx scripts/prompt-bench.ts",
    "seed-demo": "tsx scripts/seed-demo-json.ts"
  },
  "dependencies": {
    "ajv": "^8.12.0",
    "dotenv": "^16.4.5",
    "undici": "^6.19.8"
  },
  "devDependencies": {
    "@types/node": "^20.12.0",
    "@vercel/node": "^3.2.0",
    "tsx": "^4.16.0",
    "typescript": "^5.5.0",
    "vercel": "^34.0.0",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 3: 写 `server/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "isolatedModules": true,
    "noEmit": true,
    "types": ["node", "vitest/globals"]
  },
  "include": ["api/**/*", "lib/**/*", "scripts/**/*", "test/**/*"]
}
```

- [ ] **Step 4: 写 `server/vercel.json`**

```json
{
  "version": 2,
  "functions": {
    "api/analyze.ts": { "maxDuration": 30 },
    "api/health.ts": { "maxDuration": 5 }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,POST,OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Content-Type" }
      ]
    }
  ]
}
```

- [ ] **Step 5: 写 `server/.env.example`**

```
ARK_API_KEY=
ARK_MODEL=ep-vision-pro-xxxx
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o
DEMO_MATCH_ON=1
```

- [ ] **Step 6: 写 `server/.gitignore`**

```
node_modules/
.env
.env.local
data/
.vercel/
dist/
```

- [ ] **Step 7: 安装依赖**

```bash
npm install
```

Expected: 无报错，`node_modules` 出现。

- [ ] **Step 8: Commit**

```bash
cd D:/Workspace/competitions/抖音创变者26.05.22
git add server/package.json server/tsconfig.json server/vercel.json server/.env.example server/.gitignore
git commit -m "[后端] 工程脚手架 + Vercel + TS 配置"
```

---

## Task 2: 等级映射 + score/tier 一致性（TDD）

**Files:**
- Create: `server/lib/tier.ts`
- Test: `server/test/tier.test.ts`

依据：[设计文档 §4](../specs/2026-05-23-摸鱼御史-design.md#§4-等级系统mvp-主打玩法) 6 档表。

- [ ] **Step 1: 写失败测试 `server/test/tier.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { scoreToTier, enforceTierConsistency, TIERS } from '../lib/tier.js';

describe('scoreToTier', () => {
  it.each([
    [0, '打工新丁'], [20, '打工新丁'],
    [21, '划水学徒'], [40, '划水学徒'],
    [41, '摸鱼修士'], [60, '摸鱼修士'],
    [61, '划水侍郎'], [80, '划水侍郎'],
    [81, '摸鱼大将军'], [95, '摸鱼大将军'],
    [96, '假寐天尊'], [100, '假寐天尊'],
  ])('score=%d → %s', (score, tier) => {
    expect(scoreToTier(score)).toBe(tier);
  });

  it('clamps out-of-range scores', () => {
    expect(scoreToTier(-5)).toBe('打工新丁');
    expect(scoreToTier(150)).toBe('假寐天尊');
  });
});

describe('enforceTierConsistency', () => {
  it('keeps tier when consistent with score', () => {
    expect(enforceTierConsistency(87, '摸鱼大将军')).toBe('摸鱼大将军');
  });
  it('overrides tier when inconsistent', () => {
    expect(enforceTierConsistency(87, '打工新丁')).toBe('摸鱼大将军');
  });
});

describe('TIERS', () => {
  it('has all 6 tiers in order', () => {
    expect(TIERS).toEqual([
      '打工新丁', '划水学徒', '摸鱼修士', '划水侍郎', '摸鱼大将军', '假寐天尊'
    ]);
  });
});
```

- [ ] **Step 2: 跑测试，确认失败**

```bash
npm test -- tier
```

Expected: FAIL with "cannot find module ../lib/tier.js"

- [ ] **Step 3: 实现 `server/lib/tier.ts`**

```typescript
export const TIERS = [
  '打工新丁', '划水学徒', '摸鱼修士', '划水侍郎', '摸鱼大将军', '假寐天尊',
] as const;

export type Tier = typeof TIERS[number];

const TIER_RANGES: Array<[number, number, Tier]> = [
  [0, 20, '打工新丁'],
  [21, 40, '划水学徒'],
  [41, 60, '摸鱼修士'],
  [61, 80, '划水侍郎'],
  [81, 95, '摸鱼大将军'],
  [96, 100, '假寐天尊'],
];

export function scoreToTier(score: number): Tier {
  const s = Math.max(0, Math.min(100, Math.round(score)));
  for (const [lo, hi, tier] of TIER_RANGES) {
    if (s >= lo && s <= hi) return tier;
  }
  return '摸鱼修士';
}

export function enforceTierConsistency(score: number, claimed: string): Tier {
  const correct = scoreToTier(score);
  return correct;
}
```

- [ ] **Step 4: 跑测试，确认全部通过**

```bash
npm test -- tier
```

Expected: PASS 14/14

- [ ] **Step 5: Commit**

```bash
git add server/lib/tier.ts server/test/tier.test.ts
git commit -m "[后端] 等级映射 + score/tier 一致性强制"
```

---

## Task 3: AnalyzeResult 类型定义

**Files:**
- Create: `server/lib/types.ts`

- [ ] **Step 1: 写 `server/lib/types.ts`**

```typescript
import type { Tier } from './tier.js';

export const POSE_TYPES = [
  '趴桌型', '仰头型', '手撑头型', '椅背瘫型',
  '走神望天型', '假装思考型', '无人值守型',
] as const;

export type PoseType = typeof POSE_TYPES[number];

export interface FaceBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface AnalyzeResult {
  pose_type: PoseType;
  desk_objects: string[];
  moyu_score: number;
  level_tier: Tier;
  title_candidates: [string, string, string];
  report: {
    paragraph: string;
    yi: [string, string, string];
    ji: [string, string, string];
  };
  face_boxes: FaceBox[];
}

export interface AnalyzeRequest {
  image: string;
  provider?: 'doubao' | 'gpt4o';
}
```

- [ ] **Step 2: 类型检查**

```bash
npm run typecheck
```

Expected: 无错误。

- [ ] **Step 3: Commit**

```bash
git add server/lib/types.ts
git commit -m "[后端] AnalyzeResult 类型定义"
```

---

## Task 4: ajv schema 校验（TDD）

**Files:**
- Create: `server/lib/schema.ts`
- Test: `server/test/schema.test.ts`

依据：[设计文档 §6.3](../specs/2026-05-23-摸鱼御史-design.md#63-json-schema-强约束)

- [ ] **Step 1: 写失败测试**

```typescript
// server/test/schema.test.ts
import { describe, it, expect } from 'vitest';
import { validateAnalyzeResult } from '../lib/schema.js';

const VALID = {
  pose_type: '趴桌型',
  desk_objects: ['半杯冷美式', '青轴键盘'],
  moyu_score: 87,
  level_tier: '摸鱼大将军',
  title_candidates: ['划水大将军', '假寐侍郎', '摸鱼世家'],
  report: {
    paragraph: '紫微星偏移3度，案上美式已凉，足证神游天外不下半盏茶时辰。',
    yi: ['摸鱼', '划水', '假装思考'],
    ji: ['开会', '改PPT', '接电话'],
  },
  face_boxes: [{ x: 0.32, y: 0.18, w: 0.24, h: 0.28 }],
};

describe('validateAnalyzeResult', () => {
  it('accepts a fully valid result', () => {
    const r = validateAnalyzeResult(VALID);
    expect(r.ok).toBe(true);
  });

  it('rejects missing required fields', () => {
    const bad = { ...VALID } as any;
    delete bad.moyu_score;
    const r = validateAnalyzeResult(bad);
    expect(r.ok).toBe(false);
    expect(r.errors?.[0]).toMatch(/moyu_score/);
  });

  it('rejects pose_type not in enum', () => {
    const r = validateAnalyzeResult({ ...VALID, pose_type: '飞天型' });
    expect(r.ok).toBe(false);
  });

  it('rejects score out of range', () => {
    const r = validateAnalyzeResult({ ...VALID, moyu_score: 150 });
    expect(r.ok).toBe(false);
  });

  it('rejects title_candidates length != 3', () => {
    const r = validateAnalyzeResult({ ...VALID, title_candidates: ['a', 'b'] });
    expect(r.ok).toBe(false);
  });

  it('rejects paragraph shorter than 30 chars', () => {
    const r = validateAnalyzeResult({
      ...VALID,
      report: { ...VALID.report, paragraph: '太短了' },
    });
    expect(r.ok).toBe(false);
  });

  it('rejects yi/ji length != 3', () => {
    const r = validateAnalyzeResult({
      ...VALID,
      report: { ...VALID.report, yi: ['摸鱼', '划水'] },
    });
    expect(r.ok).toBe(false);
  });

  it('accepts empty face_boxes array', () => {
    const r = validateAnalyzeResult({ ...VALID, face_boxes: [] });
    expect(r.ok).toBe(true);
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

```bash
npm test -- schema
```

Expected: FAIL with "cannot find module"

- [ ] **Step 3: 实现 `server/lib/schema.ts`**

```typescript
import Ajv from 'ajv';
import { POSE_TYPES } from './types.js';
import { TIERS } from './tier.js';

const ajv = new Ajv({ allErrors: true });

const schema = {
  type: 'object',
  required: [
    'pose_type', 'desk_objects', 'moyu_score', 'level_tier',
    'title_candidates', 'report', 'face_boxes',
  ],
  additionalProperties: true,
  properties: {
    pose_type: { type: 'string', enum: [...POSE_TYPES] },
    desk_objects: {
      type: 'array', minItems: 0, maxItems: 5,
      items: { type: 'string', minLength: 1, maxLength: 30 },
    },
    moyu_score: { type: 'integer', minimum: 0, maximum: 100 },
    level_tier: { type: 'string', enum: [...TIERS] },
    title_candidates: {
      type: 'array', minItems: 3, maxItems: 3,
      items: { type: 'string', minLength: 3, maxLength: 8 },
    },
    report: {
      type: 'object',
      required: ['paragraph', 'yi', 'ji'],
      properties: {
        paragraph: { type: 'string', minLength: 30, maxLength: 120 },
        yi: { type: 'array', minItems: 3, maxItems: 3, items: { type: 'string', minLength: 1, maxLength: 6 } },
        ji: { type: 'array', minItems: 3, maxItems: 3, items: { type: 'string', minLength: 1, maxLength: 6 } },
      },
    },
    face_boxes: {
      type: 'array',
      items: {
        type: 'object',
        required: ['x', 'y', 'w', 'h'],
        properties: {
          x: { type: 'number', minimum: 0, maximum: 1 },
          y: { type: 'number', minimum: 0, maximum: 1 },
          w: { type: 'number', minimum: 0, maximum: 1 },
          h: { type: 'number', minimum: 0, maximum: 1 },
        },
      },
    },
  },
} as const;

const validate = ajv.compile(schema);

export interface ValidationResult {
  ok: boolean;
  errors?: string[];
}

export function validateAnalyzeResult(data: unknown): ValidationResult {
  const ok = validate(data);
  if (ok) return { ok: true };
  return {
    ok: false,
    errors: (validate.errors ?? []).map((e) => `${e.instancePath || '/'} ${e.message}`),
  };
}
```

- [ ] **Step 4: 跑测试**

```bash
npm test -- schema
```

Expected: PASS 8/8

- [ ] **Step 5: Commit**

```bash
git add server/lib/schema.ts server/test/schema.test.ts
git commit -m "[后端] ajv schema 校验 + 8 项约束测试"
```

---

## Task 5: 兜底模板（TDD）

**Files:**
- Create: `server/lib/fallback.ts`
- Test: `server/test/fallback.test.ts`

依据：[设计文档 §6.5](../specs/2026-05-23-摸鱼御史-design.md#65-兜底模板vlm-全挂的最后一道)

- [ ] **Step 1: 写测试**

```typescript
// server/test/fallback.test.ts
import { describe, it, expect } from 'vitest';
import { FALLBACK_RESULT, makeFallback } from '../lib/fallback.js';
import { validateAnalyzeResult } from '../lib/schema.js';

describe('FALLBACK_RESULT', () => {
  it('passes schema validation', () => {
    const r = validateAnalyzeResult(FALLBACK_RESULT);
    expect(r.ok).toBe(true);
  });
});

describe('makeFallback', () => {
  it('returns a deep clone (no shared reference)', () => {
    const a = makeFallback();
    const b = makeFallback();
    a.title_candidates[0] = 'mutated';
    expect(b.title_candidates[0]).not.toBe('mutated');
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

```bash
npm test -- fallback
```

Expected: FAIL

- [ ] **Step 3: 实现 `server/lib/fallback.ts`**

```typescript
import type { AnalyzeResult } from './types.js';

export const FALLBACK_RESULT: AnalyzeResult = {
  pose_type: '假装思考型',
  desk_objects: ['显示器', '桌面'],
  moyu_score: 60,
  level_tier: '摸鱼修士',
  title_candidates: ['半日仙人', '神游侍中', '摸鱼修士'],
  report: {
    paragraph: '御史台今日观星不利，未能洞察该员摸鱼真章。然紫微入命，姑且记为中等划水，待来日补审。',
    yi: ['再摸一会', '等下班', '假装思考'],
    ji: ['被领导看到', '开会发言', '改PPT'],
  },
  face_boxes: [],
};

export function makeFallback(): AnalyzeResult {
  return JSON.parse(JSON.stringify(FALLBACK_RESULT));
}
```

- [ ] **Step 4: 跑测试**

```bash
npm test -- fallback
```

Expected: PASS 2/2

- [ ] **Step 5: Commit**

```bash
git add server/lib/fallback.ts server/test/fallback.test.ts
git commit -m "[后端] 兜底模板（VLM 全挂保命路径）"
```

---

## Task 6: Prompt 模块

**Files:**
- Create: `server/lib/prompt.ts`

依据：[设计文档 §6.1 / §6.2 / §6.4](../specs/2026-05-23-摸鱼御史-design.md#§6-prompt-工程vlm-调性命门)

- [ ] **Step 1: 实现 `server/lib/prompt.ts`**

```typescript
export const SYSTEM_PROMPT = `你是「摸鱼御史」，一位穿越到现代办公室的明代御史台官员，专门记录同事的摸鱼证据。
你的语气：半文半白、玄学占卜、互联网梗调（不要 emoji，不要用 yyds/绝绝子 等流行语缩写）。
你的工作：观察用户上传的办公室照片，给出摸鱼评分 + 段位称号 + 一份御史奏折。

输出原则：
1. 摸鱼是社交货币，语气嘲讽但不刻薄，不羞辱当事人
2. 不评价相貌、体型、性别、肤色；只描述姿态与桌面物件
3. 不识别真实身份；只用"该员"、"卿"等代称
4. 严格按照 JSON schema 输出，不要额外文字、不要 markdown 代码块包裹
5. 中文输出`;

export const USER_PROMPT = `请以摸鱼御史身份审阅此图。要求：

【姿态分类 pose_type】从以下挑一个最贴近的：
  趴桌型 / 仰头型 / 手撑头型 / 椅背瘫型 / 走神望天型 / 假装思考型 / 无人值守型

【桌面线索 desk_objects】肉眼可见的 2-4 件物品，越具体越好（"半杯冷美式" 优于 "咖啡"）

【摸鱼评分 moyu_score】0-100 整数。判分参考：
  - 闭眼 +30；趴下 +20；屏幕黑屏 +15；桌面有零食 +10；桌面有未喝完饮料 +5
  - 屏幕亮着且有代码/PPT -20；手在键盘上 -15
  评分要稳健，能根据视觉信号合理推断。

【段位 level_tier】根据 moyu_score 严格映射，不可错档：
  - 0-20   → 打工新丁
  - 21-40  → 划水学徒
  - 41-60  → 摸鱼修士
  - 61-80  → 划水侍郎
  - 81-95  → 摸鱼大将军
  - 96-100 → 假寐天尊

【候选称号 title_candidates】3 个具体称号，必须与 level_tier 调性一致：
  - 3-8 字、朱红印章风
  - 第一个为推荐主称号（最贴该图调性），后两个为备选风味
  - 例（划水侍郎段位）：["假寐侍郎", "神隐巡按", "走神判官"]

【御史奏折 report】
  - paragraph：30-120 字玄学解读，必须包含 "紫微/天罡/方位/时辰" 等占卜词 + 1 个具体桌面物件
  - yi（今日宜）：3 项，动词短语，每项 ≤ 5 字
  - ji（今日忌）：3 项，动词短语，每项 ≤ 5 字

【人脸框 face_boxes】所有检测到的人脸，归一化坐标 [0,1]。无人脸返回 []

直接输出 JSON，不要解释。

参考样例（输入：戴眼镜的人趴在桌上，旁边马克杯、机械键盘、亮着的双屏）：
{
  "pose_type": "趴桌型",
  "desk_objects": ["半杯冷美式", "青轴机械键盘", "亮着的双屏"],
  "moyu_score": 78,
  "level_tier": "划水侍郎",
  "title_candidates": ["假寐侍郎", "神隐巡按", "走神判官"],
  "report": {
    "paragraph": "该员紫微星偏东南三度，恰逢未时困乏方位，案上美式已凉，足证神游天外不下半盏茶时辰。屏虽亮而魂已远，特此记档。",
    "yi": ["闭目养神", "假装思考", "等下班"],
    "ji": ["开周会", "改PPT", "接电话"]
  },
  "face_boxes": [{ "x": 0.36, "y": 0.22, "w": 0.20, "h": 0.24 }]
}`;

export const RETRY_PROMPT = `上一次输出未通过 JSON schema 校验，错误信息：{ERRORS}
请严格按照上文 schema 重新输出，只输出 JSON，不要包裹代码块，不要解释。`;

export function buildRetryPrompt(errors: string[]): string {
  return RETRY_PROMPT.replace('{ERRORS}', errors.join('; '));
}
```

- [ ] **Step 2: 类型检查**

```bash
npm run typecheck
```

Expected: 无错误。

- [ ] **Step 3: Commit**

```bash
git add server/lib/prompt.ts
git commit -m "[后端] Prompt 模块（system + user + few-shot + retry）"
```

---

## Task 7: 豆包 vision-pro 客户端

**Files:**
- Create: `server/lib/vlm-doubao.ts`

参考：火山方舟 OpenAPI 兼容 endpoint `https://ark.cn-beijing.volces.com/api/v3/chat/completions`，模型 ID 为创建推理接入点（ep-*）后获得。

- [ ] **Step 1: 实现 `server/lib/vlm-doubao.ts`**

```typescript
import { fetch } from 'undici';

const ARK_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';

export interface DoubaoCallOptions {
  imageBase64: string;
  systemPrompt: string;
  userPrompt: string;
  timeoutMs?: number;
}

export interface DoubaoCallResult {
  ok: true;
  raw: string;
  latencyMs: number;
} | {
  ok: false;
  error: string;
  latencyMs: number;
}

export async function callDoubao(opts: DoubaoCallOptions): Promise<DoubaoCallResult> {
  const apiKey = process.env.ARK_API_KEY;
  const model = process.env.ARK_MODEL;
  if (!apiKey || !model) {
    return { ok: false, error: 'ARK_API_KEY or ARK_MODEL missing', latencyMs: 0 };
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 15000);
  const start = Date.now();

  try {
    const res = await fetch(ARK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: opts.systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: opts.userPrompt },
              { type: 'image_url', image_url: { url: opts.imageBase64 } },
            ],
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
        response_format: { type: 'json_object' },
      }),
      signal: ctrl.signal,
    });

    const latencyMs = Date.now() - start;
    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `http ${res.status}: ${body.slice(0, 200)}`, latencyMs };
    }
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = json.choices?.[0]?.message?.content;
    if (!content) {
      return { ok: false, error: 'empty content', latencyMs };
    }
    return { ok: true, raw: content, latencyMs };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? String(e), latencyMs: Date.now() - start };
  } finally {
    clearTimeout(timer);
  }
}
```

- [ ] **Step 2: 类型检查**

```bash
npm run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add server/lib/vlm-doubao.ts
git commit -m "[后端] 豆包 vision-pro 客户端（OpenAPI 兼容 + 超时）"
```

---

## Task 8: GPT-4o 备选客户端

**Files:**
- Create: `server/lib/vlm-gpt4o.ts`

- [ ] **Step 1: 实现 `server/lib/vlm-gpt4o.ts`**

```typescript
import { fetch } from 'undici';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

export interface GPT4oCallOptions {
  imageBase64: string;
  systemPrompt: string;
  userPrompt: string;
  timeoutMs?: number;
}

export type GPT4oCallResult =
  | { ok: true; raw: string; latencyMs: number }
  | { ok: false; error: string; latencyMs: number };

export async function callGPT4o(opts: GPT4oCallOptions): Promise<GPT4oCallResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL ?? 'gpt-4o';
  if (!apiKey) return { ok: false, error: 'OPENAI_API_KEY missing', latencyMs: 0 };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 15000);
  const start = Date.now();

  try {
    const res = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: opts.systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: opts.userPrompt },
              { type: 'image_url', image_url: { url: opts.imageBase64 } },
            ],
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
        response_format: { type: 'json_object' },
      }),
      signal: ctrl.signal,
    });

    const latencyMs = Date.now() - start;
    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `http ${res.status}: ${body.slice(0, 200)}`, latencyMs };
    }
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = json.choices?.[0]?.message?.content;
    if (!content) return { ok: false, error: 'empty content', latencyMs };
    return { ok: true, raw: content, latencyMs };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? String(e), latencyMs: Date.now() - start };
  } finally {
    clearTimeout(timer);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add server/lib/vlm-gpt4o.ts
git commit -m "[后端] GPT-4o 备选 VLM 客户端"
```

---

## Task 9: VLM 调度（豆包 → retry → GPT-4o → 兜底）

**Files:**
- Create: `server/lib/vlm.ts`

- [ ] **Step 1: 实现 `server/lib/vlm.ts`**

```typescript
import { callDoubao } from './vlm-doubao.js';
import { callGPT4o } from './vlm-gpt4o.js';
import { SYSTEM_PROMPT, USER_PROMPT, buildRetryPrompt } from './prompt.js';
import { validateAnalyzeResult } from './schema.js';
import { enforceTierConsistency } from './tier.js';
import { makeFallback } from './fallback.js';
import type { AnalyzeResult } from './types.js';

export interface VLMTrace {
  attempts: Array<{
    provider: 'doubao' | 'gpt4o';
    attempt: number;
    ok: boolean;
    latencyMs: number;
    schemaOk?: boolean;
    error?: string;
  }>;
  finalSource: 'doubao' | 'gpt4o' | 'fallback';
  totalMs: number;
}

function tryParseJson(raw: string): unknown | null {
  try {
    return JSON.parse(raw);
  } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try { return JSON.parse(m[0]); } catch { return null; }
  }
}

function postProcess(parsed: any): AnalyzeResult {
  parsed.level_tier = enforceTierConsistency(parsed.moyu_score, parsed.level_tier);
  return parsed as AnalyzeResult;
}

export async function analyzeWithVLM(
  imageBase64: string,
  preferProvider: 'doubao' | 'gpt4o' = 'doubao',
): Promise<{ result: AnalyzeResult; trace: VLMTrace }> {
  const start = Date.now();
  const trace: VLMTrace = { attempts: [], finalSource: 'fallback', totalMs: 0 };

  const order: Array<'doubao' | 'gpt4o'> =
    preferProvider === 'gpt4o' ? ['gpt4o', 'doubao'] : ['doubao', 'gpt4o'];

  for (const provider of order) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      const lastErrors = attempt === 2
        ? trace.attempts.filter(a => a.provider === provider).flatMap(a => a.error ? [a.error] : [])
        : [];
      const userPrompt = attempt === 1
        ? USER_PROMPT
        : `${USER_PROMPT}\n\n${buildRetryPrompt(lastErrors)}`;

      const call = provider === 'doubao'
        ? await callDoubao({ imageBase64, systemPrompt: SYSTEM_PROMPT, userPrompt })
        : await callGPT4o({ imageBase64, systemPrompt: SYSTEM_PROMPT, userPrompt });

      if (!call.ok) {
        trace.attempts.push({ provider, attempt, ok: false, latencyMs: call.latencyMs, error: call.error });
        continue;
      }

      const parsed = tryParseJson(call.raw);
      if (!parsed) {
        trace.attempts.push({ provider, attempt, ok: true, latencyMs: call.latencyMs, schemaOk: false, error: 'not json' });
        continue;
      }

      const v = validateAnalyzeResult(parsed);
      if (!v.ok) {
        trace.attempts.push({ provider, attempt, ok: true, latencyMs: call.latencyMs, schemaOk: false, error: v.errors?.join('; ') });
        continue;
      }

      trace.attempts.push({ provider, attempt, ok: true, latencyMs: call.latencyMs, schemaOk: true });
      trace.finalSource = provider;
      trace.totalMs = Date.now() - start;
      return { result: postProcess(parsed), trace };
    }
  }

  trace.finalSource = 'fallback';
  trace.totalMs = Date.now() - start;
  return { result: makeFallback(), trace };
}
```

- [ ] **Step 2: 类型检查**

```bash
npm run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add server/lib/vlm.ts
git commit -m "[后端] VLM 调度（豆包主 + retry + GPT-4o 备 + 兜底）"
```

---

## Task 10: demo hash 匹配器（TDD）

**Files:**
- Create: `server/lib/demo-match.ts`
- Test: `server/test/demo-match.test.ts`

依据：[设计文档 §11.2](../specs/2026-05-23-摸鱼御史-design.md#112-兜底触发机制前端) —— 现场预录图被上传时，按 sha1 匹配直接返回手调过的 JSON，不调 VLM。

- [ ] **Step 1: 写测试**

```typescript
// server/test/demo-match.test.ts
import { describe, it, expect } from 'vitest';
import { sha1OfBase64, matchDemoResult } from '../lib/demo-match.js';

describe('sha1OfBase64', () => {
  it('strips data url prefix before hashing', () => {
    const a = sha1OfBase64('data:image/jpeg;base64,SGVsbG8=');
    const b = sha1OfBase64('SGVsbG8=');
    expect(a).toBe(b);
    expect(a).toHaveLength(40);
  });
});

describe('matchDemoResult', () => {
  it('returns null when hash not in map', () => {
    expect(matchDemoResult('not-a-real-hash', {})).toBeNull();
  });
  it('returns the mapped result', () => {
    const fakeMap = {
      'abc123': { pose_type: '趴桌型' } as any,
    };
    expect(matchDemoResult('abc123', fakeMap)).toEqual({ pose_type: '趴桌型' });
  });
});
```

- [ ] **Step 2: 实现 `server/lib/demo-match.ts`**

```typescript
import { createHash } from 'node:crypto';
import type { AnalyzeResult } from './types.js';

export function sha1OfBase64(b64: string): string {
  const stripped = b64.replace(/^data:image\/[^;]+;base64,/, '');
  return createHash('sha1').update(stripped).digest('hex');
}

export function matchDemoResult(
  hash: string,
  map: Record<string, AnalyzeResult>,
): AnalyzeResult | null {
  return map[hash] ?? null;
}
```

- [ ] **Step 3: 跑测试**

```bash
npm test -- demo-match
```

Expected: PASS 3/3

- [ ] **Step 4: Commit**

```bash
git add server/lib/demo-match.ts server/test/demo-match.test.ts
git commit -m "[后端] demo hash 匹配（演示样本图直返预录 JSON）"
```

---

## Task 11: 埋点日志

**Files:**
- Create: `server/lib/logger.ts`

依据：[设计文档 §13](../specs/2026-05-23-摸鱼御史-design.md#§13-埋点--数据观测)

- [ ] **Step 1: 实现 `server/lib/logger.ts`**

```typescript
import { appendFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const DATA_DIR = process.env.DATA_DIR ?? join(process.cwd(), 'data');

export interface EventBase {
  ev: string;
  [k: string]: unknown;
}

export async function logEvent(ev: EventBase): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const file = join(DATA_DIR, `events-${today}.jsonl`);
  const line = JSON.stringify({ t: Math.floor(Date.now() / 1000), ...ev }) + '\n';
  try {
    await mkdir(dirname(file), { recursive: true });
    await appendFile(file, line, 'utf8');
  } catch {
    // 埋点失败不影响主流程
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add server/lib/logger.ts
git commit -m "[后端] JSONL 埋点（VLM 延迟 / score 分布）"
```

---

## Task 12: /api/analyze 入口

**Files:**
- Create: `server/api/analyze.ts`
- Create: `server/api/health.ts`
- Modify: `assets/demo/hash-map.json`（先建个空 `{}`，Task 17 写入）

- [ ] **Step 1: 建立空的 hash-map**

```bash
mkdir -p D:/Workspace/competitions/抖音创变者26.05.22/assets/demo
echo "{}" > D:/Workspace/competitions/抖音创变者26.05.22/assets/demo/hash-map.json
```

- [ ] **Step 2: 实现 `server/api/health.ts`**

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ status: 'ok', ts: Math.floor(Date.now() / 1000) });
}
```

- [ ] **Step 3: 实现 `server/api/analyze.ts`**

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { analyzeWithVLM } from '../lib/vlm.js';
import { sha1OfBase64, matchDemoResult } from '../lib/demo-match.js';
import { makeFallback } from '../lib/fallback.js';
import { validateAnalyzeResult } from '../lib/schema.js';
import { logEvent } from '../lib/logger.js';
import type { AnalyzeResult, AnalyzeRequest } from '../lib/types.js';

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const HASH_MAP_PATH = join(process.cwd(), '..', 'assets', 'demo', 'hash-map.json');

let demoMapCache: Record<string, AnalyzeResult> | null = null;
async function loadDemoMap(): Promise<Record<string, AnalyzeResult>> {
  if (demoMapCache) return demoMapCache;
  try {
    const raw = await readFile(HASH_MAP_PATH, 'utf8');
    demoMapCache = JSON.parse(raw);
    return demoMapCache!;
  } catch {
    demoMapCache = {};
    return demoMapCache;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'METHOD_NOT_ALLOWED' }); return; }

  const body = req.body as AnalyzeRequest | undefined;
  if (!body || typeof body.image !== 'string') {
    res.status(400).json({ error: 'MISSING_IMAGE', message: '缺 image 字段' });
    return;
  }
  if (body.image.length > MAX_IMAGE_BYTES * 1.4) {
    res.status(400).json({ error: 'INVALID_IMAGE', message: 'image base64 超过 2MB' });
    return;
  }

  const hash = sha1OfBase64(body.image);
  await logEvent({ ev: 'analyze_start', hash });

  // 1. demo hash 短路
  if (process.env.DEMO_MATCH_ON !== '0') {
    const demoMap = await loadDemoMap();
    const hit = matchDemoResult(hash, demoMap);
    if (hit) {
      const v = validateAnalyzeResult(hit);
      if (v.ok) {
        await logEvent({ ev: 'analyze_demo_hit', hash, tier: hit.level_tier, score: hit.moyu_score });
        res.status(200).json(hit);
        return;
      }
    }
  }

  // 2. VLM 调度
  try {
    const { result, trace } = await analyzeWithVLM(body.image, body.provider ?? 'doubao');
    await logEvent({
      ev: 'analyze_success',
      ms: trace.totalMs,
      source: trace.finalSource,
      score: result.moyu_score,
      tier: result.level_tier,
      attempts: trace.attempts.length,
    });
    res.status(200).json(result);
  } catch (e: any) {
    await logEvent({ ev: 'analyze_error', err: e?.message ?? String(e) });
    res.status(200).json(makeFallback());
  }
}

export const config = {
  api: { bodyParser: { sizeLimit: '4mb' } },
};
```

- [ ] **Step 4: 本地启动 dev server**

```bash
cd D:/Workspace/competitions/抖音创变者26.05.22/server
# 先填好 .env
cp .env.example .env
# 编辑 .env 写入 ARK_API_KEY 和 ARK_MODEL
npm run dev
```

Expected: vercel dev 在 :3000 监听，无错误。

- [ ] **Step 5: 冒烟测试 /health**

```bash
curl http://localhost:3000/api/health
```

Expected: `{"status":"ok","ts":...}`

- [ ] **Step 6: 冒烟测试 /analyze（小图）**

```bash
# 准备一张 1KB 的测试 jpg，base64 编码后塞进 body
node -e "const fs=require('fs');const b=fs.readFileSync('test.jpg').toString('base64');fs.writeFileSync('payload.json',JSON.stringify({image:'data:image/jpeg;base64,'+b}));"
curl -X POST http://localhost:3000/api/analyze -H "Content-Type: application/json" -d @payload.json
```

Expected: 返回完整 AnalyzeResult JSON，或兜底（取决于 VLM 是否通）。

- [ ] **Step 7: Commit**

```bash
git add server/api/analyze.ts server/api/health.ts assets/demo/hash-map.json
git commit -m "[后端] /analyze + /health 入口（demo 短路 → VLM → 兜底）"
```

---

## Task 13: Prompt 调试 sandbox

**Files:**
- Create: `server/scripts/prompt-bench.ts`
- Create: `server/scripts/bench-fixtures/`（放 3-5 张测试图）

目标：在不依赖前端的情况下，跑一批本地图片过 VLM，输出对比表，肉眼判断 prompt 调性是否稳。

- [ ] **Step 1: 实现 `server/scripts/prompt-bench.ts`**

```typescript
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { join, basename, extname } from 'node:path';
import { analyzeWithVLM } from '../lib/vlm.js';
import 'dotenv/config';

const FIXTURES_DIR = join(process.cwd(), 'scripts', 'bench-fixtures');
const OUT_PATH = join(process.cwd(), 'scripts', 'bench-report.md');
const RUNS_PER_IMAGE = 3;

async function imageToBase64(path: string): Promise<string> {
  const buf = await readFile(path);
  const ext = extname(path).slice(1).toLowerCase();
  return `data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,${buf.toString('base64')}`;
}

async function main() {
  await mkdir(FIXTURES_DIR, { recursive: true });
  const files = (await readdir(FIXTURES_DIR)).filter(f => /\.(jpe?g|png)$/i.test(f));
  if (files.length === 0) {
    console.error(`没有 fixture 图。请把测试图放进 ${FIXTURES_DIR}`);
    process.exit(1);
  }

  const rows: string[] = [
    `# Prompt Bench Report — ${new Date().toISOString()}`,
    '',
    `每张图跑 ${RUNS_PER_IMAGE} 次，观察 score 抖动、称号调性、奏折稳定性。`,
    '',
  ];

  for (const f of files) {
    rows.push(`## ${f}`, '');
    const b64 = await imageToBase64(join(FIXTURES_DIR, f));
    rows.push('| run | score | tier | title[0] | pose | latency | source |');
    rows.push('|---|---|---|---|---|---|---|');
    const reports: string[] = [];
    for (let i = 1; i <= RUNS_PER_IMAGE; i++) {
      const { result, trace } = await analyzeWithVLM(b64);
      rows.push(`| ${i} | ${result.moyu_score} | ${result.level_tier} | ${result.title_candidates[0]} | ${result.pose_type} | ${trace.totalMs}ms | ${trace.finalSource} |`);
      reports.push(`run${i}: ${result.report.paragraph}`);
    }
    rows.push('', '<details><summary>奏折正文</summary>', '', ...reports.map(r => `- ${r}`), '', '</details>', '');
  }

  await writeFile(OUT_PATH, rows.join('\n'), 'utf8');
  console.log(`报告写入 ${OUT_PATH}`);
}

main().catch(e => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: 放入 fixtures**

```bash
mkdir -p D:/Workspace/competitions/抖音创变者26.05.22/server/scripts/bench-fixtures
# 拷贝任意 3-5 张办公室照片进去（趴桌 / 仰头 / 正常工作 / 假装思考各一张）
```

- [ ] **Step 3: 跑一遍**

```bash
cd D:/Workspace/competitions/抖音创变者26.05.22/server
npm run bench
```

Expected: `scripts/bench-report.md` 生成。打开看每张图 3 次输出。

- [ ] **Step 4: Commit**

```bash
git add server/scripts/prompt-bench.ts
git commit -m "[后端] prompt-bench 调试脚本（批量跑图 + markdown 报告）"
```

---

## Task 14: Prompt 调优迭代

**Files:**
- Modify: `server/lib/prompt.ts`

目标：根据 Task 13 的报告，把 prompt 调到稳定。

- [ ] **Step 1: 看 bench-report.md，标出问题**

判定规则（必须全过）：
- 同一图 3 次 score 波动 ≤ 10
- title_candidates 调性与 tier 匹配（"摸鱼大将军" 段位不出现"凡人"等破调字眼）
- paragraph 出现"紫微/天罡/方位/时辰"等占卜词
- yi/ji 每项 ≤ 5 字
- 不返回 emoji / markdown 代码块包裹

- [ ] **Step 2: 针对性改 prompt**

常见调整点（按出现频率）：
- score 飘 → 在 USER_PROMPT「判分参考」里加更多具体规则示例
- 称号破调 → 在 few-shot 里加 2 个不同 tier 的样例
- 奏折出 emoji → 在 SYSTEM_PROMPT 加强"不要 emoji"
- JSON 外多余文字 → 在 USER_PROMPT 末尾加"直接输出 JSON 第一个字符必须是 {"

直接修改 `server/lib/prompt.ts` 中的常量字符串。

- [ ] **Step 3: 重跑 bench**

```bash
npm run bench
```

迭代 2-3 次到稳定为止。**时间盒：1 小时上限，超时就接受现状进下一步**。

- [ ] **Step 4: Commit**

```bash
git add server/lib/prompt.ts server/scripts/bench-report.md
git commit -m "[后端] Prompt 调优：score 稳定 + 调性收紧 + JSON 输出净化"
```

---

## Task 15: 拍演示样本图

**Files:**
- Create: `assets/demo/demo_01_趴桌.jpg`
- Create: `assets/demo/demo_02_仰头.jpg`
- Create: `assets/demo/demo_03_假思考.jpg`

依据：[设计文档 §11.1](../specs/2026-05-23-摸鱼御史-design.md#111-预录样例3-张全闭环可用)

- [ ] **Step 1: 摆拍/找图**

3 张照片必须明确分档：

| 文件名 | 场景要点 | 目标分段 |
|---|---|---|
| `demo_01_趴桌.jpg` | 趴桌闭眼 + 桌上凉咖啡 + 黑屏显示器 | 95+ 假寐天尊（演示主爆点）|
| `demo_02_仰头.jpg` | 椅背瘫仰头 + 显示器亮但放空 | 65-75 划水侍郎 |
| `demo_03_假思考.jpg` | 手撑下巴 + 屏幕有 PPT/代码 | 30-40 划水学徒 |

要求：
- JPG，短边压到 1024px（用 `mogrify -resize 1024x` 或在线工具）
- 文件大小 ≤ 500KB 每张
- 面部模糊或主角同意出镜
- 桌面线索清晰（凉咖啡、键盘、屏幕状态肉眼可辨）

- [ ] **Step 2: 放入 `assets/demo/`**

```bash
ls D:/Workspace/competitions/抖音创变者26.05.22/assets/demo/
```

Expected: 3 张 jpg 都在。

- [ ] **Step 3: Commit（jpg 进 git，因为这是兜底命根子，必须随代码走）**

```bash
cd D:/Workspace/competitions/抖音创变者26.05.22
git add assets/demo/demo_01_趴桌.jpg assets/demo/demo_02_仰头.jpg assets/demo/demo_03_假思考.jpg
git commit -m "[素材] 3 张演示样本图（95/70/35 三档）"
```

---

## Task 16: 用 VLM 跑出三张样本图的 JSON 并手调

**Files:**
- Create: `server/scripts/seed-demo-json.ts`
- Create: `assets/demo/demo_01.json`
- Create: `assets/demo/demo_02.json`
- Create: `assets/demo/demo_03.json`

- [ ] **Step 1: 实现 `server/scripts/seed-demo-json.ts`**

```typescript
import { readFile, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { analyzeWithVLM } from '../lib/vlm.js';
import 'dotenv/config';

const DEMOS = [
  { img: 'demo_01_趴桌.jpg', out: 'demo_01.json' },
  { img: 'demo_02_仰头.jpg', out: 'demo_02.json' },
  { img: 'demo_03_假思考.jpg', out: 'demo_03.json' },
];

const ASSETS = join(process.cwd(), '..', 'assets', 'demo');

async function toB64(path: string): Promise<string> {
  const buf = await readFile(path);
  const ext = extname(path).slice(1).toLowerCase();
  return `data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,${buf.toString('base64')}`;
}

async function main() {
  for (const { img, out } of DEMOS) {
    console.log(`>>> ${img}`);
    const b64 = await toB64(join(ASSETS, img));
    const { result, trace } = await analyzeWithVLM(b64);
    console.log(`score=${result.moyu_score} tier=${result.level_tier} source=${trace.finalSource}`);
    await writeFile(join(ASSETS, out), JSON.stringify(result, null, 2), 'utf8');
  }
  console.log('done. 现在手工编辑这 3 个 JSON，把称号 / 奏折调到最惊艳。');
}
main().catch(e => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: 跑脚本**

```bash
cd D:/Workspace/competitions/抖音创变者26.05.22/server
npm run seed-demo
```

Expected: `assets/demo/demo_01.json` `demo_02.json` `demo_03.json` 三个文件生成。

- [ ] **Step 3: 人工调三个 JSON**

**目标：每张都是现场惊艳级**。重点改：
- `title_candidates[0]` —— 推荐主称号必须出彩、好记、有梗
- `report.paragraph` —— 必须押到桌面物件具体描述，避免泛化
- `yi[0]` / `ji[0]` —— 头一项最容易被截图，必须有梗

特别是 `demo_01.json`（95+ 假寐天尊），必须确认：
- `moyu_score >= 96`
- `level_tier === '假寐天尊'`
- 称号能撑得起七彩光晕动画的视觉爆点

每改完一个，跑一遍 schema 校验：

```bash
node -e "import('./lib/schema.js').then(m=>{const j=require('../assets/demo/demo_01.json');console.log(m.validateAnalyzeResult(j))})"
```

Expected: `{ ok: true }`

- [ ] **Step 4: 写入 hash-map.json**

```bash
cd D:/Workspace/competitions/抖音创变者26.05.22
node -e "
const {createHash}=require('crypto');
const fs=require('fs');
const files=['demo_01_趴桌.jpg','demo_02_仰头.jpg','demo_03_假思考.jpg'];
const json=['demo_01.json','demo_02.json','demo_03.json'];
const map={};
for(let i=0;i<3;i++){
  const buf=fs.readFileSync('assets/demo/'+files[i]);
  const b64=buf.toString('base64');
  const h=createHash('sha1').update(b64).digest('hex');
  map[h]=JSON.parse(fs.readFileSync('assets/demo/'+json[i],'utf8'));
}
fs.writeFileSync('assets/demo/hash-map.json',JSON.stringify(map,null,2));
console.log('hashes:',Object.keys(map));
"
```

Expected: 3 个 sha1 哈希打印出来，hash-map.json 写入。

- [ ] **Step 5: 验证 demo 短路生效**

启动 server 后：

```bash
# 把同一张 demo_01 用 curl 调上去
node -e "const fs=require('fs');const b=fs.readFileSync('assets/demo/demo_01_趴桌.jpg').toString('base64');fs.writeFileSync('/tmp/p.json',JSON.stringify({image:'data:image/jpeg;base64,'+b}))"
curl -s -X POST http://localhost:3000/api/analyze -H "Content-Type: application/json" -d @/tmp/p.json | head -c 200
# 再看 events 日志，应该出现 analyze_demo_hit
tail -3 server/data/events-*.jsonl
```

Expected: 返回的 JSON 与 `demo_01.json` 完全一致；日志里有 `analyze_demo_hit`。

- [ ] **Step 6: Commit**

```bash
git add server/scripts/seed-demo-json.ts assets/demo/demo_01.json assets/demo/demo_02.json assets/demo/demo_03.json assets/demo/hash-map.json
git commit -m "[素材] 3 张样本图配套预录 JSON + sha1 hash-map（兜底命根子）"
```

---

## Task 17: 部署到 Vercel（**5.24 01:00 死线**）

**Files:**
- Modify: `server/vercel.json`（如需）

- [ ] **Step 1: Vercel 项目初始化**

```bash
cd D:/Workspace/competitions/抖音创变者26.05.22/server
npx vercel login   # GitHub 登录
npx vercel link    # 关联或新建项目，project name: moyu-yushi-api
```

- [ ] **Step 2: 配置环境变量（在 Vercel Dashboard 或 CLI）**

```bash
npx vercel env add ARK_API_KEY production
npx vercel env add ARK_MODEL production
npx vercel env add OPENAI_API_KEY production   # 可选
npx vercel env add DEMO_MATCH_ON production    # 填 1
```

- [ ] **Step 3: 把 assets/demo/hash-map.json 拷到 server 内部**

Vercel serverless function 无法读 `process.cwd()` 上一层目录。改成在 build 时把 hash-map 拷进 server：

修改 `server/api/analyze.ts` 中的 `HASH_MAP_PATH`：

```typescript
// 旧：
// const HASH_MAP_PATH = join(process.cwd(), '..', 'assets', 'demo', 'hash-map.json');
// 新：内联式 import
import hashMap from '../demo-data/hash-map.json' assert { type: 'json' };
```

并在 `server/` 下建一个软引用：

```bash
mkdir -p server/demo-data
cp ../assets/demo/hash-map.json server/demo-data/hash-map.json
```

把 analyze.ts 改成：

```typescript
import hashMapRaw from '../demo-data/hash-map.json' with { type: 'json' };
const DEMO_MAP = hashMapRaw as Record<string, AnalyzeResult>;
// 删掉 loadDemoMap，直接用 DEMO_MAP
```

写一个 `server/scripts/sync-demo.sh`：

```bash
#!/bin/bash
set -e
cp ../assets/demo/hash-map.json demo-data/hash-map.json
echo "synced"
```

每次更新 hash-map 后跑这个。

- [ ] **Step 4: 部署**

```bash
cd server
bash scripts/sync-demo.sh
npx vercel --prod
```

Expected: 输出公网 URL，如 `https://moyu-yushi-api.vercel.app`。

- [ ] **Step 5: 验证线上 /health**

```bash
curl https://moyu-yushi-api.vercel.app/api/health
```

Expected: `{"status":"ok","ts":...}`

- [ ] **Step 6: 验证线上 /analyze（demo 图）**

```bash
node -e "const fs=require('fs');const b=fs.readFileSync('../assets/demo/demo_01_趴桌.jpg').toString('base64');fs.writeFileSync('/tmp/p.json',JSON.stringify({image:'data:image/jpeg;base64,'+b}))"
curl -X POST https://moyu-yushi-api.vercel.app/api/analyze -H "Content-Type: application/json" -d @/tmp/p.json
```

Expected: 返回 `demo_01.json` 内容（demo 短路命中）。

- [ ] **Step 7: 把公网 URL 同步到前端**

在前端 `.env.production` 写入：

```
VITE_API_BASE=https://moyu-yushi-api.vercel.app/api
```

- [ ] **Step 8: Commit**

```bash
git add server/api/analyze.ts server/demo-data/ server/scripts/sync-demo.sh
git commit -m "[部署] Vercel 上线 + hash-map 内联化 + 同步脚本"
```

**🛑 死线检查：现在是 5.24 01:00 之前吗？**
- 是 → 进 Task 18 联调
- 否 → 砍 Task 18 中的"压力测试"和"4 张额外测试图"，只跑 happy path 验收。

---

## Task 18: 前后端联调（happy path）

**Files:**
- 无新增，验收前端 + 后端协同。

前提：前端 Gemini 已经产出工程（README 已说明 prompt 就绪）。如果前端还没跑通，先优先帮前端打通 fetch 路径。

- [ ] **Step 1: 前端起本地 dev**

```bash
cd D:/Workspace/competitions/抖音创变者26.05.22/src
npm install
npm run dev
```

- [ ] **Step 2: 前端连 prod 后端，跑完整闭环**

浏览器打开 `http://localhost:5173?VITE_API_BASE=https://moyu-yushi-api.vercel.app/api` 或在 `.env.development` 配同样的 base。

跑：上传 → analyze → 出海报 → 拖贴纸 → 导出

观察控制台：
- 无 CORS 报错
- 无 JSON 解析错
- 海报上等级配色、印章、徽章符合 §4 表

- [ ] **Step 3: 三档对比演示验证**

依次上传 `demo_01 / demo_02 / demo_03`，三张海报视觉应明显分档：
- demo_01 → 假寐天尊（朱红 + 金边 + 七彩光晕呼吸动画）
- demo_02 → 划水侍郎（紫绛 + 银边粗）
- demo_03 → 划水学徒（青蓝 + 铜印朴素）

任一档视觉爆点不够 → 立刻反馈前端 B 加强。

- [ ] **Step 4: offline=1 兜底验证**

浏览器 URL 后挂 `?offline=1`：

```
http://localhost:5173/?offline=1
```

随便上传一张图，确认前端走 mock JSON 而不调后端（控制台不应出现 fetch /analyze）。

- [ ] **Step 5: 杀掉后端再试一次**

```bash
# 把 ARK_API_KEY 故意改错，重新部署一份 staging
npx vercel env add ARK_API_KEY preview   # 填错的 key
npx vercel
# 拿到 preview url 改前端 base，再上传图
```

Expected：前端仍能拿到完整 JSON（来自 demo hash 短路或兜底模板），界面无 5xx 报错。

- [ ] **Step 6: 记录问题清单到 devlog**

```bash
# 在 docs/devlog/2026-05-24-上午.md 写联调问题清单
```

- [ ] **Step 7: Commit（如有任何改动）**

```bash
git add -A
git commit -m "[联调] 前后端 happy path + 三档对比 + offline 兜底验收"
```

---

## Task 19: 演示物料 1 —— 二维码 A4 立牌

**Files:**
- Create: `docs/演示物料/二维码-A4立牌.pdf`
- Create: `docs/演示物料/二维码-A4立牌.html`

- [ ] **Step 1: 拿前端 prod 域名生成二维码**

前端部署在 `https://moyu-yushi.vercel.app`（具体域名由前端 A 给）。

用任意在线工具或本地生成 sticker-sized PNG（建议 800×800 px，纠错等级 H）。

- [ ] **Step 2: 写 HTML 立牌**

`docs/演示物料/二维码-A4立牌.html`：

```html
<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<title>摸鱼御史 · 二维码立牌</title>
<style>
@page { size: A4; margin: 0; }
body { margin: 0; font-family: "Noto Serif SC", "Source Han Serif", serif; background: #f4f1ea; color: #2a2830; }
.card { width: 210mm; height: 297mm; box-sizing: border-box; padding: 30mm 20mm; display: flex; flex-direction: column; align-items: center; justify-content: space-between; }
.title { font-size: 64pt; font-weight: 700; color: #d4222b; letter-spacing: 0.2em; }
.subtitle { font-size: 18pt; color: #2a2830; margin-top: 8pt; }
.qr { margin: 20mm 0; width: 120mm; height: 120mm; background: white; padding: 8mm; box-shadow: 0 4mm 8mm rgba(0,0,0,0.08); }
.qr img { width: 100%; height: 100%; }
.cta { font-size: 24pt; font-weight: 600; }
.foot { font-size: 12pt; color: #999; }
</style>
</head>
<body>
<div class="card">
  <div>
    <div class="title">摸鱼御史</div>
    <div class="subtitle">MoYu Imperial · 一张照片，一份御史奏折</div>
  </div>
  <div class="qr"><img src="qr-code.png" alt="QR"></div>
  <div class="cta">扫码给同事来一份御史奏折</div>
  <div class="foot">抖音 AI 创变者 2026 · 杭州站 · 赛道四</div>
</div>
</body>
</html>
```

- [ ] **Step 3: 把 QR PNG 放同目录**

```bash
cd D:/Workspace/competitions/抖音创变者26.05.22/docs/演示物料
# 把生成的二维码命名 qr-code.png 放这里
```

- [ ] **Step 4: 导 PDF**

在 Chrome 中打开 HTML，Ctrl+P → 保存为 PDF → A4 → 无边距 → 保存为 `二维码-A4立牌.pdf`

- [ ] **Step 5: Commit**

```bash
git add docs/演示物料/二维码-A4立牌.html docs/演示物料/qr-code.png docs/演示物料/二维码-A4立牌.pdf
git commit -m "[演示物料] A4 二维码立牌"
```

---

## Task 20: 演示物料 2 —— 名片 ×20 拼版

**Files:**
- Create: `docs/演示物料/名片-20张拼版.html`
- Create: `docs/演示物料/名片-20张拼版.pdf`

- [ ] **Step 1: 写 HTML 拼版**

标准名片 85×54 mm。A4 (210×297) 一页可拼 2 列 × 5 行 = 10 张。两页凑 20。

`docs/演示物料/名片-20张拼版.html`：

```html
<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<title>摸鱼御史 · 名片 ×20</title>
<style>
@page { size: A4; margin: 10mm; }
body { margin: 0; font-family: "Noto Serif SC", serif; }
.sheet { display: grid; grid-template-columns: 85mm 85mm; grid-template-rows: repeat(5, 54mm); gap: 5mm; page-break-after: always; }
.card { box-sizing: border-box; padding: 6mm; background: #f4f1ea; border: 0.5mm dashed #ccc; display: flex; flex-direction: column; justify-content: space-between; color: #2a2830; }
.brand { font-size: 18pt; font-weight: 700; color: #d4222b; }
.tagline { font-size: 8pt; }
.qr { width: 28mm; height: 28mm; align-self: flex-end; }
.url { font-size: 7pt; color: #999; }
</style>
</head>
<body>
<div class="sheet">
<!-- 10 张 × 2 页 -->
<!-- 复制 10 次 -->
<div class="card">
  <div>
    <div class="brand">摸鱼御史</div>
    <div class="tagline">一张办公照，一份御史奏折</div>
  </div>
  <div style="display:flex;justify-content:space-between;align-items:flex-end;">
    <div class="url">moyu-yushi.vercel.app</div>
    <img src="qr-code.png" class="qr">
  </div>
</div>
<!-- 重复以上 div.card 共 10 次 -->
</div>
<div class="sheet">
  <!-- 同样 10 张 -->
</div>
</body>
</html>
```

实操：用编辑器把 `<div class="card">...</div>` 块复制 20 次。

- [ ] **Step 2: 导 PDF**

Chrome 打印 → 无边距 → 保存为 `名片-20张拼版.pdf`

- [ ] **Step 3: Commit**

```bash
git add docs/演示物料/名片-20张拼版.html docs/演示物料/名片-20张拼版.pdf
git commit -m "[演示物料] 名片 20 张 A4 拼版"
```

---

## Task 21: 演示物料 3 —— Pitch 同步 + 演示 checklist

**Files:**
- Modify: `design/pitch.html`（如需同步最新数据）
- Create: `docs/演示物料/演示checklist.md`

- [ ] **Step 1: 同步 pitch.html 中的演示数据**

打开 `design/pitch.html`，确认：
- 例图与 `demo_01_趴桌.jpg` 一致
- 称号 / 评分 / 奏折与 `demo_01.json` 一致
- 段位表与 §4 6 档表一致

如不一致就改 HTML。

- [ ] **Step 2: 写 `docs/演示物料/演示checklist.md`**

```markdown
# 演示日 checklist（5.24 14:00-17:00 游园会）

## 出门前（5.24 13:00 前）

### 设备
- [ ] 演示手机 ×2（主备，电量满）
- [ ] 备用安卓手机 ×1（演示跨机型兼容）
- [ ] 笔记本 ×1（带 backup local server，HDMI 输出可用）
- [ ] 移动电源 ×2、Type-C 数据线 ×2、Lightning 线 ×1
- [ ] 移动 Wi-Fi / 手机热点（防现场网络炸）

### 物料
- [ ] A4 二维码立牌 ×1（已塑封）
- [ ] 名片 ×20 张（已裁切）
- [ ] 3 张打印好的预录样例图（A5，彩印）
- [ ] 备用充电的演示手机不锁屏

### 软件
- [ ] 前端 prod URL 已在演示手机浏览器收藏
- [ ] `?offline=1` URL 也已收藏
- [ ] 后端 /health 在出门前最后跑一次：`curl https://moyu-yushi-api.vercel.app/api/health`
- [ ] demo hash 兜底验证一次（用 demo_01 跑一遍）

## 现场（每个观众）

1. 把 A4 立牌摆桌前显眼处
2. 主动递手机给观众："试试看，3 秒出海报"
3. 第一张用 `demo_01_趴桌.jpg`（朋友圈相册保存版）→ 假寐天尊视觉爆点必出
4. 第二张让观众自拍/拍他工位
5. 出图后讲点："你看这个朱红印章 + 等级徽章——AI 不是识图器，AI 是这套体验的编剧"
6. 出图后递名片
7. 极端情况：手机断网 → URL 加 `?offline=1` 继续跑，无人察觉

## 紧急预案

### 后端挂了
- 切 `?offline=1` 走纯前端兜底
- 用打印好的样例海报照片直接讲故事

### 前端挂了
- 笔记本开热点，跑 backup local server
- 投笔记本屏幕讲技术细节

### VLM 抽风（评分飘到不合理档位）
- 用「称号」tab 让观众自选——这本身就是产品卖点："AI 起势，用户加彩"
- 或直接让用户选 demo_01 那张样图

### 观众问"这玩意会上线吗"
- "MVP，比赛后看反馈"
- 给名片，引导关注后续
```

- [ ] **Step 3: Commit**

```bash
git add docs/演示物料/演示checklist.md design/pitch.html
git commit -m "[演示物料] 现场 checklist + pitch 数据同步"
```

---

## Task 22: 90 秒 pitch 排练

**Files:**
- 无文件改动，纯练习。

- [ ] **Step 1: 把 [§10 pitch 脚本](../specs/2026-05-23-摸鱼御史-design.md#§10-90s-pitch-脚本) 打印或在手机上打开**

- [ ] **Step 2: 计时排练 3 次**

每次完整跑一遍，目标 88-92s。
- 第 1 次：找卡点
- 第 2 次：改卡点
- 第 3 次：要能行云流水

- [ ] **Step 3: 录一次视频自查（手机录屏 + 收音）**

观察：眼神、手势、节奏、有没有口头禅。

- [ ] **Step 4: 同步 pitch 脚本到 `design/pitch.html`（如有调整）**

```bash
git add design/pitch.html
git commit -m "[演示] 90s pitch 排练后微调脚本节奏"
```

（如无改动跳过）

---

## Task 23: 最终冒烟 + 提交（5.24 11:00 前完成）

**Files:**
- Modify: `README.md` 项目状态
- Create: `docs/devlog/2026-05-24-上午.md`

- [ ] **Step 1: 跑一次完整闭环（在演示手机上）**

```
打开 prod URL → 拍照（不是相册）→ 等待 → 看海报 → 拖 3 张贴纸 → 导出 → 朋友圈预览
```

整个流程必须 < 60s。

- [ ] **Step 2: 跑 offline 路径**

```
URL 加 ?offline=1 → 上传任一图 → 验证仍出海报
```

- [ ] **Step 3: 跑 3 张 demo 图对比**

把 demo_01/02/03 依次上传，三张海报截图存档进 `docs/演示物料/海报截图/`。

- [ ] **Step 4: 更新 README.md 项目状态**

把以下任务勾掉：
- [x] 后端 /analyze 接口
- [x] Prompt 工程调试
- [x] 联调 + 兜底素材
- [x] 演示物料

加入"演示链接 / 截图"小节。

- [ ] **Step 5: 写 `docs/devlog/2026-05-24-上午.md`**

简短记录：什么时候跑通、有什么坑、prompt 调几轮、demo 命中率。

- [ ] **Step 6: 作品提交（5.24 12:00 前）**

按主办方平台要求填写：
- 作品名：摸鱼御史 MoYu Imperial
- 体验链接：前端 prod URL
- 演示视频：导出的海报 + 30s 录屏拼一段
- 简介：从 §1 抄

- [ ] **Step 7: Commit + Push**

```bash
git add README.md docs/devlog/2026-05-24-上午.md docs/演示物料/海报截图/
git commit -m "[里程碑] MVP v2 上线 + 演示物料齐 + 作品提交"
git push origin dev
# 合并到 main
git checkout main
git merge dev --no-ff -m "[release] MVP v2 提交版"
git push origin main
```

---

## 自检清单（写完计划自查用）

**Spec 覆盖**：
- ✅ /analyze 接口（T12）
- ✅ ajv schema（T4）
- ✅ score/tier 一致性（T2）
- ✅ retry + 兜底模板（T5/T9）
- ✅ Prompt 工程（T6 + T13/T14 调试）
- ✅ 3 张兜底素材 + JSON + hash 短路（T15/T16）
- ✅ 部署（T17）
- ✅ /health（T12）
- ✅ CORS（T1 vercel.json）
- ✅ 埋点（T11）
- ✅ 演示物料（T19-T22）
- ✅ 90s pitch（T22）
- ✅ 提交（T23）

**风险对应**（设计文档 §7）：
- VLM 评分飘 → T14 prompt 调试 + 用户「称号」tab 兜底
- VLM 延迟 > 10s → T7/T8 timeout 15s + T9 调度
- VLM JSON 不合法 → T4 schema + T9 retry + 兜底
- score/tier 不一致 → T2 强制覆盖
- iOS 导出失败 → 前端范畴，不在本计划
- 现场网络卡 / VLM 抽风 → T15/T16 demo 短路 + T18 offline 验证 + T21 checklist

---

## 死线规则汇总

| 时间 | 必达 | 砍什么 |
|---|---|---|
| 5.23 22:30 | 游园会海报（设计同学的活，本计划不管） | — |
| 5.24 01:00 | 后端上线 + 3 张 demo 兜底 + 前端能连 | 砍 GPT-4o 备选，砍 prompt-bench |
| 5.24 04:00 | 联调通 happy path | 砍三档对比强度，至少保 1 张爆点图 |
| 5.24 11:00 | 演示物料齐 | 砍名片 20 张降到 6 张，立牌必保 |
| 5.24 12:00 | **作品提交** | 死线，过点直接掉队 |

---

**最后更新：2026-05-23（实施计划初版）**
