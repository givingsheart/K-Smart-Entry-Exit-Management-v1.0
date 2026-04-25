/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, 
  Settings, 
  LayoutDashboard, 
  BellRing,
  Smartphone,
  ChevronRight,
  ClipboardList,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Clock from './components/Clock';
import ReservationManager from './components/ReservationManager';
import Scanner from './components/Scanner';
import RecordTable from './components/RecordTable';
import DetailModal from './components/DetailModal';
import SetupModal from './components/SetupModal';
import ManualEntryModal from './components/ManualEntryModal';
import { Reservation, EntryRecord, EntryType } from './types';

const STORAGE_KEY = 'benz_smart_parking_state_v2';

// Simple beep sound generator
const playAlertSound = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
    oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5);
    
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.5);
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

export default function App() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [records, setRecords] = useState<EntryRecord[]>([]);
  const [apiKey, setApiKey] = useState<string>('');
  const [isTestMode, setIsTestMode] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isResManagerOpen, setIsResManagerOpen] = useState(false);
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  
  const [editingRecord, setEditingRecord] = useState<EntryRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [reservationAlert, setReservationAlert] = useState<{ plate: string; time?: string } | null>(null);

  // Load state
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const { reservations: r, records: rc, apiKey: k, isTestMode: st } = JSON.parse(saved);
        setReservations(r || []);
        setRecords(rc || []);
        setApiKey(k || '');
        setIsTestMode(st || false);
        if (!k && !process.env.GEMINI_API_KEY && !st) {
          setIsSetupOpen(true);
        }
      } catch (e) {
        console.error("Failed to load state", e);
      }
    } else {
      if (!process.env.GEMINI_API_KEY) {
        setIsSetupOpen(true);
      }
    }
  }, []);

  // Save state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ reservations, records, apiKey, isTestMode }));
  }, [reservations, records, apiKey, isTestMode]);

  const handleScan = useCallback((plateNumber: string, action: 'entry' | 'exit') => {
    setIsScanning(true);
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const normalizedPlate = plateNumber.trim().replace(/\s/g, '');

    setRecords(prevRecords => {
      if (action === 'exit') {
        // 이미 입차 기록이 있는지 확인 (출차 시간이 아직 없는 동일 번호 차량)
        const existingIndex = prevRecords.findIndex(r => r.plateNumber.replace(/\s/g, '') === normalizedPlate && !r.exitTime);
        
        if (existingIndex !== -1) {
          const updated = [...prevRecords];
          updated[existingIndex] = {
            ...updated[existingIndex],
            exitTime: timeStr
          };
          return updated;
        } else {
          // 입차 기록은 없지만 출차 처리하는 경우 (비정상 기록 대비)
          const newRec: EntryRecord = {
            id: `rec-${Date.now()}`,
            round: prevRecords.length + 1,
            type: '일반',
            plateNumber: normalizedPlate,
            entryTime: '--:--',
            exitTime: timeStr,
            content: '출차(입차확인불가)',
            remarks: ''
          };
          return [newRec, ...prevRecords];
        }
      } else {
        // 입차(Entry) 처리
        const reservation = reservations.find(r => r.plateNumber.replace(/\s/g, '') === normalizedPlate);
        const type: EntryType = reservation ? '예약' : '일반';

        if (reservation) {
          setReservationAlert({ plate: normalizedPlate, time: reservation.reservationTime });
          playAlertSound();
          setTimeout(() => setReservationAlert(null), 5000);
        }

        const newRecord: EntryRecord = {
          id: `rec-${Date.now()}`,
          round: prevRecords.length + 1,
          type,
          plateNumber: normalizedPlate,
          entryTime: timeStr,
          content: '',
          remarks: ''
        };

        // 입차 시에만 상세 입력창을 띄워줌
        setEditingRecord(newRecord);
        setIsModalOpen(true);
        
        return [newRecord, ...prevRecords];
      }
    });

    setIsScanning(false);
  }, [reservations]);

  const handleSaveRecord = (id: string, updates: Partial<EntryRecord>) => {
    setRecords(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const exportToCSV = () => {
    if (records.length === 0) {
      alert("내보낼 기록이 없습니다.");
      return;
    }

    const headers = ["순번", "구분", "차량번호", "입차시간", "출차시간", "내용", "비고"];
    const rows = records.map(r => [
      r.round,
      r.type,
      r.plateNumber,
      r.entryTime,
      r.exitTime || '-',
      r.content || '',
      r.remarks || ''
    ]);

    // Add BOM for Excel Korean support
    const BOM = "\uFEFF";
    const csvContent = BOM + [headers, ...rows].map(e => e.join(",")).join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
    const timeStr = now.getHours().toString().padStart(2, '0') + now.getMinutes().toString().padStart(2, '0');
    
    link.setAttribute("href", url);
    link.setAttribute("download", `HDC랩스_입출차_일지_${dateStr}_${timeStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-zinc-100 font-sans selection:bg-blue-500/30">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 w-full bg-black/60 backdrop-blur-xl border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white p-1.5 rounded-lg shadow-lg">
              <svg viewBox="0 0 100 100" className="w-8 h-8 fill-black">
                <path d="M50 0 L100 86.6 L0 86.6 Z" />
                <path d="M50 100 L0 13.4 L100 13.4 Z" />
                <circle cx="50" cy="50" r="15" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tighter uppercase text-white leading-none">한성SVC & HDC랩스</h1>
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-1">스마트 입출차 관리 시스템</p>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <Clock />
            <div className="h-8 w-px bg-white/10 hidden sm:block" />
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsResManagerOpen(true)}
                className="flex items-center gap-3 bg-white/5 hover:bg-white/10 px-6 py-3 rounded-2xl border border-white/10 transition-all active:scale-95 group"
              >
                <ClipboardList className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform" />
                <span className="font-black text-white hidden sm:inline">예약 차량 관리</span>
              </button>

              <button 
                onClick={() => setIsSetupOpen(true)}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all active:scale-95 group"
                title="설정"
              >
                <Settings className="w-6 h-6 text-zinc-500 group-hover:text-white" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[500px] mx-auto px-4 py-6 space-y-8">
        {/* Reservation Alert Overlay */}
        <AnimatePresence>
          {reservationAlert && (
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-xl"
            >
              <div className="bg-blue-600 shadow-2xl shadow-blue-500/40 rounded-[2.5rem] p-8 border-4 border-blue-400 flex items-center gap-8">
                <div className="bg-white/20 p-6 rounded-3xl backdrop-blur-md">
                  <BellRing className="w-16 h-16 text-white animate-bounce" />
                </div>
                <div className="flex-1">
                  <h2 className="text-4xl font-black text-white mb-2 italic tracking-tighter">예약 차량 입차!</h2>
                  <p className="text-white text-2xl font-bold">
                    {reservationAlert.plate}
                    {reservationAlert.time && <span className="ml-3 text-blue-200">({reservationAlert.time} 예약)</span>}
                  </p>
                </div>
                <button 
                  onClick={() => setReservationAlert(null)}
                  className="bg-white/10 hover:bg-white/20 p-4 rounded-2xl transition-colors"
                >
                  <ChevronRight className="w-10 h-10 text-white" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <section className="flex flex-col gap-8">
          {/* Scanning Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xl font-black text-white flex items-center gap-3">
                <Smartphone className="w-6 h-6 text-blue-500" />
                번호판 촬영 인식
              </h2>
            </div>
            <Scanner onScan={handleScan} isProcessing={isScanning} apiKey={apiKey} isTestMode={isTestMode} />
          </div>

          {/* Stats */}
          <div className="space-y-4">
             <h2 className="text-xl font-black text-white flex items-center gap-3 px-2">
              <LayoutDashboard className="w-6 h-6 text-blue-500" />
              오늘의 현황
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-900/80 border border-white/10 rounded-[2rem] p-6">
                <p className="text-[10px] font-bold text-zinc-500 uppercase mb-2 tracking-widest text-center">오늘 입차</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-black text-white">{records.length}</span>
                  <span className="text-zinc-500 text-sm font-bold">대</span>
                </div>
              </div>
              <div className="bg-zinc-900/80 border border-white/10 rounded-[2rem] p-6">
                <p className="text-[10px] font-bold text-zinc-500 uppercase mb-2 tracking-widest text-center">예약 방문</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-black text-blue-500">
                    {records.filter(r => r.type === '예약').length}
                  </span>
                  <span className="text-zinc-500 text-sm font-bold">대</span>
                </div>
              </div>
              
              <button 
                onClick={() => setIsManualEntryOpen(true)}
                className="col-span-2 flex items-center justify-center gap-4 bg-zinc-800 hover:bg-zinc-700 py-6 rounded-[1.5rem] transition-all active:scale-95 group border border-white/5 shadow-lg"
              >
                <Settings className="w-6 h-6 text-zinc-500 group-hover:rotate-90 transition-transform duration-500" />
                <span className="text-lg font-black text-zinc-300">수동 번호 입력</span>
              </button>
              
              <button 
                onClick={() => setIsResManagerOpen(true)}
                className="col-span-2 flex items-center justify-center gap-4 bg-blue-600 hover:bg-blue-500 py-6 rounded-[1.5rem] text-white font-black text-lg active:scale-95 shadow-xl shadow-blue-900/20"
              >
                <ClipboardList className="w-6 h-6" />
                예약 명단 관리
              </button>
            </div>
          </div>
        </section>

        {/* History Table Section */}
        <section className="space-y-6 pb-20">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black text-white flex items-center gap-3">
              <History className="w-6 h-6 text-blue-500" />
              오늘의 입출차 기록
            </h2>
            <div className="flex items-center gap-4">
              <button 
                onClick={exportToCSV}
                className="text-xs font-black text-blue-500 hover:text-blue-400 transition-colors uppercase tracking-widest flex items-center gap-1 border border-blue-500/20 px-3 py-2 rounded-xl bg-blue-500/5 hover:bg-blue-500/10"
              >
                <ClipboardList className="w-4 h-4" />
                장부 저장
              </button>
              <button 
                onClick={() => {
                  if (confirm("오늘의 모든 기록을 삭제하시겠습니까? (예약 명단은 유지됩니다)")) {
                    setRecords([]);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify({ reservations, records: [], apiKey }));
                  }
                }}
                className="text-xs font-bold text-zinc-600 hover:text-red-500 transition-colors uppercase tracking-widest"
              >
                기록 삭제
              </button>
            </div>
          </div>
          <RecordTable 
            records={records} 
            onMemoClick={(record) => {
              setEditingRecord(record);
              setIsModalOpen(true);
            }} 
          />
        </section>
      </main>

      <DetailModal 
        record={editingRecord}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveRecord}
      />

      <ReservationManager 
        reservations={reservations}
        isOpen={isResManagerOpen}
        onClose={() => setIsResManagerOpen(false)}
        onUpdate={(updated) => setReservations(updated)}
        apiKey={apiKey}
      />

      <SetupModal
        isOpen={isSetupOpen}
        onSave={(key, testMode) => {
          setApiKey(key);
          setIsTestMode(testMode);
          setIsSetupOpen(false);
        }}
        initialKey={apiKey}
        initialTestMode={isTestMode}
        isMandatory={!apiKey && !process.env.GEMINI_API_KEY && !isTestMode}
      />

      <ManualEntryModal
        isOpen={isManualEntryOpen}
        onClose={() => setIsManualEntryOpen(false)}
        onConfirm={handleScan}
      />
    </div>
  );
}
