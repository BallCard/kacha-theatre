# Story Prompts — 互动剧情游戏 Prompt 归档

> **位置**：`src/frontend/src/services/storyEngine.ts`
> **配套客户端**：`src/frontend/src/services/openaiClient.ts`
> **适配器**：`src/frontend/src/services/storyAdapter.ts`

本文档归档剧情引擎所有 prompt 模板，方便后续调优 + 演示给评委看技术深度。

---

## 1. 总体设计

```
[上游] AnalyzeResult (任意主题)
          │
   storyAdapter(...)        ← 主题专属，把字段塞进通用 schema
          ▼
       StoryContext         ← 主题无关的剧情上下文
          │
   generateStoryArc(ctx)    ← 1 次 GPT 调用，强制 JSON
          ▼
       StoryArc             ← intro + 3 节点 + N 结局的完整剧情树
          │
   generatePanelImage()     ← 每节点惰性出图，gpt-image-2 走 /images/edits + 参考图
          ▼
       连环画 5 张分镜
```

**核心解耦**：剧情引擎只接 `StoryContext`，不知道也不关心上游主题是「咔嚓剧场」还是「校园社团」。换主题只需要换 `storyAdapter`，引擎和 UI 不动。

---

## 2. 剧情树生成 Prompt（chat/completions）

### 模型：`gpt-4o-mini`（可通过 `VITE_CHAT_MODEL` 覆盖）
### 参数
- `temperature: 0.95`（鼓励变化）
- `response_format: { type: "json_object" }`（强制 JSON）
- `max_tokens: 2500`

### System Prompt

```
你是一位连环画互动剧情编剧。
你会拿到一份"世界观设定 + 主角设定"，需要输出一个完整剧情树，要素包括：

- 1 个开篇分镜（intro）：把场景"漫画化"地铺开，建立世界观和角色身份
- 3 个互动节点（nodes）：每个节点是一帧分镜 + 2-3 个选项，选项会改变数值和走向
- 至少 2 个结局（endings）：根据数值或选择路径分流

输出格式严格遵循以下 JSON Schema（不要任何解释文字，只返回 JSON）：

{
  "introPanel": {
    "narration": "string, 30-80字, 旁白",
    "characterLine": "string?, 20-40字, 主角内心独白或对白（可选）",
    "imagePrompt": "string, 详细英文场景 prompt 用于图生图，必须包含具体动作/光线/构图"
  },
  "nodes": [
    {
      "id": "node-0",
      "narration": "string",
      "characterLine": "string?",
      "imagePrompt": "string",
      "choices": [
        {
          "label": "string, 8-16字, 选项文案",
          "statDelta": { "数值名": +/- 数字 },
          "nextNodeId": "node-1 | ending:good | ..."
        }
      ]
    }
  ],
  "endings": {
    "good": {
      "key": "good",
      "title": "结局标题",
      "narration": "50-120字 结局长文案",
      "imagePrompt": "英文场景 prompt，keepsake poster style"
    }
  }
}

硬性要求：
1. nodes 长度必须是 3
2. endings 至少 2 个
3. node-2 的选项 nextNodeId 必须指向 ending:xxx
4. 文案语言风格必须严格匹配输入的 languageStyle
5. 数值变化范围 ±3 到 ±20
6. imagePrompt 用英文，必须包含「preserve facial features of the reference person」
```

### User Prompt 模板

```
世界观设定：
- 主题名：{theme.name}
- 视觉风格：{theme.visualStyle}
- 语言风格：{theme.languageStyle}

主角设定：
- 身份：{protagonist.role}
- 外观锚点：{protagonist.appearanceHint}

场景：
- 当前场景：{scene.description}
- 关键道具：{scene.keyObjects 拼接}

初始标签：{tags}
初始数值：{initialStats JSON}

请基于以上设定，生成完整剧情树 JSON。剧情节奏建议：
- 开篇铺设世界观，引出"今日有事发生"
- 节点 0：第一个抉择（小事，定基调）
- 节点 1：转折（出现意外或冲突）
- 节点 2：高潮抉择（指向结局分流）

记住：结局要有反转或情绪点，不要平庸收尾。
```

### 解析 + 自愈

