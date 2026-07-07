"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

export function Tooltip({ children, content }: { children: React.ReactElement; content: string }) {
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLElement>(null);

  if (!content) return <>{children}</>;

  const trigger = React.cloneElement(children, {
    ref: triggerRef,
    onMouseEnter: (e: any) => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setCoords({
          left: rect.left + rect.width / 2,
          top: rect.top - 8 // 8px spacing
        });
      }
      setShow(true);
      if (children.props.onMouseEnter) children.props.onMouseEnter(e);
    },
    onMouseLeave: (e: any) => {
      setShow(false);
      if (children.props.onMouseLeave) children.props.onMouseLeave(e);
    }
  });

  return (
    <>
      {trigger}
      {show && typeof document !== "undefined" && createPortal(
        <div 
          className="fixed px-2 py-1 bg-black/90 text-white/90 text-[11px] font-medium rounded whitespace-nowrap z-[9999] shadow-xl border border-white/10 pointer-events-none animate-in fade-in zoom-in-95 duration-100"
          style={{
            left: `${coords.left}px`,
            top: `${coords.top}px`,
            transform: "translate(-50%, -100%)"
          }}
        >
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-black/90" />
        </div>,
        document.body
      )}
    </>
  );
}
