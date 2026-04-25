/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { X, Save, Phone, Info } from 'lucide-react';
import { EntryRecord, EntryType } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  record: EntryRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<EntryRecord>) => void;
}

export default function DetailModal({ record, isOpen, onClose, onSave }: Props) {
  const [content, setContent] = useState('');
  const [type, setType] = useState<EntryType>('일반');

  useEffect(() => {
    if (record) {
      setContent(record.content || '');
      setType(record.type);
    }
  }, [record]);

  if (!record) return null;

  const handleSave = () => {
    onSave(record.id, { content, type });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <div className="px-8 py-6 bg-zinc-800/50 flex items-center justify-between border-b border-white/5">
              <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                <Info className="w-6 h-6 text-blue-400" />
                방문 상세 정보
              </h3>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-8 h-8 text-white/50" />
              </button>
            </div>

            <div className="p-8 space-y-8">
              <div className="flex justify-between items-center bg-white/5 px-6 py-4 rounded-2xl">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-1">차량번호</p>
                  <p className="text-3xl font-black text-white">{record.plateNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-1">입차시간</p>
                  <p className="text-2xl font-mono text-blue-400 font-bold">{record.entryTime}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-gray-400 block mb-3">방문 구분 선택</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['일반', '예약', '공사'] as EntryType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className={`
                        py-4 rounded-xl font-bold text-lg transition-all
                        ${type === t 
                          ? (t === '예약' ? 'bg-blue-600 ring-4 ring-blue-500/20 text-white' : t === '공사' ? 'bg-orange-600 ring-4 ring-orange-500/20 text-white' : 'bg-white text-black')
                          : 'bg-zinc-800 text-gray-500 hover:bg-zinc-700'}
                      `}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-gray-400 block mb-3">상세 내용 (전화번호, 목적 등)</label>
                <div className="relative">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="예: 010-1234-5678, 브레이크 점검"
                    className="w-full bg-zinc-800 border-2 border-white/5 focus:border-blue-500 rounded-2xl p-4 text-white text-lg min-h-[120px] outline-none transition-all"
                  />
                  <div className="absolute top-4 right-4 pointer-events-none opacity-20">
                    <Phone className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>

              <button
                onClick={handleSave}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-6 rounded-2xl text-2xl font-black shadow-xl shadow-blue-900/20 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                <Save className="w-8 h-8" />
                저장하기
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
