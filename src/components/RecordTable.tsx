/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EntryRecord } from '../types';
import { LogIn, LogOut, FileText } from 'lucide-react';

interface Props {
  records: EntryRecord[];
  onMemoClick: (record: EntryRecord) => void;
  onExitClick?: (record: EntryRecord) => void;
}

export default function RecordTable({ records, onMemoClick, onExitClick }: Props) {
  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case '예약': return 'bg-blue-600 text-white';
      case '공사': return 'bg-orange-600 text-white';
      default: return 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="w-full overflow-x-auto bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 shadow-xl mt-8">
      <table className="w-full text-left border-collapse">
        <thead>
            <tr className="bg-gray-100 dark:bg-zinc-800 text-xs uppercase tracking-wider text-gray-600 dark:text-zinc-300">
            <th className="px-6 py-4 font-black border-b dark:border-zinc-700">순번</th>
            <th className="px-6 py-4 font-black border-b dark:border-zinc-700">구분</th>
            <th className="px-6 py-4 font-black border-b dark:border-zinc-700">차량번호</th>
            <th className="px-6 py-4 font-black border-b dark:border-zinc-700">입차시간</th>
            <th className="px-6 py-4 font-black border-b dark:border-zinc-700">출차시간</th>
            <th className="px-6 py-4 font-black border-b dark:border-zinc-700">내용</th>
            <th className="px-6 py-4 font-black border-b dark:border-zinc-700">비고</th>
            <th className="px-6 py-4 font-black border-b dark:border-zinc-700 text-right">관리</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
          {records.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-6 py-12 text-center text-gray-500 font-bold">
                오늘의 입출차 기록이 없습니다.
              </td>
            </tr>
          ) : (
            records.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/30 transition-colors border-b dark:border-zinc-800">
                <td className="px-6 py-4 font-black text-zinc-400 dark:text-zinc-300 text-base">{record.round}</td>
                <td className="px-6 py-4">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-black tracking-tighter ${getTypeBadgeColor(record.type)}`}>
                    {record.type}
                  </span>
                </td>
                <td className="px-6 py-4 font-black text-2xl text-zinc-900 dark:text-white tracking-tighter">{record.plateNumber}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <LogIn className="w-4 h-4" />
                    <span className="font-mono font-bold">{record.entryTime}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {record.exitTime ? (
                    <div className="flex items-center gap-2 text-red-500">
                      <LogOut className="w-4 h-4" />
                      <span className="font-mono">{record.exitTime}</span>
                    </div>
                  ) : (
                    <span className="text-gray-300 dark:text-zinc-700 italic">-</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                    <span className="text-sm font-medium truncate max-w-[150px]">
                      {record.content || '-'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-400">{record.remarks || '-'}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {!record.exitTime && onExitClick && (
                      <button 
                        onClick={() => onExitClick(record)}
                        className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl transition-all active:scale-95 border border-red-400"
                      >
                        <LogOut className="w-5 h-5" />
                        <span className="font-bold">출차처리</span>
                      </button>
                    )}
                    <button 
                      onClick={() => onMemoClick(record)}
                      className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-xl transition-all active:scale-95 border border-white/5"
                    >
                      <FileText className="w-5 h-5" />
                      <span className="font-bold">수정</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
