// Part 2 v2 主屏：状态机 + 4 层节点遍历 + 长图导出
//
// 状态：
//   intake     → 输入图（如果未从 Part 1 带进来）+ 主角 A 名 + 主题 + 画风
//   shutter    → 咔嚓动画
//   node       → 当前节点（depth 0..3）；终幕节点 ending != null
//   loading    → 生成中
//   error      → 出错重试
//   exporting  → 长图截图

import { useState, useEffect, useRef, useCallback } from 'react';
import * as htmlToImage from 'html-to-image';
import { STORY_THEMES, STORY_ART_STYLES, type StoryTheme, type StoryArtStyle, type StoryNodeResponse, type StoryChoiceId, type StoryWalkStep } from '../types';
import { fetchStoryNode, sha256OfDataUrl } from '../services/storyApi';
import { CameraShutter } from '../components/CameraShutter';
import { StoryNodeV2 } from '../components/StoryNodeV2';
import { ComicStripExport } from '../components/ComicStripExport';

interface Props {
  initialImageBase64?: string;       // 从 Part 1 跳进来时携带
  initialImageHash?: string;
  onExit: () => void;
}

type Phase = 'intake' | 'shutter' | 'loading' | 'node' | 'error' | 'exporting';

export function StoryV2Screen({ initialImageBase64, initialImageHash, onExit }: Props) {
  const [imageBase64, setImageBase64] = useState<string | null>(initialImageBase64 ?? null);
  const [imageHash, setImageHash] = useState<string | null>(initialImageHash ?? null);
  const [characterAName, setCharacterAName] = useState('A');
  const [theme, setTheme] = useState<StoryTheme>('宫斗剧');
  const [artStyle, setArtStyle] = useState<StoryArtStyle>('恋与深空');
  const [model, setModel] = useState<'claude-sonnet-4-6' | 'gpt-5'>('claude-sonnet-4-6');

  const [phase, setPhase] = useState<Phase>('intake');
  const [steps, setSteps] = useState<StoryWalkStep[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const exportRef = useRef<HTMLDivElement>(null);
  const prefetchTimerRef = useRef<number | null>(null);

  // 选完主题+画风+图就在后台并发起跑 root；后端 schedulePrefetch 顺带预热 A/B/C
  // 用户在风格页待 5-10s，根节点能提前开跑——点「咔嚓」时大概率命中 in-flight 去重，省 5-10s
  useEffect(() => {
    if (phase !== 'intake') return;
    if (!imageBase64) return;
    // debounce 500ms 避免连点 chip 把同一组合反复触发
    if (prefetchTimerRef.current) window.clearTimeout(prefetchTimerRef.current);
    prefetchTimerRef.current = window.setTimeout(() => {
      fetchStoryNode({
        imageBase64,
        imageHash: imageHash ?? undefined,
        theme, artStyle, pathKey: 'root', model, characterAName,
      }).catch(() => { /* 静默：仅热缓存 */ });
    }, 500) as unknown as number;
    return () => {
      if (prefetchTimerRef.current) window.clearTimeout(prefetchTimerRef.current);
    };
  }, [phase, imageBase64, imageHash, theme, artStyle, model, characterAName]);

  const currentDepth = steps.length === 0 ? 0 : steps.length - (steps[steps.length - 1].chosen ? 0 : 1);
  const lastStep = steps[steps.length - 1];

  // 上传本地图
  const onPickFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const url = e.target?.result as string;
      if (!url) return;
      setImageBase64(url);
      setImageHash(await sha256OfDataUrl(url));
    };
    reader.readAsDataURL(file);
  };

  // 进入梦境
  const startStory = async () => {
    if (!imageBase64) { setErrorMsg('请先上传照片'); return; }
    setPhase('shutter');
  };

  // 拉指定路径节点
  const loadNode = useCallback(async (pathKey: string) => {
    setPhase('loading');
    try {
      const node = await fetchStoryNode({
        imageBase64: pathKey === 'root' ? imageBase64 ?? undefined : undefined,
        imageHash: imageHash ?? undefined,
        theme, artStyle, pathKey,
        model, characterAName,
      });
      if (!imageHash && node.imageHash) setImageHash(node.imageHash);
      setSteps((prev) => {
        // 把上一步标记为已选；附加新节点
        const next = prev.map((s, i) => (i === prev.length - 1 ? s : s));
        return [...next, { pathKey, node }];
      });
      setPhase('node');
    } catch (e: any) {
      setErrorMsg(e?.message ?? String(e));
      setPhase('error');
    }
  }, [imageBase64, imageHash, theme, artStyle, model, characterAName]);

  // 咔嚓动画结束 → 拉 root 节点
  const onShutterDone = useCallback(() => { loadNode('root'); }, [loadNode]);

  // 用户选了某项 → 拉下一节点
  const onChoose = useCallback((id: StoryChoiceId) => {
    if (!lastStep) return;
    setSteps((prev) => prev.map((s, i) => (i === prev.length - 1 ? { ...s, chosen: id } : s)));
    const nextPath = lastStep.pathKey === 'root' ? id : `${lastStep.pathKey}.${id}`;
    loadNode(nextPath);
  }, [lastStep, loadNode]);

  // 长图导出
  const onExport = async () => {
    if (!exportRef.current) return;
    setPhase('exporting');
    try {
      const dataUrl = await htmlToImage.toPng(exportRef.current, {
        pixelRatio: 2, backgroundColor: '#0e0e10', cacheBust: true,
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `咔嚓剧场_${theme}_${artStyle}.png`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    } catch (e: any) {
      alert('导出失败：' + (e?.message ?? e));
    } finally {
      setPhase('node');
    }
  };

  const restart = () => {
    setSteps([]); setPhase('intake'); setErrorMsg('');
  };

  return (
    <>
      {phase === 'intake' && (
        <IntakePanel
          imageBase64={imageBase64}
          onPickFile={onPickFile}
          characterAName={characterAName} setCharacterAName={setCharacterAName}
          theme={theme} setTheme={setTheme}
          artStyle={artStyle} setArtStyle={setArtStyle}
          model={model} setModel={setModel}
          onStart={startStory}
          onExit={onExit}
        />
      )}

      {phase === 'shutter' && imageBase64 && (
        <CameraShutter imageUrl={imageBase64} onDone={onShutterDone} />
      )}

      {(phase === 'loading' || phase === 'exporting') && (
        <LoadingPanel text={phase === 'exporting' ? '正在导出长图...' : '梦境生成中...'} />
      )}

      {phase === 'node' && lastStep && (
        <StoryNodeV2
          node={lastStep.node}
          depth={steps.length - 1}
          characterAName={characterAName}
          onChoose={onChoose}
          onRestart={restart}
          onExport={onExport}
        />
      )}

      {phase === 'error' && (
        <ErrorPanel msg={errorMsg} onRetry={() => loadNode(lastStep ? (steps[steps.length - 1].pathKey) : 'root')} onBack={restart} />
      )}

      {/* 离屏导出节点（始终挂载，方便随时截图） */}
      <div ref={exportRef} style={{ position: 'absolute', left: -99999, top: 0 }}>
        <ComicStripExport theme={theme} artStyle={artStyle} characterAName={characterAName} steps={steps} />
      </div>
    </>
  );
}

// ---- 子面板 ----

function IntakePanel(props: {
  imageBase64: string | null;
  onPickFile: (f: File) => void;
  characterAName: string; setCharacterAName: (s: string) => void;
  theme: StoryTheme; setTheme: (t: StoryTheme) => void;
  artStyle: StoryArtStyle; setArtStyle: (a: StoryArtStyle) => void;
  model: 'claude-sonnet-4-6' | 'gpt-5'; setModel: (m: 'claude-sonnet-4-6' | 'gpt-5') => void;
  onStart: () => void;
  onExit: () => void;
}) {
  return (
    <div style={{ position: 'absolute', inset: 0, padding: 20, overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <button onClick={props.onExit} style={{ background: 'transparent', color: '#fdfaf2', border: 'none', fontSize: 14 }}>← 退出</button>
        <h2 style={{ margin: 0, fontSize: 18, color: '#f0c869', letterSpacing: 2 }}>咔嚓 · 入梦</h2>
        <span style={{ width: 40 }} />
      </div>

      <div style={{
        width: '100%', aspectRatio: '3/4', borderRadius: 16, overflow: 'hidden',
        background: '#1a1a1d', border: '1px dashed rgba(240,200,105,.4)', position: 'relative',
        marginBottom: 16,
      }}>
        {props.imageBase64 ? (
          <img src={props.imageBase64} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <label style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#f0c869', fontSize: 16, cursor: 'pointer', flexDirection: 'column', gap: 6,
          }}>
            <span style={{ fontSize: 36 }}>📷</span>
            上传一张照片
            <input type="file" accept="image/*" style={{ display: 'none' }}
              onChange={(e) => e.target.files?.[0] && props.onPickFile(e.target.files[0])} />
          </label>
        )}
        {props.imageBase64 && (
          <label style={{
            position: 'absolute', right: 10, bottom: 10, background: 'rgba(0,0,0,.6)',
            color: '#fff', padding: '6px 10px', borderRadius: 12, fontSize: 12, cursor: 'pointer',
          }}>
            换一张
            <input type="file" accept="image/*" style={{ display: 'none' }}
              onChange={(e) => e.target.files?.[0] && props.onPickFile(e.target.files[0])} />
          </label>
        )}
      </div>

      <Field label="对方称呼（A）">
        <input value={props.characterAName}
          onChange={(e) => props.setCharacterAName(e.target.value.slice(0, 12))}
          style={inputStyle} placeholder="A / 小李 / 阿黎 ..." />
      </Field>

      <Field label="主题">
        <ChipGroup options={STORY_THEMES as readonly string[]} value={props.theme}
          onChange={(v) => props.setTheme(v as StoryTheme)} />
      </Field>

      <Field label="画风">
        <ChipGroup options={STORY_ART_STYLES as readonly string[]} value={props.artStyle}
          onChange={(v) => props.setArtStyle(v as StoryArtStyle)} />
      </Field>

      <Field label="剧情模型">
        <ChipGroup options={['claude-sonnet-4-6', 'gpt-5']} value={props.model}
          onChange={(v) => props.setModel(v as any)} />
      </Field>

      <button onClick={props.onStart}
        disabled={!props.imageBase64}
        style={{
          width: '100%', padding: '14px 18px', marginTop: 8,
          borderRadius: 999, fontSize: 16, fontWeight: 700,
          background: props.imageBase64 ? '#d4222b' : '#5a2326',
          color: '#fff', border: 'none', cursor: props.imageBase64 ? 'pointer' : 'not-allowed',
          letterSpacing: 4,
        }}>
        咔 嚓 · 入 梦
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, color: '#f0c869', marginBottom: 6, letterSpacing: 1 }}>{label}</div>
      {children}
    </div>
  );
}

