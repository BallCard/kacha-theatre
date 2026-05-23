# API 接口契约

> **重要**：前后端开发的"宪法"，所有接口必须先在这里定义，再开发。
> **更新规则**：任何接口变更必须先更新本文档，并通知相关开发者。
> **设计依据**：[设计文档 §3](./superpowers/specs/2026-05-23-摸鱼御史-design.md#§3-模块拆分)

## 基础信息

| 项 | 值 |
|---|---|
| Base URL（dev） | `http://localhost:3000` |
| Base URL（prod） | `https://moyu.run`（或 Vercel 二级域名） |
| 协议 | HTTPS |
| 编码 | UTF-8 JSON |

## 接口清单（MVP v2）

### 1. POST /analyze — VLM 审阅图片（核心接口）

**用途**：把用户上传的图片送给 VLM 审阅，返回结构化"御史奏折"。

**请求**：

```
POST /analyze
Content-Type: application/json

{
  "image": "data:image/jpeg;base64,/9j/4AAQ...",
  "provider": "doubao"   // 可选，默认 doubao；备选 "gpt4o"
}
```

约束：
- `image`：base64 编码，原图压缩到短边 ≤ 1024px 再 base64（前端 Capture 模块完成）
- 单图 base64 大小 ≤ 2MB

**成功响应**（HTTP 200）：

```json
{
  "pose_type": "趴桌型",
  "desk_objects": ["半杯冷美式", "青轴键盘", "黑屏显示器"],
  "moyu_score": 87,
  "level_tier": "摸鱼大将军",
  "title_candidates": ["划水大将军", "假寐侍郎", "摸鱼世家"],
  "report": {
    "paragraph": "紫微星偏移3度，案上美式已凉……",
    "yi": ["摸鱼", "划水", "假装思考"],
    "ji": ["开会", "改PPT", "接电话"]
  },
  "face_boxes": [
    { "x": 0.32, "y": 0.18, "w": 0.24, "h": 0.28 }
  ]
}
```

**字段约束**（后端用 ajv 校验，不通过即 retry 1 次或走兜底）：

| 字段 | 类型 | 约束 |
|---|---|---|
| `pose_type` | enum | 7 种姿态之一（详见 [§6.3 schema](./superpowers/specs/2026-05-23-摸鱼御史-design.md)） |
| `desk_objects` | string[] | 0-5 项 |
| `moyu_score` | int | 0-100 |
| `level_tier` | enum | 6 档之一，必须与 score 一致（不一致后端按 score 强制覆盖） |
| `title_candidates` | string[] | 严格 3 项，每项 3-8 字 |
| `report.paragraph` | string | 30-120 字 |
| `report.yi` | string[] | 严格 3 项 |
| `report.ji` | string[] | 严格 3 项 |
| `face_boxes` | object[] | 归一化坐标 [0,1]，可空数组 |

**score → tier 映射规则**：

| score | tier |
|---|---|
| 0-20 | 打工新丁 |
| 21-40 | 划水学徒 |
| 41-60 | 摸鱼修士 |
| 61-80 | 划水侍郎 |
| 81-95 | 摸鱼大将军 |
| 96-100 | 假寐天尊 |

**失败响应**（HTTP 200，body 仍返回兜底数据，前端不需要处理 5xx 业务错）：

后端 VLM 全挂时返回 [§6.5 兜底模板](./superpowers/specs/2026-05-23-摸鱼御史-design.md#65-兜底模板vlm-全挂的最后一道)，前端无感知。

**异常响应**（HTTP 5xx，仅在请求格式错时返回）：

```json
{
  "error": "INVALID_IMAGE",
  "message": "image base64 解析失败 / 图像超过 2MB"
}
```

错误码清单：

| code | HTTP | 含义 |
|---|---|---|
| `INVALID_IMAGE` | 400 | base64 解析失败或超尺寸 |
| `MISSING_IMAGE` | 400 | 缺 image 字段 |
| `INTERNAL_ERROR` | 500 | 后端意外错误（不应该出现，兜底模板应吸收 VLM 错误） |

---

### 2. GET /health — 健康检查

**用途**：现场演示前确认后端服务在线。

```
GET /health → 200 { "status": "ok", "ts": 1716480000 }
```

---

## 不做的接口（P1+ 路线）

以下接口在 MVP 范围之外，移至 P1（如时间富余可加）或 P2：

- `POST /board/submit` — 摸鱼榜上榜
- `GET /board/today` — 当日榜单
- `POST /board/like` — 点赞
- `POST /board/report` — 举报下架
- `POST /scroll/save` — 卷宗持久化（连载叙事专用）

详见 [设计文档 §15 P1+ 路线](./superpowers/specs/2026-05-23-摸鱼御史-design.md#§15-p1-路线-mvp-跑通后再做-本设计文档不再展开)。

---

## 前端调用封装

**文件位置**：`src/services/api.ts`（Gemini 产出工程后由前端 A 负责）

```typescript
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

export type AnalyzeResult = {
  pose_type: string;
  desk_objects: string[];
  moyu_score: number;
  level_tier: '打工新丁' | '划水学徒' | '摸鱼修士' | '划水侍郎' | '摸鱼大将军' | '假寐天尊';
  title_candidates: [string, string, string];
  report: {
    paragraph: string;
    yi: [string, string, string];
    ji: [string, string, string];
  };
  face_boxes: { x: number; y: number; w: number; h: number }[];
};

export async function analyze(imageBase64: string): Promise<AnalyzeResult> {
  // offline 模式走预录 JSON
  if (new URLSearchParams(location.search).has('offline')) {
    const { mockAnalyze } = await import('@/mock/analyzeResults');
    return mockAnalyze();
  }

  const r = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageBase64 }),
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) throw new Error(`analyze failed: ${r.status}`);
  return r.json();
}
```

---

## Mock 数据

开发期前端不依赖后端，URL 加 `?mock=1` 或 `?offline=1` 即可走前端 mock。Mock 数据规范见 [frontend-gemini-prompt.md 第四节](../design/frontend-gemini-prompt.md#四mock-数据用于-analyze-假返回)，3 条样本覆盖高/中/低分数段。

---

## 接口变更流程

1. **提出变更**：群里说明原因 + 影响面
2. **更新本文档**：先文档后代码
3. **通知**：@前端 / @后端 确认
4. **实施 + 联调**

---

## 检查清单

### 后端
- [ ] /analyze 接口实现 + ajv schema 校验
- [ ] VLM 调用封装（豆包 vision-pro 主，GPT-4o 备）
- [ ] retry 1 次 + 兜底模板逻辑
- [ ] score / tier 一致性强制覆盖
- [ ] /health 接口
- [ ] CORS 配置（允许前端域名）

### 前端
- [ ] `src/services/api.ts` 封装
- [ ] `?offline=1` 走 mock 的兜底逻辑
- [ ] 15s 超时 + 重试 UI
- [ ] TypeScript 类型与本文档对齐

---

**最后更新**：2026-05-23（MVP v2 定稿）
