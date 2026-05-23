import { useState, useEffect, useRef, useCallback } from 'react';
import {
  StoryArc,
  StoryContext,
  StoryNode,
  StoryChoice,
  EndingSpec,
  PanelSpec,
  EndingType,
} from '../types';
import {
  generateStoryArc,
  generatePanelImage,
  generateEndingImage,
  determineEnding,
} from '../services/storyEngine';
import { MOCK_STORY_ARC, isMockMode } from '../mock/storyMocks';
import { StoryPanel } from '../components/StoryPanel';
import { StoryEndingCard } from '../components/StoryEndingCard';
import { ComicStripExport } from '../components/ComicStripExport';
import { ChevronLeft, Download, RefreshCw, Home, AlertCircle, BookOpen } from 'lucide-react';
import * as htmlToImage from 'html-to-image';

interface StoryScreenProps {
  context: StoryContext;
  onExit: () => void;            // 返回 preview 页
  onBackHome: () => void;        // 回首页
  onRestart: () => void;         // 重玩（重新生成剧情树）
}

type Phase =
  | { kind: 'nameInput' }
  | { kind: 'loadingArc' }
  | { kind: 'intro' }
  | { kind: 'node'; nodeId: string }
  | { kind: 'ending'; endingKey: string }
  | { kind: 'error'; message: string };

const NAME_FALLBACK = '本官';

function applyNameToArc(arc: StoryArc, rawName: string): StoryArc {
  const name = (rawName && rawName.trim()) || NAME_FALLBACK;
  const sub = (s?: string) =>
    s ? s.replace(/\{NAME\}/g, name) : s;

  return {
    introPanel: {
      ...arc.introPanel,
      narration: sub(arc.introPanel.narration) ?? '',
      characterLine: sub(arc.introPanel.characterLine),
    },
    nodes: arc.nodes.map((n) => ({
      ...n,
      narration: sub(n.narration) ?? '',
      characterLine: sub(n.characterLine),
    })),
    endings: Object.fromEntries(
      Object.entries(arc.endings).map(([k, e]) => [
        k,
        { ...e, narration: sub(e.narration) ?? '' },
      ])
    ),
  };
}

