import { AnalyzeResult } from "../types";

export const MOCK_RESULTS: AnalyzeResult[] = [
  // 高分样例（假寐天尊）
  {
    pose_type: "趴桌型",
    desk_objects: ["半杯冷美式", "青轴键盘", "黑屏显示器"],
    moyu_score: 96,
    level_tier: "假寐天尊",
    title_candidates: ["摸鱼天尊", "玄机帝君", "假寐至尊"],
    report: {
      paragraph: "该员紫微星偏东南三度，未时困乏正盛，案上美式凉透成冰，屏幕已黑如墨，足证神游天外不下半盏茶。当为摸鱼一脉之神品。",
      yi: ["闭目养神", "假装思考", "等下班"],
      ji: ["开周会", "改PPT", "接电话"]
    },
    face_boxes: [{ x: 0.36, y: 0.22, w: 0.20, h: 0.24 }]
  },
  // 中分样例（划水侍郎）
  {
    pose_type: "椅背瘫型",
    desk_objects: ["半凉拿铁", "亮着的双屏", "未审 PPT"],
    moyu_score: 72,
    level_tier: "划水侍郎",
    title_candidates: ["假寐侍郎", "神隐巡按", "走神判官"],
    report: {
      paragraph: "该员紫微南移五度，恰逢申时神游方位，案上拿铁半凉，PPT 标题改之又改未见落笔，魂虽在席而心已远。",
      yi: ["假装翻文档", "刷消息", "续命咖啡"],
      ji: ["改稿", "汇报", "对齐需求"]
    },
    face_boxes: [{ x: 0.40, y: 0.18, w: 0.22, h: 0.26 }]
  },
  // 低分样例（划水学徒）
  {
    pose_type: "假装思考型",
    desk_objects: ["开着的 IDE", "敲过的笔记本", "热咖啡"],
    moyu_score: 35,
    level_tier: "划水学徒",
    title_candidates: ["初窥水道", "假装思考者", "敬业小卒"],
    report: {
      paragraph: "该员紫微入命星位端正，未时尚清醒，案上咖啡温热，键盘留有手温，看似认真实则魂在云端，初窥摸鱼之道。",
      yi: ["看注释", "查文档", "假装在改"],
      ji: ["开会", "拍肩膀", "被点名"]
    },
    face_boxes: []
  }
];

// 上传图片后随机选一条返回，模拟真实 AI 输出的不确定性
export function mockAnalyze(): Promise<AnalyzeResult> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(MOCK_RESULTS[Math.floor(Math.random() * MOCK_RESULTS.length)]);
    }, 2500 + Math.random() * 1500); // 2.5-4s 模拟 VLM 延迟
  });
}
