
import React from 'react';

export function Info({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-4 text-sm">
      {children}
    </div>
  );
}