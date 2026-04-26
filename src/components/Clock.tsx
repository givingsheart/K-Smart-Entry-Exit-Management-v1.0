/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Clock as ClockIcon } from 'lucide-react';

export default function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-1 bg-white/5 backdrop-blur-md px-1.5 py-0.5 rounded-md border border-white/10 shrink-0">
      <ClockIcon className="w-3 h-3 text-zinc-500" />
      <span className="text-[11px] font-mono font-bold tracking-tight text-zinc-400">
        {time.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}
      </span>
    </div>
  );
}
