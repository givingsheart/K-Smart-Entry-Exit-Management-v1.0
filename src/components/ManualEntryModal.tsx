/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { X, LogIn, LogOut, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (plate: string, mode: 'entry' | 'exit') => void;
}

export default function ManualEntryModal({ isOpen, onClose, onConfirm }: Props) {
  const [plate, setPlate] = useState('');

  const handleConfirm = (mode: 'entry' | 'exit') => {
    if (plate.trim()) {
      onConfirm(plate.trim().replace(/\s/g, ''), mode);
      setPlate('');
      onClose();
    }
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
            className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-[2.5rem] shadow-2xl p-8"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-white">수동 번호 입력</h3>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-8 h-8 text-white/50" />
              </button>
            </div>

            <div className="space-y-6">
              <input
                autoFocus
                type="text"
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                placeholder="차량번호 입력 (예: 123가4567)"
                className="w-full bg-zinc-800 border-2 border-white/5 focus:border-blue-500 rounded-2xl p-6 text-white text-3xl font-black outline-none tracking-tight text-center"
              />

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleConfirm('entry')}
                  disabled={!plate.trim()}
                  className="flex flex-col items-center gap-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:grayscale p-8 rounded-[2rem] shadow-xl active:scale-95 transition-all"
                >
                  <LogIn className="w-10 h-10 text-white" />
                  <span className="text-2xl font-black text-white">입차 처리</span>
                </button>
                <button
                  onClick={() => handleConfirm('exit')}
                  disabled={!plate.trim()}
                  className="flex flex-col items-center gap-3 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:grayscale p-8 rounded-[2rem] shadow-xl active:scale-95 transition-all"
                >
                  <LogOut className="w-10 h-10 text-white" />
                  <span className="text-2xl font-black text-white">출차 처리</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
