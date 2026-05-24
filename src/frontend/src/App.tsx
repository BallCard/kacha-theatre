import { useState, useRef, useEffect } from "react";
import { mockAnalyze } from "./mock/analyzeResults";
import { CanvasItem, AnalyzeResult } from "./types";
import { StickerCanvas } from "./components/StickerCanvas";
import { ToolBar } from "./components/ToolBar";
import { PosterPreview } from "./components/PosterPreview";
import { StoryV2Screen } from "./screens/StoryV2Screen";
import { sha256OfDataUrl } from "./services/storyApi";
import { getStickerUrl, getBigTierStampUrl, getScoreTicketUrl } from "./utils/assets";
import { autoPickStickers } from "./utils/autoPickStickers";
import {
  Camera,
  Image as ImageIcon,
  HelpCircle,
  Sparkles,
  ChevronLeft,
  Check,
  Copy,
  Download,
  RefreshCw,
  Loader2,
  Wand2
} from "lucide-react";
import * as htmlToImage from "html-to-image";

export default function App() {
  // Screens navigation routing: 'home' | 'loading' | 'edit' | 'preview' | 'story'
  const [screen, setScreen] = useState<'home' | 'loading' | 'edit' | 'preview' | 'story'>('home');

  // Core visual data states
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [analyzeResult, setAnalyzeResult] = useState<AnalyzeResult | null>(null);
  
  // Canvas item state and selection handlers
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<string>("");
  const [compiledCanvasUrl, setCompiledCanvasUrl] = useState<string | null>(null);

  // Undo transaction history snapshot lists
  const [historyStack, setHistoryStack] = useState<CanvasItem[][]>([]);
  const [activeDrawer, setActiveDrawer] = useState<"sticker" | "text" | "title" | null>(null);

  // Modal overlays
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // 剧情游戏：StoryV2Screen 重玩通过 key 强制重挂载触发
  const [storyKey, setStoryKey] = useState(0);
  const [storyImageHash, setStoryImageHash] = useState<string | null>(null);

  // 进入 Part 2 时按需算 imageHash（供 /plot/v2/node 复用同图缓存）
  useEffect(() => {
    if (screen === 'story' && imageSrc && !storyImageHash) {
      sha256OfDataUrl(imageSrc).then(setStoryImageHash).catch(() => {});
    }
  }, [screen, imageSrc, storyImageHash]);

  // 古风原型「入梦」按钮带过来的图，自动进入 Part 2
  useEffect(() => {
    const fromGuofeng = new URLSearchParams(location.search).has('fromGuofeng');
    if (!fromGuofeng) return;
    const img = localStorage.getItem('kacha_story_image');
    const h = localStorage.getItem('kacha_story_hash');
    if (img) {
      setImageSrc(img);
      if (h) setStoryImageHash(h);
      setScreen('story');
      // 用完即清，防止 F5 还在 story
      localStorage.removeItem('kacha_story_image');
      localStorage.removeItem('kacha_story_hash');
    }
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto clean up alerts
  useEffect(() => {
    if (modalMessage) {
      const timer = setTimeout(() => setModalMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [modalMessage]);

  // Handle local File Selection (and convert to high-def DataUri stream)
  const processImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      if (e.target?.result && typeof e.target.result === "string") {
        setImageSrc(e.target.result);
        setScreen('loading');
        
        try {
          // Await simulated imperial review delayed results
          const result = await mockAnalyze();
          setAnalyzeResult(result);
          setSelectedTitle(result.title_candidates[0] || "摸鱼判官");
          
          // Reset canvas states
          const initialCanvasItems: CanvasItem[] = [];

          // 1. 右上角自动盖大段位印章（倾斜 -12°）
          initialCanvasItems.push({
            id: `tier_stamp_${Date.now()}`,
            type: 'sticker',
            src: getBigTierStampUrl(result.level_tier),
            stickerType: `${result.level_tier}印章`,
            x: 395,
            y: 110,
            width: 170,
            height: 170,
            rotation: -12,
          });

          // 2. 左下角自动盖摸鱼+N 金牌票据（轻微倾斜）
          initialCanvasItems.push({
            id: `score_ticket_${Date.now() + 1}`,
            type: 'sticker',
            src: getScoreTicketUrl(result.moyu_score),
            stickerType: `摸鱼+${result.moyu_score}`,
            x: 130,
            y: 410,
            width: 200,
            height: 90,
            rotation: -4,
          });

          // 3. 人脸框（如果有）盖小印
          result.face_boxes.forEach((box, i) => {
            initialCanvasItems.push({
              id: `face_seal_${i}_${Date.now() + 2 + i}`,
              type: 'sticker',
              src: getStickerUrl('face_seal_big'),
              stickerType: '御史封脸印',
              x: box.x * 500 + (box.w * 500) / 2,
              y: box.y * 500 + (box.h * 500) / 2,
              width: box.w * 500 * 1.5,
              height: box.h * 500 * 1.5,
              rotation: (i - 0.5) * 8,
            });
          });

          // 4. AI 自动按奏折 yi/ji/分数/姿态再贴 2-3 个气泡/便利贴/朱红小印（避开已有硬占位 + 人脸框）
          initialCanvasItems.push(...autoPickStickers(result));

          setCanvasItems(initialCanvasItems);
          setHistoryStack([initialCanvasItems]); // initialize history
          setTimeout(() => {
            setScreen('edit');
          }, 600);
        } catch (err) {
          setModalMessage("御史批阅奏折受阻，请重试！");
          setScreen('home');
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileUploadTrigger = (captureEnvironment: boolean) => {
    if (fileInputRef.current) {
      if (captureEnvironment) {
        fileInputRef.current.setAttribute("capture", "environment");
      } else {
        fileInputRef.current.removeAttribute("capture");
      }
      fileInputRef.current.click();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  // Undo mechanism
  const trackAction = () => {
    // Save snapshot state of items
    setHistoryStack((prev) => {
      const updated = [...prev, JSON.parse(JSON.stringify(canvasItems))];
      if (updated.length > 10) updated.shift(); // max capacity 10 entries limit
      return updated;
    });
  };

  const handleUndo = () => {
    if (historyStack.length <= 1) return;
    const parent = [...historyStack];
    parent.pop(); // discard current state
    const previousState = parent[parent.length - 1] || [];
    setCanvasItems(previousState);
    setHistoryStack(parent); // update stack list
    setSelectedId(null);
    setModalMessage("已撤销上一步编辑 ↶");
  };

  // Canvas insertions
  const handleAddSticker = (src: string, stickerName: string) => {
    trackAction();
    const isSpecialSeal = src.includes("face_seal_big") || stickerName === "御史封脸印";
    
    // Auto center positioning
    const centerOffset = isSpecialSeal ? 150 : 100;
    
    // Avoid double collision overlapping stack
    let xOffset = 250;
    let yOffset = 250;
    const lastSticker = canvasItems[canvasItems.length - 1];
    if (lastSticker && Math.abs(lastSticker.x - 250) < 5) {
      xOffset = 270;
      yOffset = 270;
    }

    const newItem: CanvasItem = {
      id: `sticker_${Date.now()}`,
      type: "sticker",
      src,
      stickerType: stickerName,
      x: xOffset,
      y: yOffset,
      width: centerOffset,
      height: centerOffset,
      rotation: 0,
    };
    
    const updated = [...canvasItems, newItem];
    setCanvasItems(updated);
    setSelectedId(newItem.id); // auto select
    setModalMessage(`已添加贴纸: ${stickerName}`);
  };

  const handleAddText = (text: string, fontFamily: string, color: string) => {
    trackAction();
    const newItem: CanvasItem = {
      id: `text_${Date.now()}`,
      type: "text",
      text,
      x: 250,
      y: 200,
      width: 150,
      height: 40,
      rotation: 0,
      color,
      fontFamily,
    };
    const updated = [...canvasItems, newItem];
    setCanvasItems(updated);
    setSelectedId(newItem.id); // auto select
    setModalMessage("已写入朱砂御批墨宝");
  };

  // Finish editor screen transition
  const handleEditorDone = () => {
    // 1. Deselect target transformer so framing lines are hidden!
    setSelectedId(null);
    
    // We set a small state buffer and fetch the active DOM or Konva layer
    setModalMessage("御谕核定中，正在合成海报...");
    
    // Capture and embed Konva static dataUrl 
    setTimeout(() => {
      const stageDom = document.querySelector(".konvajs-content canvas") as HTMLCanvasElement;
      if (stageDom) {
        try {
          const stream = stageDom.toDataURL("image/png", 1.0);
          setCompiledCanvasUrl(stream);
          setActiveDrawer(null);
          setScreen('preview');
        } catch (err) {
          // fallback to simple DOM selector
          setCompiledCanvasUrl(imageSrc);
          setScreen('preview');
        }
      } else {
        setCompiledCanvasUrl(imageSrc);
        setScreen('preview');
      }
    }, 400);
  };

  // Export full post long-height graphic — 直接触发浏览器下载，不再弹长按
  const handleExportPoster = async () => {
    const posterNode = document.getElementById("printable-poster-area");
    if (!posterNode) return;

    setIsExporting(true);
    setModalMessage("诏书摹本御制中...");

    try {
      const dataUrl = await htmlToImage.toPng(posterNode, {
        quality: 1.0,
        pixelRatio: 2.5,
        backgroundColor: "#f5efe1",
        cacheBust: true,
      });
      // 点 a[download] 直接下载到本地
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `咔嚓剧场_${selectedTitle || '诏书'}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setIsExporting(false);
      setModalMessage("电子诏书已下载到本地 📥");
    } catch (err) {
      setIsExporting(false);
      setModalMessage("生成失败，请稍后重试");
    }
  };

  const handleCopyShareLink = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setModalMessage("分享链接复制成功！");
    } catch (err) {
      setModalMessage("请手动复制浏览器地址栏分享");
    }
  };

  return (
    <div 
      id="app-root-shell" 
      className="min-h-screen bg-[#f6f6f6] flex flex-col items-center justify-center p-0 md:p-8 overflow-x-hidden antialiased select-none relative"
    >
      
      {/* Target hidden File Upload input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleInputChange} 
        className="hidden shadow-none outline-none border-none" 
        accept="image/*" 
      />

      {/* Main Single Page Frame container (Simulated mobile 375x812 responsive ratio with bold phone frame) */}
      <div
        id="phone-device-frame"
        className="w-full max-w-[430px] h-[100dvh] md:h-[900px] md:min-h-[820px] bg-[#f6f6f6] flex flex-col justify-between shadow-none md:shadow-2xl md:rounded-[44px] overflow-hidden relative md:border-[10px] md:border-[#222129]"
      >
        
        {/* =======================================================
            SCREEN 1: HOME PAGE
           ======================================================= */}
        {screen === "home" && (
          <div id="screen-home" className="flex-1 min-h-0 overflow-y-auto flex flex-col justify-between p-5 pb-8 animate-fade-in bg-[#f6f6f6]">
            
            {/* Top Miniprogram styled Navigation Bar */}
            <header className="h-11 flex items-center justify-center text-center mt-2 pb-2">
              <span 
                className="text-2xl font-black text-[#d4222b] font-serif tracking-widest drop-shadow-xs"
                style={{ fontFamily: "'STKaiti', 'Kaiti', 'STSong', serif" }}
              >
                咔嚓剧场
              </span>
            </header>

            {/* Mascot Imperial Welcome Card */}
            <div className="flex-1 flex flex-col justify-center items-center gap-6 my-4">
              
              {/* Beautiful interactive vintage roll cover banner */}
              <div 
                id="imperial-emblem-card" 
                className="w-full bg-white rounded-3xl p-6 shadow-xs border border-gray-100 flex flex-col items-center justify-center relative overflow-hidden"
                style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.02)" }}
              >
                <div className="absolute top-[-20px] left-[-20px] w-12 h-12 bg-red-500/5 rounded-full" />
                <div className="absolute bottom-[-20px] right-[-20px] w-20 h-20 bg-red-500/5 rounded-full" />

                {/* Vector Shield Emblem representing the Emperor's censor bureau */}
                <div className="w-24 h-24 bg-[#fdfaf2] border-2 border-[#d4222b] rounded-full flex items-center justify-center mb-4 shadow-inner relative transform hover:rotate-12 transition-transform duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-16 h-16 text-[#d4222b]">
                    <rect x="25" y="25" width="50" height="50" rx="4" fill="none" stroke="#d4222b" strokeWidth="4" strokeDasharray="2 1" />
                    <rect x="30" y="30" width="40" height="40" rx="3" fill="none" stroke="#d4222b" strokeWidth="2" />
                    <text x="50" y="56" fontFamily="'STKaiti', 'Kaiti', serif" fontWeight="900" fontSize="24" fill="#d4222b" textAnchor="middle">审</text>
                  </svg>
                </div>

                <span 
                  className="text-xl font-bold font-serif text-[#2a2830] tracking-wider"
                  style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}
                >
                  明代御史 • 当代审稿
                </span>
                
                <p 
                  className="text-xs text-[#8a8a8a] mt-3.5 leading-relaxed text-center font-serif px-4"
                  style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}
                >
                  " 上传一张办公室日常，让御史老爷为您批阅奏折！看看今日您是几品摸鱼，加盖诏印！"
                </p>
              </div>

              {/* Upload action triggers */}
              <div className="w-full flex flex-col gap-3 px-1 mt-2">
                
                {/* 1. Camera snapshot file capture */}
                <button
                  id="btn-photo"
                  onClick={() => handleFileUploadTrigger(true)}
                  className="w-full py-4 bg-[#d4222b] text-white hover:bg-[#b01c23] rounded-full font-bold text-sm tracking-widest flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-95 duration-100 uppercase"
                >
                  <Camera size={18} className="stroke-[2.5px]" />
                  <span>📸 拍一张审审</span>
                </button>

                {/* 2. Photo Album pick selector */}
                <button
                  id="btn-album"
                  onClick={() => handleFileUploadTrigger(false)}
                  className="w-full py-4 bg-white text-[#d4222b] border-2 border-[#d4222b] hover:bg-red-50/40 rounded-full font-bold text-sm tracking-widest flex items-center justify-center gap-2.5 transition-all active:scale-95 duration-100"
                >
                  <ImageIcon size={18} className="stroke-[2.5px]" />
                  <span>🖼️ 从相册选</span>
                </button>
                
              </div>

              {/* Service bento cards section details */}
              <div id="service-grid-bento" className="w-full grid grid-cols-3 gap-2 px-1">
                <div className="bg-white p-3 rounded-2xl flex flex-col items-center justify-center text-center border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                  <span className="text-lg">🎯</span>
                  <span className="text-[10px] font-bold text-[#2a2830] font-serif mt-1">AI 评分</span>
                  <span className="text-[8px] text-[#8a8a8a] mt-0.5 mt-1 leading-tight scale-90">六档官阶由差评到天尊</span>
                </div>
                <div className="bg-white p-3 rounded-2xl flex flex-col items-center justify-center text-center border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                  <span className="text-lg">🎨</span>
                  <span className="text-[10px] font-bold text-[#2a2830] font-serif mt-1">修图二创</span>
                  <span className="text-[8px] text-[#8a8a8a] mt-0.5 mt-1 leading-tight scale-90">加朱红印泥與贴纸弹签</span>
                </div>
                <div className="bg-white p-3 rounded-2xl flex flex-col items-center justify-center text-center border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                  <span className="text-lg">📥</span>
                  <span className="text-[10px] font-bold text-[#2a2830] font-serif mt-1">一键导出</span>
                  <span className="text-[8px] text-[#8a8a8a] mt-0.5 mt-1 leading-tight scale-90">竖版长卷，发群社交货币</span>
                </div>
              </div>

            </div>

            {/* Bottom Credits copyright stamp */}
            <footer className="h-6 flex items-center justify-center text-center opacity-45">
              <span className="text-[9px] font-serif tracking-widest text-[#2a2830] font-bold" style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}>
                御史台 • 印 • 甲辰年
              </span>
            </footer>

          </div>
        )}

        {/* =======================================================
            SCREEN 2: SCROLL DECREE LOADING PAGE
           ======================================================= */}
        {screen === "loading" && (
          <div id="screen-loading" className="flex-1 flex flex-col justify-center items-center bg-[#fdfaf2] p-6 animate-fade-in relative">
            
            {/* Traditional Horizontal Roll Unfold movement */}
            <div className="relative flex flex-col items-center justify-center">
              
              {/* Virtual roll scroll tube graphics */}
              <div 
                id="unfolding-scroll-rod" 
                className="w-48 h-3.5 bg-amber-800 rounded-full shadow-md animate-unfold-horizontal transform border border-amber-950" 
              />
              
              <div className="w-44 h-24 bg-[#ebdcb4] mt-1 rounded-sm shadow-inner flex flex-col items-center justify-center overflow-hidden border border-[#d2bf94] relative px-3">
                
                {/* Calligraphy ink handwriting brush paths */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#fdf9f2]/35 to-transparent animate-shimmer" />
                <span 
                  className="text-sm font-bold font-serif tracking-widest text-[#d4222b] z-10 animate-pulse text-center"
                  style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}
                >
                  御史批阅奏折中...
                </span>
                
              </div>

              <div className="w-48 h-3.5 bg-amber-800 rounded-full shadow-md mt-1 border border-amber-950" />

            </div>

            <div className="mt-8 flex flex-col items-center gap-2">
              <Loader2 className="animate-spin text-[#d4222b] duration-1000" size={24} />
              <p 
                className="text-xs font-serif text-[#b39e70] tracking-wider animate-bounce text-center"
                style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}
              >
                "朱砂已备，神游笔走..."
              </p>
            </div>

          </div>
        )}

        {/* =======================================================
            SCREEN 3: CANVAS二创 EDITING PAGE
           ======================================================= */}
        {screen === "edit" && analyzeResult && (
          <div id="screen-edit" className="flex-1 min-h-0 flex flex-col justify-between animate-fade-in bg-[#f6f6f6]">
            
            {/* Top Navigation Control bar (44px) */}
            <header className="h-11 border-b border-gray-200/80 bg-white flex items-center justify-between px-3 shrink-0">
              <button
                id="edit-back-btn"
                onClick={() => {
                  if (confirm("确定要返回吗？当前已加贴纸会被清空")) {
                    setImageSrc(null);
                    setAnalyzeResult(null);
                    setCanvasItems([]);
                    setScreen('home');
                  }
                }}
                className="p-1 text-gray-500 hover:text-gray-800 active:scale-90 transition-all"
              >
                <ChevronLeft size={22} className="stroke-[2.5px]" />
              </button>

              <span className="text-sm font-bold text-[#2a2830]">
                二创神游御笔
              </span>

              <button
                id="edit-complete-btn"
                onClick={handleEditorDone}
                className="px-3.5 py-1 bg-[#d4222b] hover:bg-[#b01c23] text-white rounded-full text-xs font-bold tracking-wider active:scale-95 transition-all shadow-xs"
              >
                完成
              </button>
            </header>

            {/* Scroll Panel containing active edit Canvas context */}
            <main className="flex-1 min-h-0 overflow-y-auto px-4 py-3 flex flex-col gap-4">
              
              {/* Target layout title descriptor stamp label */}
              <div className="bg-[#fcfaf2] border border-[#e8dfc7] p-2.5 rounded-xl flex items-center justify-between gap-1.5 shrink-0 shadow-2xs">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={13} className="text-[#d4222b]" />
                  <span className="text-[11px] font-bold text-[#b39e70] font-serif" style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}>
                    御定段位 & 册封封号:
                  </span>
                </div>
                <span className="text-xs font-bold text-[#d4222b] uppercase font-mono bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                  {analyzeResult.level_tier} • {selectedTitle}
                </span>
              </div>

              {/* Main canvas board */}
              <div className="w-full shrink-0">
                <StickerCanvas 
                  imageSrc={imageSrc!} 
                  items={canvasItems}
                  selectedId={selectedId}
                  onSelectId={setSelectedId}
                  onChangeItems={setCanvasItems}
                  onTrackAction={trackAction}
                />
              </div>

              {/* Collapsed decree reference scroll text label */}
              <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-1.5 text-left shrink-0">
                <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider font-serif">
                  📜 御笔批文原稿 (点击下方称号勋衔可更改官衔勋章)
                </span>
                <p 
                  className="text-xs leading-loose text-gray-600 font-serif"
                  style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}
                >
                  {analyzeResult.report.paragraph}
                </p>
              </div>

            </main>

            {/* Unified interactive Tool bar drawer */}
            <ToolBar 
              onAddSticker={handleAddSticker}
              onAddText={handleAddText}
              onUndo={handleUndo}
              canUndo={historyStack.length > 1}
              titleCandidates={analyzeResult.title_candidates}
              selectedTitle={selectedTitle}
              onSelectTitle={setSelectedTitle}
              activeDrawer={activeDrawer}
              setActiveDrawer={setActiveDrawer}
            />

          </div>
        )}

        {/* =======================================================
            SCREEN 4: PREVIEW AND CAPTURING PAGE
           ======================================================= */}
        {screen === "preview" && analyzeResult && (
          <div id="screen-preview" className="flex-1 min-h-0 flex flex-col justify-between animate-fade-in bg-[#f6f6f6]">
            
            {/* Top Navigation Bar */}
            <header className="h-11 border-b border-gray-200 bg-white flex items-center justify-between px-3 shrink-0">
              <button
                id="preview-back-btn"
                onClick={() => setScreen('edit')}
                className="p-1 text-gray-500 hover:text-gray-800 active:scale-90 transition-all"
              >
                <ChevronLeft size={22} className="stroke-[2.5px]" />
              </button>

              <span className="text-sm font-bold text-[#2a2830]">
                御制摸鱼诏书
              </span>

              <div className="w-6 h-6 shrink-0" />
            </header>

            {/* Scrollable Printable elements area wrapper */}
            <main className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-4">
              
              {/* The high definition vector poster ready to scan */}
              <div className="w-full transform transition-all duration-300">
                <PosterPreview 
                  score={analyzeResult.moyu_score}
                  levelTier={analyzeResult.level_tier}
                  selectedTitle={selectedTitle}
                  compiledCanvasUrl={compiledCanvasUrl}
                  report={analyzeResult.report}
                />
              </div>

              {/* Mini warning box indicator */}
              <div className="bg-[#f0ecd8] p-3 rounded-xl border border-[#dfd9bf] flex gap-2 text-[11px] leading-relaxed text-[#8a7243] text-left">
                <HelpCircle size={15} className="shrink-0 mt-0.5 text-[#d4222b]" />
                <p className="font-serif" style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}>
                  御批：点击下方"生成长图"，电子诏书会直接下载到本地相册或下载目录。
                </p>
              </div>

            </main>

            {/* Fixed action columns bottom trigger buttons */}
            <footer className="p-4 bg-white border-t border-gray-200/80 flex flex-col gap-2.5 shrink-0">

              {/* 0. 开启互动剧情（新功能入口） */}
              <button
                id="btn-open-story"
                onClick={() => {
                  setStoryKey((k) => k + 1);
                  setScreen('story');
                }}
                className="w-full py-3.5 bg-gradient-to-r from-[#2a2520] to-[#3a2f24] text-[#f0c869] border border-[#f0c869]/70 hover:from-[#3a2f24] hover:border-[#f0c869] rounded-full font-bold text-sm tracking-widest flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-95"
                style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}
              >
                <Wand2 size={16} />
                <span>✒ 开启互动剧情·御史外传</span>
              </button>

              {/* 1. Generate PNG stream overlay */}
              <button
                id="btn-export-poster"
                onClick={handleExportPoster}
                className="w-full py-3.5 bg-[#d4222b] text-white hover:bg-[#b01c23] rounded-full font-bold text-sm tracking-widest flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-95 duration-100 uppercase"
              >
                <Download size={16} />
                <span>📥 制作电子诏书（生成长图）</span>
              </button>

              <div className="flex gap-2.5">
                {/* 2. Copy and share URI */}
                <button
                  id="btn-copy-links"
                  onClick={handleCopyShareLink}
                  className="flex-1 py-3 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-full font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <Copy size={14} />
                  <span>复制分享链接</span>
                </button>

                {/* 3. Re-examine new file */}
                <button
                  id="btn-redo-all"
                  onClick={() => {
                    if (confirm("确定要重新审阅新折子吗？")) {
                      setImageSrc(null);
                      setAnalyzeResult(null);
                      setCanvasItems([]);
                      setScreen('home');
                    }
                  }}
                  className="flex-1 py-3 bg-white text-[#d4222b] border border-[#d4222b] hover:bg-red-50/20 rounded-full font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <RefreshCw size={14} />
                  <span>重开新诏</span>
                </button>
              </div>

            </footer>

          </div>
        )}

        {/* =======================================================
            SCREEN 5: INTERACTIVE STORY GAME (Part 2 v2)
           ======================================================= */}
        {screen === "story" && imageSrc && (
          <StoryV2Screen
            key={storyKey}
            initialImageBase64={imageSrc}
            initialImageHash={storyImageHash ?? undefined}
            onExit={() => setScreen('preview')}
          />
        )}

      </div>

      {/* Modern floating toast popups */}
      {modalMessage && (
        <div 
          id="toast-notification"
          className="fixed top-6 left-1/2 transform -translate-x-1/2 bg-[#2a2830] text-[#fdfaf2] border border-[#d2bf94] px-5 py-2.5 rounded-full text-xs font-serif font-black shadow-2xl tracking-wide flex items-center gap-2 z-[9999] animate-bounce-subtle"
          style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}
        >
          <Sparkles size={11} className="text-[#f0c869] shrink-0" />
          <span>{modalMessage}</span>
        </div>
      )}

      {/* Full loading overlay backdrop for html-to-image exporting stage */}
      {isExporting && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-[2px] z-[999999] flex flex-col justify-center items-center text-white">
          <div className="bg-[#2a2830] p-6 rounded-2xl border border-[#d2bf94] flex flex-col items-center gap-3 shadow-2xl">
            <Loader2 className="animate-spin text-[#f0c869]" size={32} />
            <span className="font-serif text-xs font-bold text-[#fdfaf2] tracking-wider">
              "内阁学士奉诏摹印中，御笔著墨，请稍后..."
            </span>
          </div>
        </div>
      )}

      {/* Styled animation CSS directives injection */}
      <style>{`
        @keyframes unfoldHorizontal {
          0% {
            transform: scaleX(0.1);
          }
          100% {
            transform: scaleX(1);
          }
        }
        .animate-unfold-horizontal {
          animation: unfoldHorizontal 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>

    </div>
  );
}
