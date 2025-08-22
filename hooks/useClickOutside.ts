// src/hooks/useClickOutside.ts

import { useEffect, useRef, RefObject } from 'react';

type Event = MouseEvent | TouchEvent;

export const useClickOutside = <T extends HTMLElement>(
  handler: (event: Event) => void
): RefObject<T> => {
  const ref = useRef<T>(null);

  useEffect(() => {
    const listener = (event: Event) => {
      const el = ref.current;
      // No hacer nada si el clic es dentro del elemento o sus descendientes
      if (!el || el.contains((event?.target as Node) || null)) {
        return;
      }
      handler(event); // Llamar a la función del handler si el clic es afuera
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);

  return ref;
};