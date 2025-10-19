import { useEffect, useRef, useState } from 'react';

export type FlashStage = 'strong' | 'fade';

interface Options {
  strongMs?: number;
  fadeMs?: number;
}

export default function useFlashHighlight(options?: Options) {
  const strongMs = options?.strongMs ?? 300;
  const fadeMs = options?.fadeMs ?? 1000;

  const [stages, setStages] = useState<Map<string, FlashStage>>(new Map());
  const timeoutsRef = useRef<Map<string, number[]>>(new Map());

  const flashField = (fieldId: string) => {
    // clear any pending timeouts for this id
    const existing = timeoutsRef.current.get(fieldId);
    if (existing && existing.length) {
      existing.forEach((id) => clearTimeout(id));
    }
    // stage 1: strong
    setStages((prev) => {
      const next = new Map(prev);
      next.set(fieldId, 'strong');
      return next;
    });
    const t1 = window.setTimeout(() => {
      // stage 2: fade
      setStages((prev) => {
        const next = new Map(prev);
        next.set(fieldId, 'fade');
        return next;
      });
    }, strongMs);
    const t2 = window.setTimeout(() => {
      // clear
      setStages((prev) => {
        const next = new Map(prev);
        next.delete(fieldId);
        return next;
      });
      timeoutsRef.current.delete(fieldId);
    }, strongMs + fadeMs);
    timeoutsRef.current.set(fieldId, [t1, t2]);
  };

  const getStage = (fieldId: string): FlashStage | undefined => stages.get(fieldId);

  useEffect(() => {
    // Capture the current map reference for cleanup to avoid lint warning
    const map = timeoutsRef.current;
    return () => {
      map.forEach((arr) => arr.forEach((id) => clearTimeout(id)));
      map.clear();
    };
  }, []);

  return { flashField, getStage } as const;
}
