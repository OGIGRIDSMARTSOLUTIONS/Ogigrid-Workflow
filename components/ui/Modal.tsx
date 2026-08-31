"use client";

import { ReactNode } from "react";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}

export function Modal({ title, onClose, children, wide = false }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/50 backdrop-blur-sm px-3 py-6 sm:px-4 sm:py-10">
      <div
        className={`w-full ${wide ? "max-w-2xl" : "max-w-md"} rounded-lg border border-border bg-panel shadow-2xl animate-in fade-in zoom-in-95 duration-150`}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5 sm:py-4">
          <h2 className="text-sm sm:text-base font-semibold text-ink">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded-md text-ink-faint hover:bg-canvas hover:text-ink transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[78vh] overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">{children}</div>
      </div>
    </div>
  );
}