function ChipGroup({ options, value, onChange }: { options: readonly string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {options.map((o) => {
        const active = o === value;
        return (
          <button key={o} onClick={() => onChange(o)} style={{
            padding: '6px 12px', borderRadius: 999, fontSize: 12,
            background: active ? '#f0c869' : 'transparent',
            color: active ? '#0e0e10' : '#fdfaf2',
            border: '1px solid ' + (active ? '#f0c869' : 'rgba(240,200,105,.3)'),
            cursor: 'pointer',
          }}>{o}</button>
        );
      })}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', borderRadius: 8,
  background: 'rgba(255,255,255,.05)', color: '#fdfaf2',
  border: '1px solid rgba(240,200,105,.3)', fontSize: 14,
};

function LoadingPanel({ text }: { text: string }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 40, height: 40, border: '3px solid #f0c869', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <div style={{ color: '#f0c869', fontSize: 14, letterSpacing: 2 }}>{text}</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ErrorPanel({ msg, onRetry, onBack }: { msg: string; onRetry: () => void; onBack: () => void }) {
  return (
    <div style={{ position: 'absolute', inset: 0, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 18 }}>
      <div style={{ color: '#d4222b', fontSize: 18, fontWeight: 700 }}>出了点岔子</div>
      <div style={{ color: '#fdfaf2', fontSize: 13, opacity: 0.7, wordBreak: 'break-all' }}>{msg}</div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onRetry} style={{ flex: 1, padding: '12px 18px', borderRadius: 999, background: '#d4222b', color: '#fff', border: 'none', fontSize: 14 }}>重试</button>
        <button onClick={onBack} style={{ flex: 1, padding: '12px 18px', borderRadius: 999, background: 'transparent', color: '#fdfaf2', border: '1px solid rgba(255,255,255,.3)', fontSize: 14 }}>返回</button>
      </div>
    </div>
  );
}
