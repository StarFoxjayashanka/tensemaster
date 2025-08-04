
import React from 'react';

interface ProgressBarProps {
  value: number; // 0 to 100
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, className = '' }) => {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div className={`relative h-4 w-full overflow-hidden rounded-full bg-secondary ${className}`}>
      <div
        className="h-full w-full flex-1 bg-primary transition-all"
        style={{ transform: `translateX(-${100 - safeValue}%)` }}
      />
    </div>
  );
};

export default ProgressBar;
