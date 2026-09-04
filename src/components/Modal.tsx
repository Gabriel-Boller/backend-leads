"use client";

import { useState } from "react";

export default function Modal({
  trigger,
  triggerClassName,
  title,
  onClose,
  children,
}: {
  trigger: React.ReactNode;
  triggerClassName?: string;
  title: string;
  onClose?: () => void;
  children: (close: () => void) => React.ReactNode;
}) {
  const [aberto, setAberto] = useState(false);

  const fechar = () => {
    setAberto(false);
    onClose?.();
  };

  return (
    <>
      <button type="button" className={triggerClassName} onClick={() => setAberto(true)}>
        {trigger}
      </button>
      {aberto && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && fechar()}>
          <div className="modal">
            <button type="button" className="modal-close" onClick={fechar}>
              ×
            </button>
            <h3>{title}</h3>
            {children(fechar)}
          </div>
        </div>
      )}
    </>
  );
}
