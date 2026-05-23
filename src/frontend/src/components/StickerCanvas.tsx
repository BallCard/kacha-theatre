import { useEffect, useRef, useState } from "react";
import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Transformer } from "react-konva";
import { CanvasItem } from "../types";
import { Trash2, RotateCcw } from "lucide-react";

interface StickerCanvasProps {
  imageSrc: string; // User's uploaded picture
  items: CanvasItem[];
  selectedId: string | null;
  onSelectId: (id: string | null) => void;
  onChangeItems: (items: CanvasItem[]) => void;
  onTrackAction: () => void; // push undo history
}

// Custom hook to load an image safely with status indicators
function useImageLoader(src: string) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  useEffect(() => {
    if (!src) return;
    setStatus("loading");
    const img = new window.Image();
    img.src = src;
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImage(img);
      setStatus("loaded");
    };
    img.onerror = () => {
      setImage(null);
      setStatus("error");
    };
  }, [src]);

  return [image, status] as const;
}

// Separate component for rendering KonvaImage with its own loaded HTML element internally
function CustomKonvaImage({ item, isSelected, onClick, onTransformEnd, onDragEnd }: {
  item: CanvasItem;
  isSelected: boolean;
  onClick: (e: any) => void;
  onTransformEnd: (e: any) => void;
  onDragEnd: (e: any) => void;
}) {
  const [imgElement] = useImageLoader(item.src || "");

  if (!imgElement) return null;

  return (
    <KonvaImage
      id={item.id}
      image={imgElement}
      x={item.x}
      y={item.y}
      width={item.width}
      height={item.height}
      rotation={item.rotation}
      offsetX={item.width / 2}
      offsetY={item.height / 2}
      draggable
      onClick={onClick}
      onTap={onClick}
      onDragEnd={onDragEnd}
      onTransformEnd={onTransformEnd}
    />
  );
}

