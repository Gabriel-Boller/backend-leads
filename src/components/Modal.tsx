"use client";

import { useState } from "react";

export default function Modal({
  trigger,
  triggerClassName,
  title,
  children,
}: {
  trigger: React.ReactNode;
  triggerClassName?: string;
  title: string;
  children: (close: () => void) => React.ReactNode;
}) {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <button type="button" className={triggerClassName} onClick={() => setAberto(true)}>
        {trigger}
      </button>
      {aberto && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setAberto(false)}>
          <div className="modal">
            <button type="button" className="modal-close" onClick={() => setAberto(false)}>
              ×
            </button>
            <h3>{title}</h3>
            {children(() => setAberto(false))}
          </div>
        </div>
      )}
    </>
  );
}
