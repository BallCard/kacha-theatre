import { useState } from "react";
import { STICKERS, getStickerUrl } from "../utils/assets";
import { Tag, Edit3, Bookmark, CornerUpLeft, Plus, Check } from "lucide-react";

interface ToolBarProps {
  onAddSticker: (src: string, name: string) => void;
  onAddText: (text: string, font: string, color: string) => void;
  onUndo: () => void;
  canUndo: boolean;
  titleCandidates: string[];
  selectedTitle: string;
  onSelectTitle: (title: string) => void;
  activeDrawer: "sticker" | "text" | "title" | null;
  setActiveDrawer: (drawer: "sticker" | "text" | "title" | null) => void;
}

export function ToolBar({
  onAddSticker,
  onAddText,
  onUndo,
  canUndo,
  titleCandidates,
  selectedTitle,
  onSelectTitle,
  activeDrawer,
  setActiveDrawer,
}: ToolBarProps) {
  // Text Tool Drawer internal states
  const [inputText, setInputText] = useState("");
  const [textFont, setTextFont] = useState("'STKaiti', 'Kaiti', serif");
  const [textColor, setTextColor] = useState("#d4222b");

  const FONTS_CHIPS = [
    { label: "楷体", value: "'STKaiti', 'Kaiti', serif" },
    { label: "宋体", value: "'STSong', 'SimSun', serif" },
    { label: "滑稽体", value: "'Comic Sans MS', cursive, sans-serif" },
  ];

  const COLOR_PALETTE = [
    { label: "朱红", value: "#d4222b" },
    { label: "金黄", value: "#f0c869" },
    { label: "黑墨", value: "#2a2830" },
    { label: "皓白", value: "#ffffff" },
    { label: "翠绿", value: "#3f8c5a" },
  ];

  const handleTabClick = (drawerType: "sticker" | "text" | "title") => {
    if (activeDrawer === drawerType) {
      setActiveDrawer(null); // toggle close
    } else {
      setActiveDrawer(drawerType);
    }
  };

  const handleTextSubmit = () => {
    if (!inputText.trim()) return;
    onAddText(inputText.trim(), textFont, textColor);
    setInputText("");
    setActiveDrawer(null); // close drawer
  };

  return (
    <div id="toolbar-root" className="w-full relative z-40">
      
      {/* Drawer backdrop overlay mask */}
      {activeDrawer && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-[1px] transition-opacity duration-300"
          onClick={() => setActiveDrawer(null)}
        />
      )}

      {/* Dynamic Slide Drawer - 50% height, WeChat Mini Program style top-curved corners */}
      <div 
        id="toolbar-drawer"
        className={`fixed left-0 right-0 bottom-0 bg-white border-t border-[#e3d7b3] shadow-[0_-8px_32px_rgba(0,0,0,0.08)] rounded-t-[28px] overflow-hidden transition-all duration-300 ease-out z-50 ${
          activeDrawer ? "h-[50dvh]" : "h-0"
        }`}
      >
        {/* Fine-line drawer controller bar */}
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto my-3" onClick={() => setActiveDrawer(null)} />

        <div className="px-5 pb-8 h-[calc(100%-30px)] overflow-y-auto">
          
          {/* 1. STICKER PICKER DRAWER */}
          {activeDrawer === "sticker" && (
            <div id="drawer-stickers" className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center pb-2 border-b border-[#f0ecd8]">
                <h3 className="font-serif text-[#2a2830] font-bold text-sm">御史堂印章与贴签</h3>
                <span className="text-[11px] text-[#8a8a8a]">点击即可置于画布</span>
              </div>

              {/* Special row: High Honor Big Face Censor Seal */}
              <div className="bg-[#fdfaf2] p-3 rounded-xl border border-[#ece7d2] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🏆</span>
                  <div>
                    <h4 className="font-serif text-sm font-bold text-[#d4222b]">御史封脸大印</h4>
                    <p className="text-[11px] text-[#8a8a8a]">巨屏盖脸，摸鱼重犯钦定用章</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const u = getStickerUrl("face_seal_big");
                    onAddSticker(u, "御史封脸印");
                    setActiveDrawer(null);
                  }}
                  className="px-4 py-1.5 bg-[#d4222b] text-white rounded-full text-xs font-serif font-bold active:scale-95 transition-all shadow-sm"
                >
                  刻印
                </button>
              </div>

              {/* Categorized GRID scroll sheets */}
              <div className="space-y-4 pt-1">
                <div>
                  <span className="text-[11px] font-bold text-[#8a8a8a] tracking-wider font-serif">朱红殿印 (Seals)</span>
                  <div className="grid grid-cols-3 gap-3.5 mt-2">
                    {STICKERS.filter(s => s.category === "seal").map((s) => (
                      <div 
                        key={s.id}
                        onClick={() => {
                          onAddSticker(getStickerUrl(s.id), s.name);
                          setActiveDrawer(null);
                        }}
                        className="bg-[#f8f8f8] border border-[#ebebeb] hover:border-[#d4222b] rounded-xl flex flex-col items-center justify-center p-2 cursor-pointer transition-all active:scale-95 text-center shadow-xs"
                      >
                        <img src={getStickerUrl(s.id)} alt={s.name} className="w-14 h-14 object-contain" />
                        <span className="text-[10px] font-medium font-serif mt-1 text-gray-600">{s.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-[#8a8a8a] tracking-wider font-serif">吐槽漫画气泡 (Comics)</span>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {STICKERS.filter(s => s.category === "bubble").map((s) => (
                      <div 
                        key={s.id}
                        onClick={() => {
                          onAddSticker(getStickerUrl(s.id), s.name);
                          setActiveDrawer(null);
                        }}
                        className="bg-[#f8f8f8] border border-[#ebebeb] hover:border-[#d4222b] rounded-xl flex items-center gap-2 p-2 px-3 cursor-pointer transition-all active:scale-95 justify-start shadow-xs"
                      >
                        <img src={getStickerUrl(s.id)} alt={s.name} className="w-12 h-8 object-contain" />
                        <span className="text-[11px] font-medium text-gray-700">{s.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-[#8a8a8a] tracking-wider font-serif">朱批御用便利贴 (Tags)</span>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {STICKERS.filter(s => s.category === "tag").map((s) => (
                      <div 
                        key={s.id}
                        onClick={() => {
                          onAddSticker(getStickerUrl(s.id), s.name);
                          setActiveDrawer(null);
                        }}
                        className="bg-[#f8f8f8] border border-[#ebebeb] hover:border-[#d4222b] rounded-xl flex items-center gap-2 p-2 px-3 cursor-pointer transition-all active:scale-95 justify-start shadow-xs"
                      >
                        <img src={getStickerUrl(s.id)} alt={s.name} className="w-12 h-8 object-contain" />
                        <span className="text-[11px] font-medium text-gray-700 font-serif">{s.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* 2. TEXT ADDER DRAWER */}
          {activeDrawer === "text" && (
            <div id="drawer-texts" className="space-y-4 animate-fade-in text-[#2a2830]">
              <div className="flex justify-between items-center pb-2 border-b border-[#f0ecd8]">
                <h3 className="font-serif text-[#2a2830] font-bold text-sm">朱墨手书文字</h3>
                <span className="text-[11px] text-[#8a8a8a]">拖入字迹，二创讽谏</span>
              </div>

              {/* Input field */}
              <div className="relative">
                <input 
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="在此写下摸鱼谏言..."
                  className="w-full bg-[#f6f6f6] border border-[#ebe9e1] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#d4222b] transition-all font-medium placeholder:text-gray-400"
                  maxLength={18}
                />
                <span className="absolute right-3 bottom-3 text-[10px] text-gray-400 font-mono">
                  {inputText.length}/18
                </span>
              </div>

              {/* Font choices */}
              <div>
                <span className="text-[11px] font-semibold text-gray-400 block mb-2">选择书风:</span>
                <div className="flex gap-2.5">
                  {FONTS_CHIPS.map((chip) => (
                    <button
                      key={chip.value}
                      onClick={() => setTextFont(chip.value)}
                      className={`px-4 py-1.5 rounded-full text-xs font-serif border transition-all active:scale-95 ${
                        textFont === chip.value 
                          ? "bg-[#d4222b] text-white border-transparent shadow-xs" 
                          : "bg-gray-50 text-gray-700 border-[#e5e5e5]"
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color blobs */}
              <div>
                <span className="text-[11px] font-semibold text-gray-400 block mb-2">御用墨宝配色:</span>
                <div className="flex items-center gap-3.5">
                  {COLOR_PALETTE.map((pal) => (
                    <button
                      key={pal.value}
                      onClick={() => setTextColor(pal.value)}
                      className="w-7 h-7 rounded-full border border-gray-300 relative flex items-center justify-center transition-all hover:scale-110 active:scale-90"
                      style={{ backgroundColor: pal.value }}
                      title={pal.label}
                    >
                      {textColor === pal.value && (
                        <Check size={14} className={pal.value === "#ffffff" ? "text-black" : "text-white"} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Create/Add node action */}
              <button
                onClick={handleTextSubmit}
                disabled={!inputText.trim()}
                className={`w-full mt-2.5 py-3 rounded-full font-bold text-sm flex items-center justify-center gap-2 tracking-wider transition-all cursor-pointer ${
                  inputText.trim() 
                    ? "bg-[#d4222b] text-white hover:bg-[#b01c23] active:scale-95 shadow-sm"
                    : "bg-[#e5e5e5] text-gray-400 cursor-not-allowed"
                }`}
              >
                <Plus size={16} />
                <span>提笔著墨 （添加至画布）</span>
              </button>

            </div>
          )}

          {/* 3. TITLE CUSTOMIZER DRAWER */}
          {activeDrawer === "title" && (
            <div id="drawer-titles" className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center pb-2 border-b border-[#f0ecd8]">
                <h3 className="font-serif text-[#2a2830] font-bold text-sm">皇天后土 • 赐予封号</h3>
                <span className="text-[11px] text-[#8a8a8a]">在批示中即时调换御用称号</span>
              </div>

              <p className="text-xs text-mono text-gray-500 bg-gray-50 p-2.5 rounded-lg leading-relaxed">
                御史台御批：摸鱼品阶已定，但册书大礼不可荒废。点击更换在奏折正中展示的朱笔大字官衔勋章。
              </p>

              {/* Titles lists */}
              <div className="flex flex-col gap-3.5 pt-1">
                {titleCandidates.map((title) => {
                  const isSelected = selectedTitle === title;
                  return (
                    <div
                      key={title}
                      onClick={() => {
                        onSelectTitle(title);
                        setActiveDrawer(null);
                      }}
                      className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all active:scale-98 ${
                        isSelected 
                          ? "bg-[#fdf3f3] border-[#d4222b] shadow-xs"
                          : "bg-[#fdfdfd] border-[#ebe9e1] hover:border-[#dfddda]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                          isSelected ? "bg-[#d4222b] text-white" : "bg-gray-100 text-gray-500"
                        }`}>
                          {isSelected ? "✓" : "•"}
                        </span>
                        <span 
                          className="font-serif text-lg font-black tracking-widest text-[#2a2830]"
                          style={{ fontFamily: "'STKaiti', 'Kaiti', serif" }}
                        >
                          {title}
                        </span>
                      </div>
                      
                      {isSelected ? (
                        <span className="text-xs font-serif font-black text-[#d4222b] bg-[#f9dbdb] px-2.5 py-0.5 rounded-full">当前佩授</span>
                      ) : (
                        <span className="text-xs text-gray-400 font-serif">册封该号</span>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          )}

        </div>
      </div>

      {/* Main Bottom Fix Navigation Tool Bar (60px high) */}
      <footer 
        id="toolbar-navigation-footer" 
        className="h-16 bg-white border-t border-gray-200/80 flex items-center justify-around px-2 relative z-40"
      >
        
        {/* Stickers Toggle */}
        <button 
          id="tab-sticker"
          onClick={() => handleTabClick("sticker")}
          className={`flex flex-col items-center gap-0.5 w-[22%] h-12 justify-center rounded-xl transition-all duration-150 active:scale-95 ${
            activeDrawer === "sticker" ? "text-[#d4222b] bg-red-50/50" : "text-gray-500 hover:text-gray-800"
          }`}
        >
          <Tag size={19} className="stroke-[2.2px]" />
          <span className="text-[10px] font-medium tracking-wide">贴纸</span>
        </button>

        {/* Text Adder Toggle */}
        <button 
          id="tab-text"
          onClick={() => handleTabClick("text")}
          className={`flex flex-col items-center gap-0.5 w-[22%] h-12 justify-center rounded-xl transition-all duration-150 active:scale-95 ${
            activeDrawer === "text" ? "text-[#d4222b] bg-red-50/50" : "text-gray-500 hover:text-gray-800"
          }`}
        >
          <Edit3 size={19} className="stroke-[2.2px]" />
          <span className="text-[10px] font-medium tracking-wide">文字</span>
        </button>

        {/* Title Changer Toggle */}
        <button 
          id="tab-title"
          onClick={() => handleTabClick("title")}
          className={`flex flex-col items-center gap-0.5 w-[22%] h-12 justify-center rounded-xl transition-all duration-150 active:scale-95 ${
            activeDrawer === "title" ? "text-[#d4222b] bg-red-50/50" : "text-gray-500 hover:text-gray-800"
          }`}
        >
          <Bookmark size={19} className="stroke-[2.2px]" />
          <span className="text-[10px] font-medium tracking-wide">称号勋衔</span>
        </button>

        {/* Undo Action direct button */}
        <button 
          id="tab-undo"
          onClick={onUndo}
          disabled={!canUndo}
          className={`flex flex-col items-center gap-0.5 w-[22%] h-12 justify-center rounded-xl transition-all duration-150 select-none ${
            canUndo 
              ? "text-gray-700 active:scale-90 hover:text-[#d4222b] cursor-pointer" 
              : "text-gray-300 cursor-not-allowed opacity-60"
          }`}
        >
          <CornerUpLeft size={19} className="stroke-[2.2px]" />
          <span className="text-[10px] font-medium tracking-wide">撤销 ↶</span>
        </button>

      </footer>

    </div>
  );
}
