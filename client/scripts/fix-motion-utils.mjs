/* global process */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const shimPath = join(process.cwd(), 'node_modules', 'motion-utils', 'dist', 'es', 'window-config.mjs');

const shimSource = `const MotionGlobalConfig = {};
const isBrowser = typeof window !== 'undefined';
const windowObject = isBrowser ? window : undefined;

export { MotionGlobalConfig, isBrowser, windowObject };
export default windowObject;
`;

await mkdir(dirname(shimPath), { recursive: true });
await writeFile(shimPath, shimSource, 'utf8');