export function StoryScreen({ context, onExit, onBackHome, onRestart }: StoryScreenProps) {
  const [arc, setArc] = useState<StoryArc | null>(null);
  const [phase, setPhase] = useState<Phase>({ kind: 'nameInput' });
  const [protagonistName, setProtagonistName] = useState<string>(context.protagonist.name ?? '');
  const [stats, setStats] = useState<Record<string, number>>(context.initialStats);
  const [degradedNotice, setDegradedNotice] = useState<string | null>(null);
  const [savedImageUrl, setSavedImageUrl] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [stripExportLoading, setStripExportLoading] = useState(false);
  // 玩家走过的节点 + 每个节点选了哪个选项的文案；与 visitedNodeIds 等长
  const [visitedNodeIds, setVisitedNodeIds] = useState<string[]>([]);
  const [visitedChoiceLabels, setVisitedChoiceLabels] = useState<string[]>([]);
  // Part 2 宜忌计数器（用于结局判定）
  const [yiHits, setYiHits] = useState(0);
  const [jiHits, setJiHits] = useState(0);
  const [matchedYiKeywords, setMatchedYiKeywords] = useState<string[]>([]);
  const [matchedJiKeywords, setMatchedJiKeywords] = useState<string[]>([]);
  const imageGenInFlight = useRef<Set<string>>(new Set());

  // ===== 1. 玩家提交名字后再触发剧情树生成 =====
  const startStoryWithName = useCallback(async (rawName: string) => {
    const name = rawName.trim();
    setProtagonistName(name);
    setPhase({ kind: 'loadingArc' });

    // 把名字塞进 ctx，让 LLM 拿得到
    const ctxWithName: StoryContext = {
      ...context,
      protagonist: { ...context.protagonist, name: name || NAME_FALLBACK },
    };

    try {
      if (isMockMode()) {
        setArc(applyNameToArc(MOCK_STORY_ARC, name));
        setPhase({ kind: 'intro' });
        return;
      }

      const generated = await generateStoryArc(ctxWithName);
      // LLM 也可能输出 {NAME} 占位，统一兜一层
      setArc(applyNameToArc(generated, name));
      setPhase({ kind: 'intro' });
    } catch (err) {
      console.error('[StoryScreen] arc generation failed, fallback to mock', err);
      setDegradedNotice('AI 抽风，已切到离线剧情');
      setArc(applyNameToArc(MOCK_STORY_ARC, name));
      setPhase({ kind: 'intro' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context]);

  // ===== 2. 当前 panel 的解析 =====
  const currentPanel = resolvePanel(arc, phase);
  const currentEnding = phase.kind === 'ending' && arc ? arc.endings[phase.endingKey] : null;

  // ===== 3. 惰性生成图片 + 一次性并行预热 =====
  useEffect(() => {
    if (!arc) return;

    // 当前 panel 没图就生成（最高优先级）
    if (currentPanel && !currentPanel.imageUrl) {
      generateForPanel(currentPanel);
    }
    // 预热下一张
    const next = getNextPanel(arc, phase);
    if (next && !next.imageUrl) {
      generateForPanel(next);
    }
    // 进入 intro 时同时预热 node-0
    if (phase.kind === 'intro') {
      const node0 = arc.nodes[0];
      if (node0 && !node0.imageUrl) generateForPanel(node0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arc, phase.kind, (phase as any).nodeId, (phase as any).endingKey]);

  // arc 一拿到就把剩下所有 panel/ending 全部并行预热（fast 模式下省的就是这一段串行等待）
  useEffect(() => {
    if (!arc) return;
    if (isMockMode()) return; // mock 模式图已经写死了，没必要发请求
    const all: (PanelSpec | StoryNode | EndingSpec)[] = [
      arc.introPanel,
      ...arc.nodes,
      ...Object.values(arc.endings),
    ];
    for (const panel of all) {
      if (!panel.imageUrl) generateForPanel(panel);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arc]);

  const generateForPanel = useCallback(
    async (panel: PanelSpec | StoryNode | EndingSpec) => {
      const key = panel.imagePrompt;
      if (imageGenInFlight.current.has(key)) return;
      imageGenInFlight.current.add(key);

      try {
        const isEnding = 'key' in (panel as EndingSpec) && (panel as EndingSpec).key !== undefined;
        const result = isEnding
          ? await generateEndingImage(panel as EndingSpec, context)
          : await generatePanelImage(panel as PanelSpec, context);

        if (result.degraded) {
          setDegradedNotice(`图模型降级到 ${result.modelUsed}`);
        }

        // mutate in place + force re-render via setArc
        panel.imageUrl = result.imageDataUrl;
        setArc((prev) => (prev ? { ...prev } : prev));
      } catch (err) {
        console.error('[StoryScreen] panel image failed, using placeholder', err);
        // 失败：用 mock 的占位图保住流程
        panel.imageUrl = MOCK_STORY_ARC.introPanel.imageUrl;
        setArc((prev) => (prev ? { ...prev } : prev));
        setDegradedNotice('图生图失败，已用兜底插画');
      } finally {
        imageGenInFlight.current.delete(key);
      }
    },
    [context]
  );

  // ===== 4. 选项点击 =====
  const handleChoice = (choice: StoryChoice) => {
    // 应用数值变化（statDelta 仍保留作 UI 数值反馈，但不再决定结局）
    setStats((prev) => {
      const next = { ...prev };
      for (const [k, v] of Object.entries(choice.statDelta)) {
        next[k] = (next[k] ?? 0) + v;
      }
      return next;
    });

    // 累计宜忌命中数（Part 2 核心逻辑）
    let nextYi = yiHits;
    let nextJi = jiHits;
    if (choice.yijiMatch === 'yi') {
      nextYi = yiHits + 1;
      setYiHits(nextYi);
      if (choice.yijiKeyword) {
        setMatchedYiKeywords((prev) =>
          prev.includes(choice.yijiKeyword!) ? prev : [...prev, choice.yijiKeyword!]
        );
      }
    } else if (choice.yijiMatch === 'ji') {
      nextJi = jiHits + 1;
      setJiHits(nextJi);
      if (choice.yijiKeyword) {
        setMatchedJiKeywords((prev) =>
          prev.includes(choice.yijiKeyword!) ? prev : [...prev, choice.yijiKeyword!]
        );
      }
    }

    // 记录玩家当前在哪个节点 + 选了什么（phase 必为 node）
    if (phase.kind === 'node') {
      setVisitedNodeIds((prev) =>
        prev[prev.length - 1] === phase.nodeId ? prev : [...prev, phase.nodeId]
      );
      setVisitedChoiceLabels((prev) => [...prev, choice.label]);
    }

    // 路由到下一节点 / 结局
    if (choice.nextNodeId.startsWith('ending:')) {
      // Part 2：结局由规则函数判定，忽略 LLM/mock 写的 nextNodeId 具体 key
      const endingType: EndingType = determineEnding(context, nextYi, nextJi);
      // arc.endings 优先按 endingType 作 key 命中；没命中再 fallback 到原 key 或第一个
      let endingKey: string = endingType;
      if (arc && !arc.endings[endingKey]) {
        const fallbackByType = Object.values(arc.endings).find((e) => e.endingType === endingType);
        if (fallbackByType) endingKey = fallbackByType.key;
        else {
          const explicit = choice.nextNodeId.slice('ending:'.length);
          endingKey = arc.endings[explicit] ? explicit : Object.keys(arc.endings)[0] ?? endingType;
        }
      }
      setPhase({ kind: 'ending', endingKey });
    } else {
      setPhase({ kind: 'node', nodeId: choice.nextNodeId });
    }
  };

  // 触发浏览器下载（不弹长按弹窗）
  const triggerDownload = (dataUrl: string, filename: string) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // ===== 5. 导出结局图（直接下载） =====
  const handleExportEnding = async () => {
    const node = document.getElementById('printable-ending-card');
    if (!node) return;
    setExportLoading(true);
    try {
      const dataUrl = await htmlToImage.toPng(node, {
        quality: 1,
        pixelRatio: 2.5,
        backgroundColor: '#f5efe1',
        cacheBust: true,
      });
      triggerDownload(dataUrl, `御史结局_${currentEnding?.title ?? 'ending'}.png`);
    } catch (err) {
      console.error(err);
      alert('结局图生成失败，请稍后重试');
    } finally {
      setExportLoading(false);
    }
  };

  // ===== 5.1 导出整本连环画长图（直接下载） =====
  const visitedNodes: StoryNode[] = arc
    ? visitedNodeIds
        .map((id) => arc.nodes.find((n) => n.id === id))
        .filter((n): n is StoryNode => !!n)
    : [];

  const handleExportComicStrip = async () => {
    const node = document.getElementById('printable-comic-strip');
    if (!node) return;
    setStripExportLoading(true);
    try {
      const dataUrl = await htmlToImage.toPng(node, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#f5efe1',
        cacheBust: true,
      });
      triggerDownload(dataUrl, `御史连环画_${currentEnding?.title ?? 'comic'}.png`);
    } catch (err) {
      console.error(err);
      alert('连环画长图生成失败，请稍后重试');
    } finally {
      setStripExportLoading(false);
    }
  };

  // ===== 6. 渲染 =====
  if (phase.kind === 'nameInput') {
    return (
      <NameInputScreen
        themeName={context.theme.name}
        defaultName={protagonistName}
        onSubmit={startStoryWithName}
        onExit={onExit}
      />
    );
  }

  if (phase.kind === 'loadingArc' || !arc) {
    return <ArcLoading />;
  }

  if (phase.kind === 'ending' && currentEnding) {
    return (
      <div className="flex-1 min-h-0 flex flex-col bg-[#f6f6f6] animate-fade-in">
        <header className="h-11 border-b border-gray-200 bg-white flex items-center justify-between px-3 shrink-0">
          <button
            onClick={onBackHome}
            className="p-1 text-gray-500 hover:text-gray-800 active:scale-90 transition-all"
          >
            <Home size={20} className="stroke-[2.5px]" />
          </button>
          <span className="text-sm font-bold text-[#2a2830]">通关结局</span>
          <div className="w-6 h-6 shrink-0" />
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-4">
          <StoryEndingCard
            ending={currentEnding}
            finalStats={stats}
            themeName={context.theme.name}
            protagonistName={protagonistName}
            imageLoading={!currentEnding.imageUrl}
            yiHits={yiHits}
            jiHits={jiHits}
            matchedYiKeywords={matchedYiKeywords}
            matchedJiKeywords={matchedJiKeywords}
          />
          {degradedNotice && <DegradedBanner text={degradedNotice} />}
        </main>

        <footer className="p-4 bg-white border-t border-gray-200/80 flex flex-col gap-2.5 shrink-0">
          <button
            onClick={handleExportComicStrip}
            disabled={stripExportLoading || !arc}
            className="w-full py-3.5 bg-gradient-to-r from-[#2a2520] to-[#3a2f24] text-[#f0c869] border border-[#f0c869]/70 hover:from-[#3a2f24] hover:border-[#f0c869] rounded-full font-bold text-sm tracking-widest flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}
          >
            <BookOpen size={16} />
            <span>{stripExportLoading ? '摹印长卷中...' : '📜 一键导出整本连环画'}</span>
          </button>
          <button
            onClick={handleExportEnding}
            disabled={exportLoading || !currentEnding.imageUrl}
            className="w-full py-3.5 bg-[#d4222b] text-white hover:bg-[#b01c23] rounded-full font-bold text-sm tracking-widest flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={16} />
            <span>{exportLoading ? '摹印中...' : '📥 保存结局纪念图'}</span>
          </button>
          <div className="flex gap-2.5">
            <button
              onClick={onRestart}
              className="flex-1 py-3 bg-white text-[#d4222b] border border-[#d4222b] hover:bg-red-50/40 rounded-full font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <RefreshCw size={14} />
              <span>重玩剧情</span>
            </button>
            <button
              onClick={onExit}
              className="flex-1 py-3 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-full font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <ChevronLeft size={14} />
              <span>返回海报</span>
            </button>
          </div>
        </footer>

        {/* 离屏渲染整本连环画，截图时用；用户看不到 */}
        {arc && (
          <div
            aria-hidden
            style={{
              position: 'fixed',
              left: '-10000px',
              top: 0,
              pointerEvents: 'none',
              opacity: 0,
            }}
          >
            <ComicStripExport
              themeName={context.theme.name}
              protagonistName={protagonistName}
              introPanel={arc.introPanel}
              visitedNodes={visitedNodes}
              visitedChoiceLabels={visitedChoiceLabels}
              ending={currentEnding}
              finalStats={stats}
              yiHits={yiHits}
              jiHits={jiHits}
              matchedYiKeywords={matchedYiKeywords}
              matchedJiKeywords={matchedJiKeywords}
            />
          </div>
        )}

        {savedImageUrl && (
          <SavedImageModal url={savedImageUrl} onClose={() => setSavedImageUrl(null)} />
        )}
      </div>
    );
  }

  // intro 或 node
  const isNode = phase.kind === 'node';
  const node = isNode ? arc.nodes.find((n) => n.id === (phase as any).nodeId) : null;
  const panel: PanelSpec | StoryNode = isNode ? node! : arc.introPanel;
  const progressLabel = isNode
    ? `${node?.timeSlot ?? `第 ${arc.nodes.findIndex((n) => n.id === node!.id) + 1} 幕`} · ${arc.nodes.findIndex((n) => n.id === node!.id) + 1}/${arc.nodes.length}`
    : '开篇';

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#1d1916] animate-fade-in relative">
      <header className="h-11 border-b border-[#3a2f24] bg-[#0e0c0a] flex items-center justify-between px-3 shrink-0 z-30">
        <button
          onClick={() => {
            if (confirm('确定要退出本卷剧情吗？数值不会保留')) onExit();
          }}
          className="p-1 text-[#f0c869] hover:text-white active:scale-90 transition-all"
        >
          <ChevronLeft size={22} className="stroke-[2.5px]" />
        </button>
        <span
          className="text-sm font-bold text-[#f0c869] tracking-widest font-serif"
          style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}
        >
          {context.theme.name}
        </span>
        <div className="w-6 h-6 shrink-0" />
      </header>

      {degradedNotice && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-40">
          <DegradedBanner text={degradedNotice} compact />
        </div>
      )}

      <StoryPanel
        panel={panel}
        isNode={isNode}
        stats={stats}
        imageLoading={!panel.imageUrl}
        progressLabel={progressLabel}
        yiHits={yiHits}
        jiHits={jiHits}
        onChoose={isNode ? handleChoice : undefined}
        onStart={!isNode ? () => setPhase({ kind: 'node', nodeId: 'node-0' }) : undefined}
      />
    </div>
  );
}

// ============================================================
// Helpers
// ============================================================

function resolvePanel(
  arc: StoryArc | null,
  phase: Phase
): PanelSpec | StoryNode | EndingSpec | null {
  if (!arc) return null;
  if (phase.kind === 'intro') return arc.introPanel;
  if (phase.kind === 'node') return arc.nodes.find((n) => n.id === phase.nodeId) || null;
  if (phase.kind === 'ending') return arc.endings[phase.endingKey] || null;
  return null;
}

function getNextPanel(arc: StoryArc, phase: Phase): PanelSpec | StoryNode | EndingSpec | null {
  if (phase.kind === 'intro') return arc.nodes[0] || null;
  if (phase.kind === 'node') {
    const idx = arc.nodes.findIndex((n) => n.id === phase.nodeId);
    if (idx === -1) return null;
    if (idx + 1 < arc.nodes.length) return arc.nodes[idx + 1];
    // 最后一个 node 的"下一张"是最可能的结局；这里预热第一个 ending 兜底
    const firstEndingKey = Object.keys(arc.endings)[0];
    return firstEndingKey ? arc.endings[firstEndingKey] : null;
  }
  return null;
}

function NameInputScreen({
  themeName,
  defaultName,
  onSubmit,
  onExit,
}: {
  themeName: string;
  defaultName: string;
  onSubmit: (name: string) => void;
  onExit: () => void;
}) {
  const [name, setName] = useState(defaultName);
  const trimmed = name.trim();

  const submit = () => {
    onSubmit(trimmed);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#1d1916] animate-fade-in relative">
      <header className="h-11 border-b border-[#3a2f24] bg-[#0e0c0a] flex items-center justify-between px-3 shrink-0">
        <button
          onClick={onExit}
          className="p-1 text-[#f0c869] hover:text-white active:scale-90 transition-all"
        >
          <ChevronLeft size={22} className="stroke-[2.5px]" />
        </button>
        <span
          className="text-sm font-bold text-[#f0c869] tracking-widest font-serif"
          style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}
        >
          {themeName}
        </span>
        <div className="w-6 h-6 shrink-0" />
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-center px-6 py-8 gap-6 text-center">
        <div className="relative w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[#f0c869]/20 blur-2xl" />
          <div
            className="text-4xl font-black text-[#f0c869] font-serif"
            style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}
          >
            ✒
          </div>
        </div>

        <div>
          <h2
            className="text-xl font-black text-[#f0c869] font-serif tracking-widest"
            style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}
          >
            敢问主人公尊姓大名？
          </h2>
          <p className="text-[11px] text-[#b39e70] mt-2 leading-relaxed font-serif px-2">
            姓名将出现在旁白与连环画落款处。<br />
            留空则自动以「本官」代称。
          </p>
        </div>

        <div className="w-full max-w-[320px] flex flex-col gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 12))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
            }}
            placeholder="例如：张老二、李员外、咸鱼大人……"
            maxLength={12}
            autoFocus
            className="w-full px-4 py-3 bg-[#2a2520] border-2 border-[#f0c869]/60 rounded-xl text-[#fdfaf2] text-center text-base font-bold tracking-widest focus:border-[#f0c869] focus:outline-none placeholder:text-[#7a6748] placeholder:font-normal placeholder:tracking-normal placeholder:text-sm font-serif"
            style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}
          />
          <p className="text-[10px] text-[#7a6748] font-mono tracking-wider">
            {trimmed ? `当前姓名：${trimmed} · ${trimmed.length}/12` : '不填写也可继续'}
          </p>
        </div>

        <button
          onClick={submit}
          className="px-8 py-3 bg-[#d4222b] hover:bg-[#b01c23] text-white rounded-full font-bold text-sm tracking-widest active:scale-95 transition-all shadow-lg"
          style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}
        >
          ✒ 入卷开篇
        </button>
      </main>
    </div>
  );
}

