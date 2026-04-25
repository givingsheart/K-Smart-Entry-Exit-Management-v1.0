/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Clock as ClockIcon } from 'lucide-react';

export default function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/20">
      <ClockIcon className="w-6 h-6 text-blue-400 animate-pulse" />
      <span className="text-2xl font-mono font-bold tracking-wider text-white">
        {time.toLocaleTimeString('ko-KR', { hour12: false })}
      </span>
    </div>
  );
}
