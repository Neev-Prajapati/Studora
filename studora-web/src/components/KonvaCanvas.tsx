"use client";

import React, { useEffect, useRef, useState, useLayoutEffect } from "react";
import { getWhiteboard, saveWhiteboard, clearWhiteboard } from "@/actions/whiteboard";
import { Eraser, PenTool, Trash2, Loader2, Square, Circle as CircleIcon, Triangle, Diamond, Type, Undo2, Redo2, ChevronDown, Shapes, Minus, ArrowRight, ArrowLeft, ArrowLeftRight, Hand, MousePointer2 } from "lucide-react";

import { Stage, Layer, Rect, Circle, Ellipse, Line, Arrow, Text, Image as KonvaImage, Transformer } from 'react-konva';

const generateId = () => Math.random().toString(36).substring(2, 9);

type ToolType = 'select' | 'pen' | 'eraser' | 'rectangle' | 'circle' | 'triangle' | 'diamond' | 'line' | 'dotted-line' | 'arrow-right' | 'arrow-left' | 'arrow-both' | 'text' | 'pan';

export interface Element {
  id: string;
  type: ToolType;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  points?: number[];
  color: string;
  lineWidth: number;
  text?: string;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
}

export default function KonvaCanvas({ fileUrl }: { fileUrl: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);
  const trRef = useRef<any>(null);
  
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [elements, setElements] = useState<Element[]>([]);
  const [history, setHistory] = useState<Element[][]>([[]]);
  const [historyStep, setHistoryStep] = useState(0);
  
  const [tool, setTool] = useState<ToolType>('pen');
  const [color, setColor] = useState("#ffffff");
  const [lineWidth, setLineWidth] = useState(3);
  const [scale, setScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  
  const [isShapesOpen, setIsShapesOpen] = useState(false);
  const [isLinesOpen, setIsLinesOpen] = useState(false);
  const [isColorsOpen, setIsColorsOpen] = useState(false);
  
  const [textInput, setTextInput] = useState({ visible: false, x: 0, y: 0, unscaledX: 0, unscaledY: 0, text: "" });
  const textInputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (textInput.visible && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [textInput.visible]);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      setDimensions({ width: entries[0].contentRect.width, height: entries[0].contentRect.height });
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);
  
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const res = await getWhiteboard(fileUrl);
        if (res.success && res.canvasData) {
          if (res.canvasData.startsWith('{')) {
             const parsed = JSON.parse(res.canvasData);
             setElements(parsed.elements || []);
             setHistory([parsed.elements || []]);
          } else {
            const img = new window.Image();
            img.onload = () => {
              setBgImage(img);
            };
            img.src = res.canvasData;
          }
        }
      } catch (err) {
        console.error("Failed to load whiteboard", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, [fileUrl]);
  
  useEffect(() => {
    if (selectedId && trRef.current && stageRef.current) {
       const node = stageRef.current.findOne('#' + selectedId);
       if (node) {
         trRef.current.nodes([node]);
         trRef.current.getLayer().batchDraw();
       }
    } else if (trRef.current) {
       trRef.current.nodes([]);
       trRef.current.getLayer().batchDraw();
    }
  }, [selectedId, elements]);

  const triggerSave = (newElements: Element[]) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setIsSaving(true);
    saveTimeoutRef.current = setTimeout(async () => {
      const payload = JSON.stringify({ version: 2, elements: newElements });
      await saveWhiteboard(fileUrl, payload);
      setIsSaving(false);
    }, 1500); 
  };

  const commitHistory = (newElements: Element[]) => {
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(newElements);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
    triggerSave(newElements);
  };
  
  const undo = () => {
    if (historyStep <= 0) return; 
    const newStep = historyStep - 1;
    setElements(history[newStep]);
    setHistoryStep(newStep);
    triggerSave(history[newStep]);
  };

  const redo = () => {
    if (historyStep >= history.length - 1) return;
    const newStep = historyStep + 1;
    setElements(history[newStep]);
    setHistoryStep(newStep);
    triggerSave(history[newStep]);
  };
  
  const handleClear = async () => {
    setElements([]);
    commitHistory([]);
    setSelectedId(null);
    setTextInput(prev => ({ ...prev, visible: false }));
    setIsSaving(true);
    await clearWhiteboard(fileUrl);
    setIsSaving(false);
  };
  
  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    
    if (e.evt.ctrlKey || e.evt.metaKey) {
      const oldScale = scale;
      const pointer = stage.getPointerPosition();
      const mousePointTo = {
        x: (pointer.x - stagePos.x) / oldScale,
        y: (pointer.y - stagePos.y) / oldScale,
      };
      const newScale = e.evt.deltaY > 0 ? oldScale * 0.9 : oldScale * 1.1;
      const clampedScale = Math.min(Math.max(0.1, newScale), 5);
      
      setScale(clampedScale);
      setStagePos({
        x: pointer.x - mousePointTo.x * clampedScale,
        y: pointer.y - mousePointTo.y * clampedScale,
      });
    } else {
      setStagePos({
        x: stagePos.x - e.evt.deltaX,
        y: stagePos.y - e.evt.deltaY,
      });
    }
  };
  
  const getPointerPos = () => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    return stage.getRelativePointerPosition() || { x: 0, y: 0 };
  };
  
  const handleMouseDown = (e: any) => {
    if (tool === 'pan') return;
    
    const clickedOnEmpty = e.target === e.target.getStage() || e.target.hasName('bg-image');
    if (clickedOnEmpty) {
      setSelectedId(null);
    }
    
    if (tool === 'select') return;
    
    if (tool === 'text') {
      const pos = getPointerPos();
      if (textInput.visible) {
        finalizeText();
      } else {
        const stagePos = e.target.getStage().getPointerPosition();
        setTextInput({ visible: true, x: stagePos.x, y: stagePos.y, unscaledX: pos.x, unscaledY: pos.y, text: "" });
      }
      return;
    }
    
    if (textInput.visible) {
      finalizeText();
    }
    
    setIsDrawing(true);
    const pos = getPointerPos();
    const newEl: Element = {
      id: generateId(),
      type: tool,
      x: pos.x,
      y: pos.y,
      width: 0,
      height: 0,
      color,
      lineWidth,
      points: [0, 0]
    };
    
    setElements([...elements, newEl]);
  };
  
  const handleMouseMove = (e: any) => {
    if (!isDrawing) return;
    
    const pos = getPointerPos();
    setElements((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      const rest = prev.slice(0, -1);
      
      if (last.type === 'pen' || last.type === 'eraser') {
        const newPoints = last.points!.concat([pos.x - last.x!, pos.y - last.y!]);
        return [...rest, { ...last, points: newPoints }];
      } else if (last.type === 'rectangle') {
        return [...rest, { ...last, width: pos.x - last.x!, height: pos.y - last.y! }];
      } else if (last.type === 'circle') {
        return [...rest, { ...last, width: pos.x - last.x!, height: pos.y - last.y! }];
      } else if (['line', 'dotted-line', 'arrow-right', 'arrow-left', 'arrow-both'].includes(last.type)) {
        return [...rest, { ...last, points: [0, 0, pos.x - last.x!, pos.y - last.y!] }];
      } else if (last.type === 'triangle') {
        const w = pos.x - last.x!;
        const h = pos.y - last.y!;
        return [...rest, { ...last, width: w, height: h, points: [w/2, 0, w, h, 0, h] }];
      } else if (last.type === 'diamond') {
        const w = pos.x - last.x!;
        const h = pos.y - last.y!;
        return [...rest, { ...last, width: w, height: h, points: [w/2, 0, w, h/2, w/2, h, 0, h/2] }];
      }
      return prev;
    });
  };
  
  const handleMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      commitHistory(elements);
    }
  };
  
  const updateElement = (id: string, attrs: any) => {
    const newElements = elements.map(el => el.id === id ? { ...el, ...attrs } : el);
    setElements(newElements);
    commitHistory(newElements);
  };
  
  const finalizeText = () => {
    if (textInput.visible && textInput.text.trim()) {
      const newEl: Element = {
         id: generateId(),
         type: 'text',
         x: textInput.unscaledX,
         y: textInput.unscaledY,
         text: textInput.text,
         color,
         lineWidth
      };
      setElements([...elements, newEl]);
      commitHistory([...elements, newEl]);
    }
    setTextInput({ visible: false, x: 0, y: 0, unscaledX: 0, unscaledY: 0, text: "" });
  };
  
  const colors = [
    { label: "White", value: "#ffffff" },
    { label: "Red", value: "#ff4d4f" },
    { label: "Orange", value: "#ffa940" },
    { label: "Yellow", value: "#fadb14" },
    { label: "Green", value: "#52c41a" },
    { label: "Cyan", value: "#13c2c2" },
    { label: "Blue", value: "#1890ff" },
    { label: "Purple", value: "#722ed1" },
    { label: "Pink", value: "#eb2f96" },
    { label: "Gray", value: "#8c8c8c" },
  ];
  
  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] rounded-xl overflow-hidden relative" onClick={() => { setIsShapesOpen(false); setIsLinesOpen(false); setIsColorsOpen(false); }}>
      {/* Ultra Compact Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 p-1.5 border-b border-white/5 bg-gradient-to-r from-black/40 to-black/20 shadow-sm z-50">
        <div className="flex flex-wrap items-center gap-1.5">
          
          <div className="flex items-center p-0.5 bg-black/40 border border-white/10 rounded-lg shadow-inner backdrop-blur-md">
              <button onClick={undo} disabled={historyStep <= 0} className={`p-1.5 rounded-md transition-all ${historyStep > 0 ? "text-white/70 hover:text-white hover:bg-white/10 active:scale-95" : "text-white/20 cursor-not-allowed"}`} title="Undo"><Undo2 className="w-3.5 h-3.5" /></button>
              <button onClick={redo} disabled={historyStep >= history.length - 1} className={`p-1.5 rounded-md transition-all ${historyStep < history.length - 1 ? "text-white/70 hover:text-white hover:bg-white/10 active:scale-95" : "text-white/20 cursor-not-allowed"}`} title="Redo"><Redo2 className="w-3.5 h-3.5" /></button>
          </div>

          <div className="relative">
              <button onClick={(e) => { e.stopPropagation(); setIsColorsOpen(!isColorsOpen); setIsShapesOpen(false); setIsLinesOpen(false); }} className="flex items-center gap-1.5 p-1 bg-black/40 border border-white/10 rounded-lg shadow-inner backdrop-blur-md transition-all hover:bg-white/10 active:scale-95" title="Colors">
                <div className="w-5 h-5 rounded-full ring-1 ring-white/20" style={{ backgroundColor: color }} />
                <ChevronDown className="w-3 h-3 text-white/70" />
              </button>
              {isColorsOpen && (
                <div className="absolute top-[calc(100%+8px)] left-0 bg-[#1e1e1e] border border-white/10 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100 w-[140px]">
                  <div className="grid grid-cols-5 gap-2">
                    {colors.map((c) => (
                      <button key={c.value} onClick={(e) => { e.stopPropagation(); setColor(c.value); if(tool === 'eraser') setTool('pen'); setIsColorsOpen(false); }} className={`w-5 h-5 rounded-full transition-all duration-200 ${color === c.value && tool !== 'eraser' ? "scale-110 ring-2 ring-primary ring-offset-2 ring-offset-[#1e1e1e] shadow-md" : "opacity-80 hover:opacity-100 hover:scale-110"}`} style={{ backgroundColor: c.value }} title={c.label} />
                    ))}
                  </div>
                </div>
              )}
          </div>

          <div className="flex items-center gap-0.5 p-0.5 bg-black/40 border border-white/10 rounded-lg shadow-inner backdrop-blur-md">
            <button onClick={() => {setTool('select'); setSelectedId(null);}} className={`p-1.5 rounded-md transition-all ${tool === 'select' ? "bg-primary text-primary-foreground shadow-md" : "text-white/70 hover:text-white hover:bg-white/10 active:scale-95"}`} title="Select & Move"><MousePointer2 className="w-4 h-4" /></button>
            <button onClick={() => setTool('pan')} className={`p-1.5 rounded-md transition-all ${tool === 'pan' ? "bg-primary text-primary-foreground shadow-md" : "text-white/70 hover:text-white hover:bg-white/10 active:scale-95"}`} title="Pan Canvas"><Hand className="w-4 h-4" /></button>
            <button onClick={() => setTool('pen')} className={`p-1.5 rounded-md transition-all ${tool === 'pen' ? "bg-primary text-primary-foreground shadow-md" : "text-white/70 hover:text-white hover:bg-white/10 active:scale-95"}`} title="Pen"><PenTool className="w-4 h-4" /></button>
            <button onClick={() => setTool('eraser')} className={`p-1.5 rounded-md transition-all ${tool === 'eraser' ? "bg-primary text-primary-foreground shadow-md" : "text-white/70 hover:text-white hover:bg-white/10 active:scale-95"}`} title="Eraser"><Eraser className="w-4 h-4" /></button>
            <button onClick={() => setTool('text')} className={`p-1.5 rounded-md transition-all ${tool === 'text' ? "bg-primary text-primary-foreground shadow-md" : "text-white/70 hover:text-white hover:bg-white/10 active:scale-95"}`} title="Text"><Type className="w-4 h-4" /></button>
          </div>
          
          <div className="flex items-center gap-0.5 p-0.5 bg-black/40 border border-white/10 rounded-lg shadow-inner backdrop-blur-md">
              <div className="relative">
                <button onClick={(e) => { e.stopPropagation(); setIsShapesOpen(!isShapesOpen); setIsLinesOpen(false); setIsColorsOpen(false); }} className={`p-1.5 flex items-center gap-1 rounded-md transition-all ${['rectangle', 'circle', 'triangle', 'diamond'].includes(tool) ? "bg-primary text-primary-foreground shadow-md" : "text-white/70 hover:text-white hover:bg-white/10 active:scale-95"}`} title="Shapes">
                  {tool === 'rectangle' ? <Square className="w-4 h-4" /> : tool === 'circle' ? <CircleIcon className="w-4 h-4" /> : tool === 'triangle' ? <Triangle className="w-4 h-4" /> : tool === 'diamond' ? <Diamond className="w-4 h-4" /> : <Shapes className="w-4 h-4" />}
                  <ChevronDown className="w-3 h-3 opacity-70" />
                </button>
                {isShapesOpen && (
                  <div className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 bg-[#1e1e1e] border border-white/10 rounded-xl shadow-2xl flex flex-col p-1.5 z-50 min-w-[140px] animate-in fade-in zoom-in-95 duration-100">
                    <button onClick={(e) => { e.stopPropagation(); setTool('rectangle'); setIsShapesOpen(false); }} className="flex items-center gap-3 p-2 hover:bg-white/10 rounded-lg text-sm text-white/90"><Square className="w-4 h-4 text-primary" /> Rectangle</button>
                    <button onClick={(e) => { e.stopPropagation(); setTool('circle'); setIsShapesOpen(false); }} className="flex items-center gap-3 p-2 hover:bg-white/10 rounded-lg text-sm text-white/90"><CircleIcon className="w-4 h-4 text-primary" /> Circle</button>
                    <button onClick={(e) => { e.stopPropagation(); setTool('triangle'); setIsShapesOpen(false); }} className="flex items-center gap-3 p-2 hover:bg-white/10 rounded-lg text-sm text-white/90"><Triangle className="w-4 h-4 text-primary" /> Triangle</button>
                    <button onClick={(e) => { e.stopPropagation(); setTool('diamond'); setIsShapesOpen(false); }} className="flex items-center gap-3 p-2 hover:bg-white/10 rounded-lg text-sm text-white/90"><Diamond className="w-4 h-4 text-primary" /> Diamond</button>
                  </div>
                )}
              </div>
              <div className="relative">
                <button onClick={(e) => { e.stopPropagation(); setIsLinesOpen(!isLinesOpen); setIsShapesOpen(false); setIsColorsOpen(false); }} className={`p-1.5 flex items-center gap-1 rounded-md transition-all ${['line', 'dotted-line', 'arrow-right', 'arrow-left', 'arrow-both'].includes(tool) ? "bg-primary text-primary-foreground shadow-md" : "text-white/70 hover:text-white hover:bg-white/10 active:scale-95"}`} title="Lines & Arrows">
                  {tool === 'line' ? <Minus className="w-4 h-4" /> : tool === 'dotted-line' ? <Minus className="w-4 h-4" style={{ strokeDasharray: '4 4' }} /> : tool === 'arrow-right' ? <ArrowRight className="w-4 h-4" /> : tool === 'arrow-left' ? <ArrowLeft className="w-4 h-4" /> : tool === 'arrow-both' ? <ArrowLeftRight className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                  <ChevronDown className="w-3 h-3 opacity-70" />
                </button>
                {isLinesOpen && (
                  <div className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 bg-[#1e1e1e] border border-white/10 rounded-xl shadow-2xl flex flex-col p-1.5 z-50 min-w-[160px] animate-in fade-in zoom-in-95 duration-100">
                    <button onClick={(e) => { e.stopPropagation(); setTool('line'); setIsLinesOpen(false); }} className="flex items-center gap-3 p-2 hover:bg-white/10 rounded-lg text-sm text-white/90"><Minus className="w-4 h-4 text-primary" /> Straight Line</button>
                    <button onClick={(e) => { e.stopPropagation(); setTool('dotted-line'); setIsLinesOpen(false); }} className="flex items-center gap-3 p-2 hover:bg-white/10 rounded-lg text-sm text-white/90"><Minus className="w-4 h-4 text-primary" style={{ strokeDasharray: '4 4' }} /> Dotted Line</button>
                    <button onClick={(e) => { e.stopPropagation(); setTool('arrow-right'); setIsLinesOpen(false); }} className="flex items-center gap-3 p-2 hover:bg-white/10 rounded-lg text-sm text-white/90"><ArrowRight className="w-4 h-4 text-primary" /> Arrow Right</button>
                    <button onClick={(e) => { e.stopPropagation(); setTool('arrow-left'); setIsLinesOpen(false); }} className="flex items-center gap-3 p-2 hover:bg-white/10 rounded-lg text-sm text-white/90"><ArrowLeft className="w-4 h-4 text-primary" /> Arrow Left</button>
                    <button onClick={(e) => { e.stopPropagation(); setTool('arrow-both'); setIsLinesOpen(false); }} className="flex items-center gap-3 p-2 hover:bg-white/10 rounded-lg text-sm text-white/90"><ArrowLeftRight className="w-4 h-4 text-primary" /> Double Arrow</button>
                  </div>
                )}
              </div>
          </div>
          
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-black/40 border border-white/10 rounded-lg shadow-inner backdrop-blur-md h-[28px]">
            <div className="w-1 h-1 rounded-full bg-white/40" />
            <input type="range" min="1" max="10" value={lineWidth} onChange={(e) => setLineWidth(Number(e.target.value))} className="w-16 accent-primary cursor-pointer" title="Stroke/Font Size" />
            <div className="w-2 h-2 rounded-full bg-white/40" />
          </div>
        </div>
        
        <div className="flex items-center gap-2 pr-1">
          {isSaving && <div className="flex items-center gap-1.5 text-primary/80 text-[11px] font-medium whitespace-nowrap"><Loader2 className="w-3 h-3 animate-spin" /> Saving...</div>}
          <button onClick={() => setScale(1)} className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-white/70 hover:text-white bg-black/20 hover:bg-white/10 border border-white/5 rounded-lg transition-all active:scale-95" title="Reset Zoom">{Math.round(scale * 100)}%</button>
          <button onClick={handleClear} className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium text-white/60 hover:text-red-400 bg-black/20 hover:bg-red-500/10 border border-white/5 hover:border-red-500/30 rounded-lg transition-all active:scale-95" title="Clear Board"><Trash2 className="w-3.5 h-3.5" /> Clear</button>
        </div>
      </div>
      
      <div ref={containerRef} className="flex-1 relative overflow-hidden" style={{ cursor: tool === 'text' ? 'text' : tool === 'pan' ? 'grab' : 'crosshair' }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10 pointer-events-none">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}
        
        {dimensions.width > 0 && (
          <Stage
            ref={stageRef}
            width={dimensions.width}
            height={dimensions.height}
            x={stagePos.x}
            y={stagePos.y}
            scaleX={scale}
            scaleY={scale}
            draggable={tool === 'pan'}
            onDragEnd={(e: any) => {
              if (e.target === e.target.getStage()) {
                setStagePos({ x: e.target.x(), y: e.target.y() });
              }
            }}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
          >
            <Layer>
              {bgImage && (
                <KonvaImage 
                  name="bg-image"
                  image={bgImage} 
                  x={bgImage.width < 4000 ? (4000 - bgImage.width)/2 : 0} 
                  y={bgImage.height < 4000 ? (4000 - bgImage.height)/2 : 0} 
                />
              )}
              
              {elements.map(el => {
                 const commonProps = {
                    id: el.id,
                    x: el.x,
                    y: el.y,
                    rotation: el.rotation || 0,
                    scaleX: el.scaleX || 1,
                    scaleY: el.scaleY || 1,
                    draggable: tool === 'select',
                    onClick: () => { if (tool === 'select') setSelectedId(el.id); },
                    onTap: () => { if (tool === 'select') setSelectedId(el.id); },
                    onDragEnd: (e: any) => updateElement(el.id, { x: e.target.x(), y: e.target.y() }),
                    onTransformEnd: (e: any) => {
                       const node = e.target;
                       updateElement(el.id, {
                          x: node.x(),
                          y: node.y(),
                          scaleX: node.scaleX(),
                          scaleY: node.scaleY(),
                          rotation: node.rotation(),
                       });
                    }
                 };
                 
                 if (el.type === 'rectangle') {
                    return <Rect key={el.id} {...commonProps} width={el.width} height={el.height} stroke={el.color} strokeWidth={el.lineWidth} />;
                 }
                 if (el.type === 'circle') {
                    const rx = (el.width || 0) / 2;
                    const ry = (el.height || 0) / 2;
                    return <Ellipse key={el.id} {...commonProps} radiusX={Math.abs(rx)} radiusY={Math.abs(ry)} offsetX={-rx} offsetY={-ry} stroke={el.color} strokeWidth={el.lineWidth} />;
                 }
                 if (el.type === 'pen' || el.type === 'eraser') {
                    return <Line key={el.id} {...commonProps} points={el.points} stroke={el.color} strokeWidth={el.type === 'eraser' ? el.lineWidth * 3 : el.lineWidth} tension={0.5} lineCap="round" lineJoin="round" globalCompositeOperation={el.type === 'eraser' ? 'destination-out' : 'source-over'} />;
                 }
                 if (['line', 'dotted-line'].includes(el.type)) {
                    return <Line key={el.id} {...commonProps} points={el.points} stroke={el.color} strokeWidth={el.lineWidth} dash={el.type === 'dotted-line' ? [el.lineWidth * 3, el.lineWidth * 3] : undefined} />;
                 }
                 if (['arrow-right', 'arrow-left', 'arrow-both'].includes(el.type)) {
                    // Konva Arrow supports pointer at the end. For both, we might need a custom shape or two arrows. Let's use Line for now for simplicity, or Arrow.
                    // To keep it perfectly matching our old logic, Arrow supports `pointerAtBeginning`.
                    return <Arrow key={el.id} {...commonProps} points={el.points} stroke={el.color} fill={el.color} strokeWidth={el.lineWidth} pointerLength={el.lineWidth * 4} pointerWidth={el.lineWidth * 4} pointerAtBeginning={el.type === 'arrow-left' || el.type === 'arrow-both'} pointerAtEnding={el.type === 'arrow-right' || el.type === 'arrow-both'} />;
                 }
                 if (el.type === 'triangle' || el.type === 'diamond') {
                    return <Line key={el.id} {...commonProps} points={el.points} stroke={el.color} strokeWidth={el.lineWidth} closed />;
                 }
                 if (el.type === 'text') {
                    return <Text key={el.id} {...commonProps} text={el.text} fill={el.color} fontSize={el.lineWidth * 6} fontFamily="sans-serif" />;
                 }
                 return null;
              })}
              
              <Transformer 
                ref={trRef} 
                boundBoxFunc={(oldBox, newBox) => {
                  if (newBox.width < 5 || newBox.height < 5) return oldBox;
                  return newBox;
                }}
              />
            </Layer>
          </Stage>
        )}
        
        {textInput.visible && (
          <div style={{ position: 'absolute', left: textInput.x, top: textInput.y, zIndex: 50, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <input ref={textInputRef} type="text" autoFocus value={textInput.text} placeholder="Type here & press Enter..." onChange={(e) => setTextInput({ ...textInput, text: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') finalizeText(); }} style={{ color: color, fontSize: `${lineWidth * 6}px`, background: 'rgba(0, 0, 0, 0.7)', border: '2px solid #1890ff', borderRadius: '6px', outline: 'none', padding: '8px 12px', minWidth: '250px' }} />
            <span className="text-xs text-white/70 bg-black/50 px-2 py-1 rounded w-fit">Press Enter to stamp</span>
          </div>
        )}
      </div>
    </div>
  );
}