function ArcLoading() {
  return (
    <div className="flex-1 flex flex-col justify-center items-center bg-[#1d1916] animate-fade-in p-6">
      <div className="relative w-32 h-32 flex items-center justify-center mb-6">
        <div className="absolute inset-0 rounded-full bg-[#f0c869]/20 blur-2xl animate-pulse" />
        <div className="absolute inset-0 border-4 border-[#f0c869] border-t-transparent rounded-full animate-spin" />
        <div
          className="text-3xl font-black text-[#f0c869] font-serif"
          style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}
        >
          御
        </div>
      </div>
      <h2
        className="text-lg font-bold text-[#f0c869] font-serif tracking-widest"
        style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}
      >
        御史秉笔，编织本卷剧情中
      </h2>
      <p className="text-[#b39e70] text-[11px] mt-3 font-mono tracking-wider">
        Generating story arc · 5-10s
      </p>
    </div>
  );
}

function DegradedBanner({ text, compact }: { text: string; compact?: boolean }) {
  return (
    <div
      className={`flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/90 backdrop-blur-sm border border-amber-300 text-amber-900 ${
        compact ? 'text-[10px]' : 'text-xs'
      } shadow-md`}
    >
      <AlertCircle size={compact ? 10 : 12} />
      <span className="font-bold">{text}</span>
    </div>
  );
}

function SavedImageModal({ url, onClose }: { url: string; onClose: () => void }) {
  // 历史长按保存兜底；现已默认走 a[download] 直接下载，保留以防需要再展示
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[99999] flex flex-col justify-center items-center p-4 animate-fade-in">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white bg-white/10 p-2 rounded-full hover:bg-white/20 active:scale-90 transition-all"
      >
        ✕
      </button>
      <div className="max-w-[350px] w-full flex flex-col items-center gap-4">
        <img
          src={url}
          alt="ending keepsake"
          className="w-full rounded-2xl shadow-2xl max-h-[70vh] object-contain border-2 border-[#f0c869]"
        />
        <button
          onClick={onClose}
          className="px-6 py-2 bg-[#d4222b] text-white rounded-full font-bold text-xs active:scale-95"
        >
          继续
        </button>
      </div>
    </div>
  );
}
