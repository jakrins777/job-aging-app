import React from 'react';
import { Check, Pause } from 'lucide-react';

function StatusBadge({ status }) {
  if (status === 'S') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-100">
        <Pause className="w-3 h-3 mr-1 fill-current" /> Stopped
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
      <Check className="w-3.5 h-3.5 mr-1" /> Released
    </span>
  );
}

export default StatusBadge;