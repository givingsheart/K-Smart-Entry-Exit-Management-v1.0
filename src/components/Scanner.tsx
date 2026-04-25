/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, Scan, ShieldAlert, LogIn, LogOut, ImagePlus } from 'lucide-react';
import { recognizeLicensePlate } from '../services/geminiService';
import { compressImage } from '../lib/imageUtils';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  onScan: (plateNumber: string, type: 'entry' | 'exit') => void;
  isProcessing: boolean;
  apiKey?: string;
  isTestMode?: boolean;
}

export default function Scanner({ onScan, isProcessing, apiKey, isTestMode }: Props) {
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [recognizedPlate, setRecognizedPlate] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const processImage = async (imageSrc: string) => {
    setIsAnalyzing(true);
    try {
      // 이미지 압축 (Option 1)
      const compressed = await compressImage(imageSrc, 800, 0.7);
      setCapturedImage(compressed);
      
      let plate: string | null = null;

      if (isTestMode) {
        // Mock processing for test mode
        await new Promise(resolve => setTimeout(resolve, 2000));
        const mockPlates = ["123가4567", "54다3315", "258소8924", "117나5418"];
        plate = mockPlates[Math.floor(Math.random() * mockPlates.length)];
      } else {
        plate = await recognizeLicensePlate(compressed, apiKey);
      }

      if (plate) {
        setRecognizedPlate(plate);
      } else {
        alert("번호판을 인식하지 못했습니다. 다시 시도해 주세요.");
        setCapturedImage(null);
      }
    } catch (error: any) {
      console.error(error);
      if (error?.message?.includes("quota") || error?.message?.includes("429")) {
        alert("API 사용량 한도가 초과되었습니다. (무료 등급: 분당 15회)\n잠시 후 다시 시도하시거나 설정에서 '테스트 모드'를 켜주세요.");
      } else {
        alert("분석 중 오류가 발생했습니다.");
      }
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
  };

  const handleConfirm = (type: 'entry' | 'exit') => {
    if (recognizedPlate) {
      onScan(recognizedPlate, type);
      // Reset state for next scan
      setCapturedImage(null);
      setRecognizedPlate(null);
    }
  };

  const activeLoading = isProcessing || isAnalyzing;

  return (
    <div className="relative w-full max-w-2xl mx-auto overflow-hidden rounded-3xl border-4 border-white/10 bg-black shadow-2xl">
      {!capturedImage ? (
        <>
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            mirrored={false}
            screenshotQuality={1}
            forceScreenshotSourceSize={false}
            imageSmoothing={true}
            disablePictureInPicture={true}
            onUserMedia={() => {}}
            onUserMediaError={() => {}}
            videoConstraints={{
              facingMode: "environment",
              width: 1280,
              height: 720
            }}
            className="w-full h-auto aspect-video object-cover"
          />

          {/* Overlay decorations */}
          <div className="absolute inset-0 border-[20px] border-black/20 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-1/3 border-2 border-dashed border-blue-400/50 rounded-lg flex items-center justify-center">
              <div className="text-blue-400/30 font-bold text-center">
                <Scan className="w-12 h-12 mx-auto mb-2" />
                번호판을 사각형 안에 맞춰주세요
              </div>
            </div>
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={activeLoading}
              className="flex flex-col items-center justify-center w-24 h-24 rounded-full bg-zinc-800 text-white shadow-xl hover:bg-zinc-700 transition-all active:scale-90"
            >
              <ImagePlus className="w-8 h-8 mb-1" />
              <span className="text-[10px] font-bold">갤러리</span>
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />

            <button
              onClick={capture}
              disabled={activeLoading}
              className={`
                flex flex-col items-center justify-center w-32 h-32 rounded-full shadow-2xl transition-all active:scale-90
                ${activeLoading ? 'bg-gray-700 cursor-not-allowed' : 'bg-white hover:bg-gray-100'}
              `}
            >
              {activeLoading ? (
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Camera className="w-12 h-12 text-black mb-1" />
                  <span className="text-black font-bold text-lg">촬영</span>
                </>
              )}
            </button>
          </div>
        </>
      ) : (
        <div className="relative">
          <img src={capturedImage} className="w-full h-auto aspect-video object-cover" />
          
          <AnimatePresence>
            {!isAnalyzing && recognizedPlate && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center p-6 space-y-8"
              >
                <div className="text-center">
                  <p className="text-blue-400 font-bold uppercase tracking-widest text-sm mb-2">인식된 번호판</p>
                  <h3 className="text-6xl font-black text-white tracking-tighter drop-shadow-lg">
                    {recognizedPlate}
                  </h3>
                </div>

                <div className="w-full grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleConfirm('entry')}
                    className="flex flex-col items-center gap-3 bg-blue-600 hover:bg-blue-500 p-8 rounded-[2rem] shadow-2xl active:scale-95 transition-all text-white"
                  >
                    <LogIn className="w-10 h-10" />
                    <span className="text-2xl font-black">입차 처리</span>
                  </button>
                  <button
                    onClick={() => handleConfirm('exit')}
                    className="flex flex-col items-center gap-3 bg-zinc-800 hover:bg-zinc-700 p-8 rounded-[2rem] shadow-2xl active:scale-95 transition-all text-white"
                  >
                    <LogOut className="w-10 h-10" />
                    <span className="text-2xl font-black">출차 처리</span>
                  </button>
                  <button
                    onClick={() => {
                      setCapturedImage(null);
                      setRecognizedPlate(null);
                    }}
                    className="col-span-2 py-4 text-zinc-400 font-bold hover:text-white transition-colors text-lg"
                  >
                    [ 취소하고 다시 촬영 ]
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-10"
          >
            <div className="text-center">
              <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
              <p className="text-white text-2xl font-black italic tracking-tight">차량 번호 분석 중...</p>
              <p className="text-zinc-500 font-bold mt-2">잠시만 기다려 주세요 (HDC Labs)</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
