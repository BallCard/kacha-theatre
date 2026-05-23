import { AnalyzeResult, StoryContext } from '../types';

/**
 * 把摸鱼御史的 AnalyzeResult 转成主题无关的 StoryContext。
 *
 * 未来加新主题：再写一个 `xxxAdapter(rawResult, image) → StoryContext`，
 * 剧情引擎（storyEngine）完全不动。
 */
export function adaptMoyuYushi(
  result: AnalyzeResult,
  uploadedImageBase64: string,
  selectedTitle: string
): StoryContext {
  return {
    theme: {
      id: 'moyu-yushi',
      name: '摸鱼御史·御史房',
      visualStyle:
        'chinese ancient court painting style fused with modern anime illustration, ' +
        'warm earthy palette (cinnabar red, antique gold, ink black), ' +
        'parchment paper texture background, ' +
        'soft cinematic lighting with rays of dust',
      languageStyle:
        '半文半白、玄学占卜调、夹杂互联网梗。' +
        '旁白用第三人称像史官记述，角色对白可以骚气、可以摆烂、可以装腔。' +
        '风格参考：「该员紫微星偏东南三度…」「准奏！」「臣，告退」',
    },
    protagonist: {
      role: `${selectedTitle}·御史房新进员外郎`,
      referenceImageBase64: uploadedImageBase64,
      appearanceHint: buildAppearanceHint(result),
    },
    scene: {
      description: buildSceneDescription(result),
      keyObjects: result.desk_objects,
    },
    tags: [
      result.pose_type,
      result.level_tier,
      ...result.report.yi.slice(0, 2),
    ],
    initialStats: {
      '摸鱼值': result.moyu_score,
      '警觉度': Math.max(5, 100 - result.moyu_score - Math.floor(Math.random() * 20)),
      '玄学值': 50 + Math.floor(Math.random() * 30),
    },
  };
}

function buildAppearanceHint(result: AnalyzeResult): string {
  // 我们不识别人脸身份，仅用姿态/场景的客观描述给图生图当锚点
  const poseHints: Record<string, string> = {
    '趴桌型': 'slumped over the desk, head resting on arm',
    '椅背瘫型': 'slouched against the chair, eyes half-closed',
    '假装思考型': 'staring at the screen with an empty expression',
    '神游型': 'gazing into the distance, mind clearly elsewhere',
    '托腮型': 'cheek resting on hand, daydreaming',
    '葛优瘫型': 'collapsed into the chair, fully relaxed',
    '咸鱼型': 'lying flat, the very picture of giving up',
  };
  const poseEn = poseHints[result.pose_type] || 'in a relaxed slacking posture';
  return `office worker character ${poseEn}, modern casual attire`;
}

function buildSceneDescription(result: AnalyzeResult): string {
  const tierMood: Record<AnalyzeResult['level_tier'], string> = {
    '打工新丁': '清晨的格子间，键盘声此起彼伏',
    '划水学徒': '上午的开放工位，咖啡杯刚刚见底',
    '摸鱼修士': '午后的茶水间转角，阳光斜射',
    '划水侍郎': '黄昏的工位，屏幕泛着冷光',
    '摸鱼大将军': '深夜的办公室，只剩工位的一盏台灯',
    '假寐天尊': '时空错乱的御史房，紫微星偏移，案上美式凝结成霜',
  };
  const mood = tierMood[result.level_tier];
  const objects = result.desk_objects.slice(0, 3).join('、');
  return `${mood}。桌上散落着${objects || '寻常杂物'}`;
}
