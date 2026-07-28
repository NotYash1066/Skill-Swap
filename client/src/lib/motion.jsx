import React from 'react';
import { motion as framerMotion, AnimatePresence, MotionConfig } from 'framer-motion';

const wrapped = new Map();

function wrapMotionComponent(Component) {
  const Safe = React.forwardRef(function SafeMotion({ initial = false, ...props }, ref) {
    // In production, never honor entrance animations — they can leave UI at opacity 0
    const safeInitial = import.meta.env.PROD ? false : initial;
    return <Component ref={ref} initial={safeInitial} {...props} />;
  });
  Safe.displayName = `SafeMotion(${Component.displayName || Component.name || 'Component'})`;
  return Safe;
}

export const motion = new Proxy(framerMotion, {
  get(target, prop) {
    const key = String(prop);
    if (wrapped.has(key)) return wrapped.get(key);

    const value = target[prop];
    if (typeof value !== 'object' || value === null) {
      return value;
    }

    const safe = wrapMotionComponent(value);
    wrapped.set(key, safe);
    return safe;
  },
});

export { AnimatePresence, MotionConfig };