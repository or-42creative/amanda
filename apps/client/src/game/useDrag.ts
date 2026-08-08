import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Pointer-based drag for placing a card from the hand onto a board slot.
 * Uses Pointer Events so mouse and touch share one path (required for mobile).
 * The board marks drop targets with `data-drop="x-y"` / `data-drop="king"`; on
 * release we hit-test the element under the pointer and report the target.
 */
export interface DragState {
  /** The card being dragged, or null when idle. */
  cardId: string | null;
  x: number;
  y: number;
  /** data-drop value currently hovered, or null. */
  over: string | null;
}

const IDLE: DragState = { cardId: null, x: 0, y: 0, over: null };
/** Pointer travel (px) before a press becomes a drag rather than a click. */
const DRAG_THRESHOLD = 6;

function dropTargetAt(x: number, y: number): string | null {
  const el = document.elementFromPoint(x, y);
  const host = el?.closest<HTMLElement>("[data-drop]");
  return host?.dataset.drop ?? null;
}

export function useDrag(onDrop: (cardId: string, target: string) => void) {
  const [drag, setDrag] = useState<DragState>(IDLE);
  const dragRef = useRef(drag);
  dragRef.current = drag;
  // Pending press: we only start dragging once the pointer actually moves, so a
  // simple tap still counts as a click (opening the card details).
  const pending = useRef<{ cardId: string; x: number; y: number } | null>(null);
  const onDropRef = useRef(onDrop);
  onDropRef.current = onDrop;

  const start = useCallback((cardId: string, e: React.PointerEvent) => {
    pending.current = { cardId, x: e.clientX, y: e.clientY };
  }, []);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const p = pending.current;
      if (p && !dragRef.current.cardId) {
        if (Math.hypot(e.clientX - p.x, e.clientY - p.y) < DRAG_THRESHOLD) return;
        setDrag({ cardId: p.cardId, x: e.clientX, y: e.clientY, over: dropTargetAt(e.clientX, e.clientY) });
        return;
      }
      if (!dragRef.current.cardId) return;
      e.preventDefault();
      setDrag((d) => ({ ...d, x: e.clientX, y: e.clientY, over: dropTargetAt(e.clientX, e.clientY) }));
    };
    const up = (e: PointerEvent) => {
      const d = dragRef.current;
      pending.current = null;
      if (!d.cardId) return;
      const target = dropTargetAt(e.clientX, e.clientY);
      if (target) onDropRef.current(d.cardId, target);
      setDrag(IDLE);
    };
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, []);

  return { drag, start, dragging: drag.cardId !== null };
}