`storyEngine.normalizeArc(...)` 做以下兜底：
- `nodes` id 强制规范化为 `node-0/1/2`（防 LLM 乱起名）
- 最后一个节点的选项 `nextNodeId` 强制指向 `ending:xxx`
- 缺失字段用兜底文案填充

---

## 3. 图生图 Prompt 模板（images/edits）

### 模型优先级
1. **`gpt-image-2`**（主，最新，可走 `/v1/images/edits` 带参考图）
2. `gpt-image-1`（fallback，能力相当）
3. `dall-e-3`（最后兜底，无法用参考图，自动切到 `/v1/images/generations`）

### Prompt 组装（`storyEngine.composeImagePrompt`）

```
{theme.visualStyle},
anime illustration, comic panel composition, vertical poster framing,
character: {protagonist.appearanceHint},
scene: {panel.imagePrompt},
preserve the facial features, hairstyle, and overall aura of the reference person,
{keepsake ? "keepsake poster style, dramatic centered composition" : "cinematic lighting"},
no text, no captions, no watermark, no subtitles
```

### 参考图

`StoryContext.protagonist.referenceImageBase64`，即用户原上传图（dataURL）。
经 `openaiClient.dataUrlToBlob` 转 Blob 后塞进 multipart form 的 `image` 字段。

### 尺寸
- 默认 `1024x1536`（竖版，符合连环画分镜审美）
- DALL-E 3 不支持此尺寸，自动转 `1024x1792`

### 返回处理
统一返回 base64 dataURL（gpt-image-* 默认 b64_json；dall-e-3 强制 `response_format: 'b64_json'`）。

---

## 4. 当前主题适配（咔嚓剧场）

`storyAdapter.adaptMoyuYushi(result, imageBase64, selectedTitle)`：

```typescript
{
  theme: {
    id: 'moyu-yushi',
    name: '咔嚓剧场·御史房',
    visualStyle: 'chinese ancient court painting style fused with modern anime, ...',
    languageStyle: '半文半白、玄学占卜调、夹杂互联网梗。...',
  },
  protagonist: {
    role: `${selectedTitle}·御史房新进员外郎`,
    referenceImageBase64: uploadedImage,
    appearanceHint: buildAppearanceHint(result),  // 从 pose_type 推
  },
  scene: {
    description: buildSceneDescription(result),    // 从 level_tier + desk_objects 推
    keyObjects: result.desk_objects,
  },
  tags: [pose_type, level_tier, ...yi.slice(0,2)],
  initialStats: {
    '摸鱼值': result.moyu_score,
    '警觉度': 100 - moyu_score - randomJitter,
    '玄学值': 50 + randomJitter,
  },
}
```

### 未来扩展（P1+）

加新主题示例（伪代码）：

```typescript
// storyAdapter.ts 新增
export function adaptCampusOtome(result, image): StoryContext {
  return {
    theme: {
      id: 'campus-otome',
      name: '校园社团·乙游线',
      visualStyle: 'shoujo manga style, pink and blue palette, sparkle effects',
      languageStyle: '少女漫风格，暧昧、心动、内心戏多',
    },
    ...
  };
}
```

UI 完全不动，剧情引擎完全不动。换主题就是这 30 行代码 + 一套 prompt 锚词。

---

## 5. 兜底策略

| 失败点 | 行为 |
|---|---|
| `chat/completions` 失败 | 切到 `MOCK_STORY_ARC`，UI 显示「AI 抽风，已切到离线剧情」 |
| 单帧 `images/edits` 失败 | 自动降级 `gpt-image-2 → gpt-image-1 → dall-e-3`；全失败则用占位 SVG |
| URL 含 `?mock=1` 或 `?offline=1` | 强制走预录剧情 + 占位图，永不调 API |

---

## 6. 调优 Checklist

演示前请确认：
- [ ] 上传一张正脸照，跑完 5 帧能认出是同一人
- [ ] 跑完一次 LLM 调用 ≤ 8s（不行就降到 `gpt-4o-mini`）
- [ ] 单帧图生图 ≤ 10s（不行就把 size 降到 1024x1024）
- [ ] 旁白文字长度合适，不出框
- [ ] 数值变化在合理区间，不会出现 -50 / +99
- [ ] 至少 2 种结局有显著差异（标题、文案、画面气质）
