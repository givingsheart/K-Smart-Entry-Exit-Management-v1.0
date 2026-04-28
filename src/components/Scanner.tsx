import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, Scan, LogIn, LogOut, Image as ImageIcon, X } from 'lucide-react';
import { recognizeLicensePlate } from '../services/geminiService';
import { compressImage } from '../lib/imageUtils';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  onScan: (plateNumber: string, type: 'entry' | 'exit') => void;
  isProcessing: boolean;
  apiKey?: string;
  isTestMode?: boolean;
  onClose?: () => void;
}

export default function Scanner({ onScan, isProcessing, apiKey, isTestMode, onClose }: Props) {
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [zoom, setZoom] = useState(1);
  const [maxZoom, setMaxZoom] = useState(1);
  const [hasZoomSupport, setHasZoomSupport] = useState(false);

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [recognizedPlate, setRecognizedPlate] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Initialize camera and check for zoom capabilities
  const handleUserMedia = useCallback((stream: MediaStream) => {
    const track = stream.getVideoTracks()[0];
    if (track) {
      const capabilities = (track as any).getCapabilities?.() || {};
      if (capabilities.zoom) {
        setHasZoomSupport(true);
        setMaxZoom(capabilities.zoom.max || 1);
        setZoom(capabilities.zoom.min || 1);
      }
    }
  }, []);

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setZoom(value);
    if (webcamRef.current) {
      const track = (webcamRef.current.video?.srcObject as MediaStream)?.getVideoTracks()[0];
      if (track) {
        (track as any).applyConstraints({
          advanced: [{ zoom: value }]
        }).catch((err: any) => console.error("Zoom apply error:", err));
      }
    }
  };

  const processImage = async (imageSrc: string) => {
    setIsAnalyzing(true);
    try {
      // 네이티브 카메라 대응을 위해 해상도 최적화 (1200px)
      const compressed = await compressImage(imageSrc, 1200, 0.7);
      setCapturedImage(compressed);
      
      let plate: string | null = null;

      if (isTestMode) {
        await new Promise(resolve => setTimeout(resolve, 800));
        const mockPlates = ["123가4567", "54다3315", "258소8924", "117나5418"];
        plate = mockPlates[Math.floor(Math.random() * mockPlates.length)];
      } else {
        plate = await recognizeLicensePlate(compressed, apiKey);
      }

      if (plate) {
        setRecognizedPlate(plate);
      } else {
        alert("번호판을 인식하지 못했습니다. 번호판이 정중앙에 크게 보이도록 다시 촬영해 주세요.");
        setCapturedImage(null);
      }
    } catch (error: any) {
      console.error("Analysis Error:", error);
      alert(`분석 중 오류가 발생했습니다: ${error.message || "알 수 없는 오류"}`);
      setCapturedImage(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const capture = useCallback(async () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;
    await processImage(imageSrc);
  }, [apiKey]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      processImage(base64);
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset
  };

  const handleConfirm = (type: 'entry' | 'exit') => {
    if (recognizedPlate) {
      onScan(recognizedPlate, type);
      setCapturedImage(null);
      setRecognizedPlate(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col h-[100dvh] overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 inset-x-0 z-30 p-4 pt-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        <button 
          onClick={onClose} 
          className="p-2 bg-white/10 rounded-full backdrop-blur-md hover:bg-white/20 transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>
        <div className="flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
          <div className={`w-2 h-2 rounded-full animate-pulse ${isTestMode ? 'bg-amber-500' : 'bg-green-500'}`} />
          <span className="text-white text-[10px] font-bold uppercase tracking-widest">
            {isTestMode ? "Test Mode" : "AI Live Scan v2"}
          </span>
        </div>
      </div>

      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {!capturedImage ? (
          <>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              screenshotQuality={1}
              mirrored={false}
              disablePictureInPicture={true}
              forceScreenshotSourceSize={false}
              imageSmoothing={true}
              onUserMedia={handleUserMedia}
              onUserMediaError={() => {}}
              videoConstraints={{
                facingMode: "environment",
                width: { ideal: 1920 },
                height: { ideal: 1080 }
              }}
              className="w-full h-full object-cover"
            />

            {/* Zoom Slider Overlay */}
            {hasZoomSupport && maxZoom > 1 && (
              <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 py-6 px-3 bg-black/40 backdrop-blur-md rounded-full border border-white/10 z-20">
                <span className="text-[10px] text-white font-bold opacity-60">Zoom</span>
                <input
                  type="range"
                  min="1"
                  max={maxZoom}
                  step="0.1"
                  value={zoom}
                  onChange={handleZoomChange}
                  className="h-40 accent-blue-500 [appearance:slider-vertical] cursor-pointer"
                  style={{ transform: 'rotate(180deg)' }}
                />
                <span className="text-[10px] text-white font-mono font-bold bg-blue-600 px-2 py-1 rounded-md">{zoom.toFixed(1)}x</span>
              </div>
            )}
            
            {/* 가이드 오버레이 (심미적 용도 + 추천 영역) */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              <motion.div 
                animate={{ scale: 1 + (zoom - 1) * 0.05 }}
                className="w-4/5 h-[35%] border-2 border-white/30 rounded-3xl relative"
              >
                <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-blue-500" />
                <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-blue-500" />
                <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-blue-500" />
                <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-blue-500" />
                
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center">
                   <Scan className="w-12 h-12 text-white/20" />
                </div>
              </motion.div>
              <p className="mt-6 text-white/40 text-xs font-bold uppercase tracking-widest bg-black/40 px-4 py-2 rounded-full backdrop-blur-md border border-white/5">
                번호판을 중앙에 맞춰주세요
              </p>
            </div>
          </>
        ) : (
          <div className="w-full h-full relative bg-zinc-950 flex items-center justify-center">
            <img src={capturedImage} className="max-w-full max-h-full object-contain" alt="Captured" />
          </div>
        )}

        {/* Loading Overlay */}
        <AnimatePresence>
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center z-20"
            >
              <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              <p className="text-white text-xl font-black tracking-tight">차량 번호 분석 중...</p>
              <p className="text-blue-400/60 text-xs font-bold mt-2 uppercase tracking-widest font-mono">HDC AI Optimized</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results UI */}
        <AnimatePresence>
          {!isAnalyzing && recognizedPlate && (
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute inset-x-0 bottom-0 bg-zinc-900 border-t border-white/10 rounded-t-[3rem] p-8 pb-12 z-20 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
            >
              <div className="max-w-md mx-auto">
                <div className="text-center mb-8">
                  <p className="text-zinc-500 font-bold uppercase tracking-tighter text-xs mb-2">인식된 번호판</p>
                  <h3 className="text-6xl font-black text-white tracking-tighter tabular-nums">
                    {recognizedPlate}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleConfirm('entry')}
                    className="flex flex-col items-center gap-3 bg-blue-600 hover:bg-blue-500 p-8 rounded-[2.5rem] shadow-xl active:scale-95 transition-all text-white border border-blue-400/30"
                  >
                    <LogIn className="w-10 h-10" />
                    <span className="text-xl font-black">입차 처리</span>
                  </button>
                  <button
                    onClick={() => handleConfirm('exit')}
                    className="flex flex-col items-center gap-3 bg-zinc-800 hover:bg-zinc-700 p-8 rounded-[2.5rem] shadow-xl active:scale-95 transition-all text-white border border-white/5"
                  >
                    <LogOut className="w-10 h-10" />
                    <span className="text-xl font-black">출차 처리</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    setCapturedImage(null);
                    setRecognizedPlate(null);
                  }}
                  className="w-full mt-6 py-4 text-zinc-500 font-bold hover:text-white transition-colors"
                >
                  취소하고 다시 촬영
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Controls (Fixed at bottom) */}
      {!recognizedPlate && !isAnalyzing && (
        <div className="bg-zinc-950 p-6 pb-SAFE flex items-center justify-evenly border-t border-white/5 z-30">
          <style>{`
            .pb-SAFE {
              padding-bottom: calc(1.5rem + env(safe-area-inset-bottom));
            }
          `}</style>
          {/* Native Camera Trigger */}
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-active:scale-90 transition-transform">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">고성능 촬영</span>
          </button>

          {/* Quick AI Capture */}
          <button
            onClick={capture}
            className="relative active:scale-90 transition-transform"
          >
            <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.4)]">
               <div className="w-20 h-20 border-4 border-white/20 rounded-full flex items-center justify-center">
                 <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                    <Scan className="w-10 h-10 text-blue-600" />
                 </div>
               </div>
            </div>
            <div className="absolute -top-1 -right-1 bg-white text-blue-600 text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-blue-600">AI</div>
          </button>

          {/* Gallery Pick */}
          <button 
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.removeAttribute('capture');
                fileInputRef.current.click();
                fileInputRef.current.setAttribute('capture', 'environment');
              }
            }}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-active:scale-90 transition-transform">
              <ImageIcon className="w-6 h-6 text-white" />
            </div>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">갤러리</span>
          </button>
        </div>
      )}

      {/* Hidden File Input (Native Camera) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileUpload}
      />
    </div>
  );
}
