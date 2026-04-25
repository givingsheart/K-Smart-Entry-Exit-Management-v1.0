/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Plus, Trash2, Edit2, Camera, Save, Search } from 'lucide-react';
import { Reservation } from '../types';
import { extractReservationsFromImages } from '../services/geminiService';
import { compressImage } from '../lib/imageUtils';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  reservations: Reservation[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (reservations: Reservation[]) => void;
  apiKey?: string;
  isTestMode?: boolean;
}

export default function ReservationManager({ reservations, isOpen, onClose, onUpdate, apiKey, isTestMode }: Props) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newPlate, setNewPlate] = useState('');
  const [isAddingManual, setIsAddingManual] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    try {
      const base64Images: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        
        // 이미지 압축 (Option 1)
        const compressed = await compressImage(base64, 1200, 0.6);
        base64Images.push(compressed);
      }

      let extracted: Reservation[] = [];

      if (isTestMode) {
        // Mock processing
        await new Promise(resolve => setTimeout(resolve, 3000));
        extracted = [
          { id: `mock-${Date.now()}-1`, plateNumber: '11가1111', reservationTime: '10:00' },
          { id: `mock-${Date.now()}-2`, plateNumber: '22나2222', reservationTime: '11:00' },
        ];
      } else {
        extracted = await extractReservationsFromImages(base64Images, apiKey);
      }

      if (extracted.length > 0) {
        onUpdate([...reservations, ...extracted]);
        alert(`${extracted.length}개의 예약을 성공적으로 불러왔습니다.`);
      } else {
        alert("인식된 예약 정보가 없습니다.");
      }
    } catch (error: any) {
      console.error(error);
      if (error?.message?.includes("quota") || error?.message?.includes("429")) {
        alert("API 사용량 한도가 초과되었습니다. 잠시 후 다시 시도하시거나 '테스트 모드'를 켜주세요.");
      } else {
        alert("명단 추출 중 오류가 발생했습니다.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const removeReservation = (id: string) => {
    onUpdate(reservations.filter(r => r.id !== id));
  };

  const addManual = () => {
    if (newPlate.trim()) {
      onUpdate([{ id: `man-${Date.now()}`, plateNumber: newPlate.trim().replace(/\s/g, ''), reservationTime: '수동추가' }, ...reservations]);
      setNewPlate('');
      setIsAddingManual(false);
    }
  };

  const filtered = reservations.filter(r => r.plateNumber.includes(searchTerm));

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full h-full sm:h-[80vh] max-w-2xl bg-zinc-900 border-t sm:border border-white/10 sm:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 bg-zinc-800/50 flex items-center justify-between border-b border-white/5">
              <div>
                <h3 className="text-2xl font-black text-white">예약 차량 명단 관리</h3>
                <p className="text-sm text-zinc-500 font-bold">총 {reservations.length}대 등록됨</p>
              </div>
              <button onClick={onClose} className="p-3 bg-white/5 rounded-2xl">
                <X className="w-8 h-8 text-white" />
              </button>
            </div>

            {/* Actions Bar */}
            <div className="p-4 grid grid-cols-2 gap-4 border-b border-white/5">
              <label className="flex flex-col items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 p-4 rounded-2xl cursor-pointer transition-all active:scale-95 shadow-lg shadow-blue-900/20">
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload} disabled={isProcessing} />
                {isProcessing ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
                <span className="text-sm font-black text-white">사진으로 등록</span>
              </label>
              <button 
                onClick={() => setIsAddingManual(!isAddingManual)}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl transition-all active:scale-95 ${isAddingManual ? 'bg-zinc-700' : 'bg-zinc-800 hover:bg-zinc-700'}`}
              >
                <Plus className={`w-6 h-6 text-zinc-300 transition-transform ${isAddingManual ? 'rotate-45' : ''}`} />
                <span className="text-sm font-black text-zinc-300">{isAddingManual ? '취소' : '직접 입력'}</span>
              </button>
            </div>

            {/* Manual Entry Form */}
            <AnimatePresence>
              {isAddingManual && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 py-6 bg-blue-600/10 border-b border-blue-500/20 overflow-hidden"
                >
                  <div className="flex gap-3">
                    <input 
                      autoFocus
                      type="text"
                      placeholder="차량번호 입력"
                      value={newPlate}
                      onChange={(e) => setNewPlate(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addManual()}
                      className="flex-1 bg-zinc-900 border-2 border-blue-500/30 rounded-xl px-4 py-3 text-white font-black text-lg outline-none focus:border-blue-500"
                    />
                    <button 
                      onClick={addManual}
                      className="bg-blue-600 px-6 py-3 rounded-xl font-black text-white active:scale-95 transition-all shadow-lg"
                    >
                      추가
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Search */}
            <div className="p-4 relative">
              <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input 
                type="text"
                placeholder="차량번호 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-800 border-none rounded-xl py-4 pl-12 pr-4 text-white font-bold placeholder:text-zinc-600 outline-none"
              />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filtered.length === 0 ? (
                <div className="text-center py-20 text-zinc-600 font-bold">
                  등록된 차량이 없습니다.
                </div>
              ) : (
                filtered.map((res) => (
                  <div key={res.id} className="flex items-center justify-between bg-white/5 p-5 rounded-2xl border border-white/5 group hover:border-white/10 transition-all">
                    <div>
                      <p className="text-2xl font-black text-white tracking-tight">{res.plateNumber}</p>
                      <p className="text-sm text-blue-400 font-bold">{res.reservationTime || '시간 미지정'}</p>
                    </div>
                    <button 
                      onClick={() => removeReservation(res.id)}
                      className="p-4 bg-red-500/10 hover:bg-red-500 rounded-2xl group/btn transition-all"
                    >
                      <Trash2 className="w-6 h-6 text-red-500 group-hover/btn:text-white" />
                    </button>
                  </div>
                ))
              )}
            </div>
            
            {/* Footer */}
            <div className="p-6 bg-zinc-800/30 border-t border-white/5">
              <button 
                onClick={onClose}
                className="w-full py-4 bg-white text-black text-xl font-black rounded-2xl shadow-xl shadow-black/40 active:scale-95 transition-all"
              >
                확인 완료
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
