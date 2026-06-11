import React from 'react';
import { motion as framerMotion, AnimatePresence, MotionConfig } from 'framer-motion';

const wrapped = new Map();

function wrapMotionComponent(Component) {
  const Safe = React.forwardRef(function SafeMotion({ initial = false, ...props }, ref) {
    return <Component ref={ref} initial={initial} {...props} />;
  });
  Safe.displayName = `SafeMotion(${Component.displayName || Component.name || 'Component'})`;
  return Safe;
}

/**
 * framer-motion proxy: default initial={false} so content never stays at opacity 0
 * when entrance animations fail to run (Vite prod + motion-utils bundling).
 */
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