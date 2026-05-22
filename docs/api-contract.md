# API 接口契约

> **重要**：这是前后端开发的"宪法"，所有接口必须先在这里定义，再开发。  
> **更新规则**：任何接口变更必须先更新本文档，并通知相关开发者。

## 基础信息

**Base URL**：`http://localhost:8000/api` (开发环境)

**通用响应格式**：
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

**错误响应格式**：
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述"
  }
}
```

## 接口列表

### 1. 健康检查

**端点**：`GET /health`

**用途**：检查服务是否正常运行

**请求**：无

**响应**：
```json
{
  "status": "ok",
  "timestamp": "2026-05-23T10:00:00Z"
}
```

---

## 核心功能接口（待定义）

> **说明**：以下接口根据赛道选择和创意确定后填写

### 赛道二：内容重构相关接口

#### 2.1 视频上传与解析

**端点**：`POST /video/upload`

**用途**：上传视频并触发内容解析

**请求**：
- Content-Type: `multipart/form-data`
- Body:
  ```
  video: File (max 100MB)
  options: JSON string (可选)
  ```

**响应**：
```json
{
  "success": true,
  "data": {
    "taskId": "uuid-string",
    "status": "processing",
    "estimatedTime": 30
  }
}
```

**Mock数据**：`data/mock/video-upload.json`

---

#### 2.2 获取解析结果

**端点**：`GET /video/result/:taskId`

**用途**：获取视频解析结果

**请求**：
- Path: `taskId` (string)

**响应**：
```json
{
  "success": true,
  "data": {
    "taskId": "uuid-string",
    "status": "completed",
    "result": {
      "summary": "视频内容摘要",
      "keyPoints": ["要点1", "要点2"],
      "actionItems": ["可执行步骤1", "可执行步骤2"],
      "timestamp": "2026-05-23T10:05:00Z"
    }
  }
}
```

**状态值**：
- `processing`: 处理中
- `completed`: 完成
- `failed`: 失败

**Mock数据**：`data/mock/video-result.json`

---

### 赛道四：视觉搜索相关接口

#### 3.1 图片上传与识别

**端点**：`POST /image/recognize`

**用途**：上传图片并识别内容

**请求**：
- Content-Type: `multipart/form-data`
- Body:
  ```
  image: File (max 10MB)
  query: string (可选，用户的语音/文字查询)
  ```

**响应**：
```json
{
  "success": true,
  "data": {
    "imageId": "uuid-string",
    "recognition": {
      "objects": ["物体1", "物体2"],
      "scene": "场景描述",
      "text": "识别到的文字",
      "confidence": 0.95
    }
  }
}
```

**Mock数据**：`data/mock/image-recognize.json`

---

#### 3.2 视觉搜索

**端点**：`POST /search/visual`

**用途**：基于图片和查询进行搜索

**请求**：
```json
{
  "imageId": "uuid-string",
  "query": "用户查询文本",
  "filters": {
    "category": "string",
    "limit": 10
  }
}
```

**响应**：
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "result-1",
        "title": "结果标题",
        "description": "结果描述",
        "imageUrl": "https://...",
        "relevance": 0.92
      }
    ],
    "total": 50
  }
}
```

**Mock数据**：`data/mock/search-results.json`

---

## AI 能力接口（内部）

> **说明**：这些接口由 AI 模块提供给后端调用，不直接暴露给前端

### 4.1 视频内容分析

**函数签名**（Python）：
```python
def analyze_video(
    video_path: str,
    analysis_type: str = "full"
) -> dict:
    """
    分析视频内容
    
    Args:
        video_path: 视频文件路径
        analysis_type: 分析类型 ("full", "summary", "keyframes")
    
    Returns:
        {
            "summary": str,
            "keyPoints": list[str],
            "actionItems": list[str],
            "metadata": dict
        }
    """
```

---

### 4.2 图片识别

**函数签名**（Python）：
```python
def recognize_image(
    image_path: str,
    include_text: bool = True
) -> dict:
    """
    识别图片内容
    
    Args:
        image_path: 图片文件路径
        include_text: 是否包含OCR文字识别
    
    Returns:
        {
            "objects": list[str],
            "scene": str,
            "text": str,
            "confidence": float
        }
    """
```

