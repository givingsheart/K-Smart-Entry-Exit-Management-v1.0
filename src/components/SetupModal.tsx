/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Key, ShieldCheck, ArrowRight, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  isOpen: boolean;
  onSave: (key: string, isTestMode: boolean) => void;
  initialKey?: string;
  initialTestMode?: boolean;
  isMandatory?: boolean;
}

export default function SetupModal({ isOpen, onSave, initialKey = '', initialTestMode = false, isMandatory = false }: Props) {
  const [key, setKey] = useState(initialKey);
  const [testMode, setTestMode] = useState(initialTestMode);

  const handleSave = () => {
    onSave(key.trim(), testMode);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/95 backdrop-blur-xl"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-[3rem] shadow-2xl p-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="text-center mb-10">
              <div className="bg-blue-600/20 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-blue-500/30">
                <ShieldCheck className="w-12 h-12 text-blue-500" />
              </div>
              <h2 className="text-3xl font-black text-white mb-2 leading-tight">시스템 초기 설정</h2>
              <p className="text-zinc-500 font-bold">스마트 입출차 관리 시스템을 시작합니다</p>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm font-bold text-zinc-400 uppercase tracking-widest pl-2">
                  <Key className="w-4 h-4" />
                  Gemini API Key 입력
                </label>
                <input
                  type="password"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="AI 기능을 위한 API 키를 입력해 주세요"
                  className="w-full bg-zinc-800 border-2 border-white/5 focus:border-blue-500 rounded-2xl p-6 text-white text-xl outline-none transition-all placeholder:text-zinc-700"
                />
                <button 
                  onClick={() => alert('박팀장에게 API 키 발급을 요청해 주세요. (연락처: 010-XXXX-XXXX)')}
                  className="flex items-center gap-2 text-blue-400 text-sm font-bold hover:underline pl-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  박팀장에게 발급 요청하기
                </button>
              </div>

              <div className="flex items-center justify-between bg-zinc-800/80 p-6 rounded-2xl border border-white/5">
                <div>
                  <h4 className="font-black text-white">테스트 모드 (Mock Mode)</h4>
                  <p className="text-sm text-zinc-500 font-bold">API 키 없이 가상 데이터로 테스트</p>
                </div>
                <button 
                  onClick={() => setTestMode(!testMode)}
                  className={`w-16 h-8 rounded-full transition-all relative ${testMode ? 'bg-blue-600' : 'bg-zinc-700'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${testMode ? 'left-9' : 'left-1'}`} />
                </button>
              </div>

              <div className="bg-zinc-800/50 p-6 rounded-2xl border border-white/5 space-y-3">
                <h4 className="font-black text-white">중요 안내</h4>
                <ul className="text-sm text-zinc-400 font-medium space-y-2 list-disc pl-4">
                  <li>차량 번호판 스캔 및 명단 추출에 AI 기술이 사용됩니다.</li>
                  <li>입력하신 키는 기기의 로컬 저장소에만 안전하게 보관됩니다.</li>
                  <li>50~66세 경비원분들을 위해 버튼과 글자를 크게 설계했습니다.</li>
                </ul>
              </div>

              <button
                onClick={handleSave}
                disabled={isMandatory && !key.trim()}
                className={`
                  w-full py-6 rounded-2xl text-2xl font-black shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3
                  ${isMandatory && !key.trim() ? 'bg-zinc-800 text-zinc-600 grayscale' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/20'}
                `}
              >
                설정 완료 및 시작하기
                <ArrowRight className="w-8 h-8" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
