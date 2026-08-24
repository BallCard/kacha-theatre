import { AnalyzeResult, CanvasItem } from "../types";
import { getStickerUrl } from "./assets";

// 逻辑画布坐标系（与 StickerCanvas 一致：500 x 500）
const LW = 500;
const LH = 500;

// 占位/规避区：已存在的硬规则贴纸（右上段位大印 + 左下摸鱼票据） + 人脸框。
// 候选锚点按"远离规避区"的策略给到几个常用空位。
interface Anchor {
  x: number;   // 贴纸中心
  y: number;
  rot: number; // 推荐倾斜角
  weight: number;
}

// 顺序：左上 → 中右 → 右下 → 中左（按"剩余空白可能性"排序）
const FALLBACK_ANCHORS: Anchor[] = [
  { x: 105, y: 95,  rot: -8,  weight: 1 },
  { x: 400, y: 250, rot: 6,   weight: 1 },
  { x: 385, y: 410, rot: -10, weight: 1 },
  { x: 105, y: 260, rot: 4,   weight: 1 },
];

interface StickerPick {
  id: string;          // 贴纸 id（对应 STICKERS）
  name: string;        // stickerType 文案
  size: number;        // 短边像素（逻辑坐标）
  ratio?: number;      // 宽:高，默认 1（方形）
}

// 从 yi/ji/pose/score 推断标签，输出 2-3 个候选 sticker
function pickByAnalyze(r: AnalyzeResult): StickerPick[] {
  const yi = r.report.yi.join("|");
  const ji = r.report.ji.join("|");
  const pose = r.pose_type;
  const objs = r.desk_objects.join("|");
  const picks: StickerPick[] = [];

  // 1) 一定挑一个朱红小印反映段位 / 分数态度
  if (r.moyu_score >= 80) {
    picks.push({ id: "seal_red_03", name: "神游太虚", size: 130 });
  } else if (r.moyu_score >= 55) {
    picks.push({ id: "seal_red_06", name: "摸鱼有理", size: 130 });
  } else if (r.moyu_score >= 30) {
    picks.push({ id: "seal_red_05", name: "奉天承运摸鱼特诏", size: 130 });
  } else {
    picks.push({ id: "seal_red_02", name: "驳回", size: 110 });
  }

  // 2) 漫画气泡：优先反映姿态
  if (/睡|趴|瘫|假寐|瞌睡/.test(pose) || /神游|养神|闭目/.test(yi)) {
    picks.push({ id: "bubble_zzz", name: "ZZZ 神游气泡", size: 130, ratio: 1.5 });
  } else if (/思考|发呆/.test(pose) || /刷|划/.test(yi)) {
    picks.push({ id: "bubble_02", name: "脑电波断线", size: 150, ratio: 2 });
  } else if (r.moyu_score < 40) {
    picks.push({ id: "bubble_03", name: "正在努力搬砖(假)", size: 150, ratio: 2 });
  } else {
    picks.push({ id: "bubble_06", name: "已读拒绝回复", size: 150, ratio: 2 });
  }

  // 3) 黄色便利贴：反映禁忌项 / 桌面物
  if (/急|催|deadline|DDL/i.test(ji)) {
    picks.push({ id: "yellow_tag_01", name: "急件", size: 130, ratio: 2 });
  } else if (/会议|汇报|开会|对齐/.test(ji)) {
    picks.push({ id: "yellow_tag_02", name: "假装在忙", size: 130, ratio: 2 });
  } else if (/咖啡|拿铁|美式|枸杞|保温杯/.test(objs)) {
    picks.push({ id: "yellow_tag_06", name: "心不在焉", size: 130, ratio: 2 });
  } else if (r.moyu_score >= 70) {
    picks.push({ id: "yellow_tag_04", name: "暂缓处理", size: 130, ratio: 2 });
  } else {
    picks.push({ id: "yellow_tag_05", name: "御史过目", size: 130, ratio: 2 });
  }

  return picks;
}

// 判断锚点是否与人脸框冲突（人脸框已被封脸印占据）
function conflictsWithFace(
  ax: number,
  ay: number,
  size: number,
  faces: AnalyzeResult["face_boxes"]
): boolean {
  const r = size / 2;
  return faces.some((b) => {
    const cx = (b.x + b.w / 2) * LW;
    const cy = (b.y + b.h / 2) * LH;
    const half = Math.max(b.w * LW, b.h * LH) * 0.75; // 留点缓冲
    return Math.abs(ax - cx) < r + half && Math.abs(ay - cy) < r + half;
  });
}

/**
 * 根据 AnalyzeResult 自动挑 2-3 个贴纸，输出可直接 push 进 canvasItems 的列表。
 * 已避开右上段位大印、左下摸鱼票据、人脸框三处硬占位。
 */
export function autoPickStickers(result: AnalyzeResult): CanvasItem[] {
  const picks = pickByAnalyze(result).slice(0, 3);

  // 锚点候选去除"右上 / 左下"（已被硬规则占）
  const anchors = FALLBACK_ANCHORS.filter((a) => {
    const inTopRight = a.x > 320 && a.y < 200;
    const inBottomLeft = a.x < 200 && a.y > 360;
    return !inTopRight && !inBottomLeft;
  });

  const used: { x: number; y: number; r: number }[] = [];
  const items: CanvasItem[] = [];
  const now = Date.now();

  picks.forEach((p, i) => {
    const ratio = p.ratio || 1;
    const w = p.size * (ratio >= 1 ? ratio : 1);
    const h = p.size * (ratio >= 1 ? 1 : 1 / ratio);
    const radius = Math.max(w, h) / 2;

    // 在候选锚点里找第一个不与人脸 / 已放置贴纸冲突的
    let chosen: Anchor | null = null;
    for (const a of anchors) {
      if (conflictsWithFace(a.x, a.y, Math.max(w, h), result.face_boxes)) continue;
      const tooClose = used.some(
        (u) => Math.hypot(u.x - a.x, u.y - a.y) < u.r + radius - 10
      );
      if (tooClose) continue;
      chosen = a;
      break;
    }
    // 全冲突时强制塞回 anchors[i]
    if (!chosen) chosen = anchors[i % anchors.length];

    used.push({ x: chosen.x, y: chosen.y, r: radius });

    items.push({
      id: `auto_sticker_${now + i}`,
      type: "sticker",
      src: getStickerUrl(p.id),
      stickerType: p.name,
      x: chosen.x,
      y: chosen.y,
      width: w,
      height: h,
      rotation: chosen.rot,
    });

    // 用过的锚点从候选中剔除
    const idx = anchors.indexOf(chosen);
    if (idx >= 0) anchors.splice(idx, 1);
  });

  return items;
}