export function StickerCanvas({
  imageSrc,
  items,
  selectedId,
  onSelectId,
  onChangeItems,
  onTrackAction,
}: StickerCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);

  const [canvasSize, setCanvasSize] = useState({ width: 350, height: 350 });
  const [bgImage] = useImageLoader(imageSrc);

  // Logical coordinate system boundary
  const LOGICAL_WIDTH = 500;
  const LOGICAL_HEIGHT = 500;

  // Handle auto-fit responsive resize calculation
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      setCanvasSize({ width, height: width }); // maintain square ratio
    };

    handleResize();

    const resizeObserver = new ResizeObserver(() => handleResize());
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Update Transformer nodes selection when selectedId changes
  useEffect(() => {
    if (transformerRef.current && stageRef.current) {
      if (selectedId) {
        const selectedNode = stageRef.current.findOne(`#${selectedId}`);
        if (selectedNode) {
          transformerRef.current.nodes([selectedNode]);
          transformerRef.current.getLayer().batchDraw();
        } else {
          transformerRef.current.nodes([]);
        }
      } else {
        transformerRef.current.nodes([]);
      }
    }
  }, [selectedId, items]);

  // Handle stage background tap to deselect decoration
  const handleStageClick = (e: any) => {
    const clickedOnEmpty = e.target === e.target.getStage() || e.target.name() === 'background-img';
    if (clickedOnEmpty) {
      onSelectId(null);
    }
  };

  // Selection change
  const handleItemSelect = (id: string, e: any) => {
    e.cancelBubble = true; // prevent stage tap trigger
    onSelectId(id);
  };

  // Drag item completed: update coordinates
  const handleDragEnd = (id: string, e: any) => {
    const node = e.target;
    const updated = items.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          x: node.x(),
          y: node.y(),
        };
      }
      return item;
    });
    onTrackAction(); // Snapshot state for UNDO
    onChangeItems(updated);
  };

  // Transform ended (rotate or resize scale): update attributes
  const handleTransformEnd = (id: string, e: any) => {
    const node = e.target;
    const updated = items.map((item) => {
      if (item.id === id) {
        // Calculate new logical scale
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);

        return {
          ...item,
          x: node.x(),
          y: node.y(),
          width: Math.max(20, item.width * scaleX),
          height: Math.max(20, item.height * scaleY),
          rotation: node.rotation(),
        };
      }
      return item;
    });
    onTrackAction(); // Snapshot store for UNDO
    onChangeItems(updated);
  };

  // Trigger delete on selected element
  const handleDeleteSelected = () => {
    if (!selectedId) return;
    onTrackAction();
    onChangeItems(items.filter((item) => item.id !== selectedId));
    onSelectId(null);
  };

  // Clear rotation completely
  const handleResetRotation = () => {
    if (!selectedId) return;
    const updated = items.map((item) => {
      if (item.id === selectedId) {
        return { ...item, rotation: 0 };
      }
      return item;
    });
    onTrackAction();
    onChangeItems(updated);
  };

  // Calculate dynamic scale relative to logical coordinates (500x500)
  const scaleX = canvasSize.width / LOGICAL_WIDTH;
  const scaleY = canvasSize.height / LOGICAL_HEIGHT;

  return (
    <div id="canvas-container-root" className="w-full flex flex-col items-center">
      {/* Canvas bounding card */}
      <div 
        ref={containerRef} 
        id="konva-container" 
        className="w-full aspect-square bg-[#ecebeb] rounded-xl overflow-hidden relative shadow-inner border border-[#ddd]"
      >
        <Stage
          ref={stageRef}
          width={canvasSize.width}
          height={canvasSize.height}
          onClick={handleStageClick}
          onTap={handleStageClick}
          scaleX={scaleX}
          scaleY={scaleY}
        >
          <Layer>
            {/* Background User Image Layer */}
            {bgImage && (
              <KonvaImage
                name="background-img"
                image={bgImage}
                x={0}
                y={0}
                width={LOGICAL_WIDTH}
                height={LOGICAL_HEIGHT}
                onTap={handleStageClick}
                onClick={handleStageClick}
              />
            )}

            {/* Custom stickers & annotations loop */}
            {items.map((item) => {
              if (item.type === "sticker") {
                return (
                  <CustomKonvaImage
                    key={item.id}
                    item={item}
                    isSelected={item.id === selectedId}
                    onClick={(e) => handleItemSelect(item.id, e)}
                    onDragEnd={(e) => handleDragEnd(item.id, e)}
                    onTransformEnd={(e) => handleTransformEnd(item.id, e)}
                  />
                );
              }

              // Text Layer
              if (item.type === "text") {
                return (
                  <KonvaText
                    key={item.id}
                    id={item.id}
                    text={item.text || ""}
                    x={item.x}
                    y={item.y}
                    fontSize={24}
                    fill={item.color || "#d4222b"}
                    fontFamily={item.fontFamily || "'STKaiti', 'Kaiti', serif"}
                    fontWeight="bold"
                    align="center"
                    draggable
                    offsetX={50} // approximate center offset
                    offsetY={12}
                    onClick={(e) => handleItemSelect(item.id, e)}
                    onTap={(e) => handleItemSelect(item.id, e)}
                    onDragEnd={(e) => handleDragEnd(item.id, e)}
                    onTransformEnd={(e) => handleTransformEnd(item.id, e)}
                  />
                );
              }

              return null;
            })}

            {/* Transformer Overlay for active selection */}
            <Transformer
              ref={transformerRef}
              boundBoxFunc={(oldBox, newBox) => {
                // limit minimum sizing
                if (Math.abs(newBox.width) < 15 || Math.abs(newBox.height) < 15) {
                  return oldBox;
                }
                return newBox;
              }}
              anchorStroke="#d4222b"
              anchorFill="#ffffff"
              anchorSize={8}
              borderStroke="#d4222b"
              borderStrokeWidth={1}
              borderDash={[3, 3]}
            />
          </Layer>
        </Stage>

        {/* Dynamic empty helper guides */}
        {!bgImage && (
          <div className="absolute inset-0 flex flex-col justify-center items-center gap-2 bg-[#eae9e6] text-[#8a8a8a] text-center p-6">
            <span className="text-sm font-serif">请返回首页并上传办公室照片</span>
          </div>
        )}
      </div>

      {/* Selector Floating Control Handles */}
      {selectedId && (
        <div 
          id="item-floating-controls" 
          className="flex items-center gap-3 mt-3 w-full max-w-[320px] bg-[#2a2830] text-white px-4 py-2 rounded-full justify-between shadow-lg text-xs animate-fade-in"
        >
          <span className="text-gray-300 truncate max-w-[120px]">
            已选元素: {items.find(i => i.id === selectedId)?.type === "text" ? "自定义文字" : items.find(i => i.id === selectedId)?.stickerType || "贴纸"}
          </span>
          
          <div className="flex items-center gap-2">
            <button
              id="reset-rotate-btn"
              onClick={handleResetRotation}
              className="p-1 px-2.5 bg-gray-700 rounded-full hover:bg-gray-600 active:scale-95 transition-all text-gray-200 flex items-center gap-1"
              title="重置旋转"
            >
              <RotateCcw size={13} />
              <span>正角</span>
            </button>
            
            <button
              id="delete-selected-btn"
              onClick={handleDeleteSelected}
              className="p-1 px-3 bg-red-600 rounded-full hover:bg-red-500 active:scale-95 transition-all flex items-center gap-1 font-semibold"
              title="删除元素"
            >
              <Trash2 size={13} />
              <span>删除</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