---

## 前端 API 调用封装

**文件位置**：`src/frontend/src/services/api.js`

**示例代码**：
```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export const api = {
  // 健康检查
  health: async () => {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.json();
  },

  // 视频上传
  uploadVideo: async (file, options = {}) => {
    const formData = new FormData();
    formData.append('video', file);
    if (options) {
      formData.append('options', JSON.stringify(options));
    }

    const response = await fetch(`${API_BASE_URL}/video/upload`, {
      method: 'POST',
      body: formData,
    });
    return response.json();
  },

  // 获取视频结果
  getVideoResult: async (taskId) => {
    const response = await fetch(`${API_BASE_URL}/video/result/${taskId}`);
    return response.json();
  },

  // 图片识别
  recognizeImage: async (file, query = '') => {
    const formData = new FormData();
    formData.append('image', file);
    if (query) {
      formData.append('query', query);
    }

    const response = await fetch(`${API_BASE_URL}/image/recognize`, {
      method: 'POST',
      body: formData,
    });
    return response.json();
  },
};
```

---

## Mock 数据开发

### 前端 Mock Server 配置

**工具**：使用 `json-server` 或 `MSW`

**配置文件**：`src/frontend/mock-server.js`

```javascript
import { createServer } from 'miragejs';

export function makeServer() {
  return createServer({
    routes() {
      this.namespace = 'api';

      this.get('/health', () => ({
        status: 'ok',
        timestamp: new Date().toISOString(),
      }));

      this.post('/video/upload', () => ({
        success: true,
        data: {
          taskId: 'mock-task-123',
          status: 'processing',
          estimatedTime: 30,
        },
      }));

      this.get('/video/result/:taskId', () => ({
        success: true,
        data: {
          taskId: 'mock-task-123',
          status: 'completed',
          result: {
            summary: '这是一个关于烹饪的视频，展示了如何制作意大利面。',
            keyPoints: [
              '准备食材：面条、番茄、大蒜、橄榄油',
              '煮面条8-10分钟',
              '制作番茄酱',
              '混合并装盘',
            ],
            actionItems: [
              '购买食材清单',
              '准备厨具：锅、平底锅、漏勺',
              '按步骤操作',
            ],
            timestamp: new Date().toISOString(),
          },
        },
      }));
    },
  });
}
```

---

## 接口开发检查清单

### 后端开发者
- [ ] 接口实现符合本文档定义
- [ ] 返回格式统一（success/data/error）
- [ ] 错误处理完善（400/500等）
- [ ] 添加请求日志
- [ ] 测试接口可用性（Postman/curl）

### 前端开发者
- [ ] API调用封装在 `services/api.js`
- [ ] 错误处理统一
- [ ] Loading状态处理
- [ ] 使用Mock数据开发（后端未就绪时）
- [ ] 切换到真实API测试

### AI集成者
- [ ] 函数签名符合约定
- [ ] 返回格式统一
- [ ] 异常处理完善
- [ ] 提供测试数据和示例

---

## 接口变更流程

1. **提出变更**：在微信群/飞书文档说明变更原因
2. **更新文档**：修改本文档对应接口定义
3. **通知相关人**：@前端/@后端/@AI 确认变更
4. **实施变更**：各自更新代码
5. **联调测试**：确认变更生效

---

## 常见问题

**Q: 接口还没开发好，前端怎么办？**
A: 使用 Mock Server，按照本文档定义的响应格式返回假数据。

**Q: 接口需要临时调整怎么办？**
A: 小调整（字段改名）直接改代码，大调整（结构变化）必须先更新本文档。

**Q: 接口报错怎么排查？**
A: 
1. 检查请求格式是否符合文档
2. 查看后端日志
3. 使用 Postman 单独测试接口
4. 找对应的开发者一起看

---

**最后更新**：2026-05-22（初始化）  
**下次更新**：2026-05-23 10:30（赛道确定后）
