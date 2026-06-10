import React from 'react';
import dayjs from 'dayjs';
import { AlertCircle } from 'lucide-react';

function AgingBadge({ startDate, isStopped }) {
  const days = dayjs().diff(dayjs(startDate), 'day');

  // กำหนดสไตล์สีตามจำนวนวัน Aging
  let styleClass = 'bg-green-100 text-green-600 font-medium';
  if (days >= 7) {
    styleClass = 'bg-red-100 text-red-600 font-bold';
  } else if (days >= 4) {
    styleClass = 'bg-yellow-100 text-yellow-600 font-bold';
  }

  return (
    <span className={`px-3 py-1 inline-flex rounded-full text-sm items-center ${styleClass}`}>
      {isStopped && <AlertCircle className="w-4 h-4 mr-1" />}
      {days} days
    </span>
  );
}

export default AgingBadge;