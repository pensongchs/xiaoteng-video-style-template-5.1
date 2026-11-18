// 生成安装样例所需的静音 WAV（不入库）。正式期音频由 npm run episode 从 episodes/<期名>/ 拷贝。
import {existsSync, mkdirSync, writeFileSync, statSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

export const PREVIEW_AUDIO = 'public/episode/安装样例静音.wav';
export const PREVIEW_SECONDS = 50;
const DEFAULT_ROOT = join(fileURLToPath(new URL('..', import.meta.url)));

export function ensurePreviewAudio(root = DEFAULT_ROOT, seconds = PREVIEW_SECONDS) {
  const path = join(root, PREVIEW_AUDIO);
  const need = 44 + seconds * 48000 * 2 * 2;
  if (existsSync(path) && statSync(path).size >= need) return path;
  mkdirSync(dirname(path), {recursive: true});
  const dataSize = seconds * 48000 * 2 * 2;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(48000, 24);
  buf.writeUInt32LE(48000 * 2 * 2, 28);
  buf.writeUInt16LE(4, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(dataSize, 40);
  writeFileSync(path, buf);
  console.log('已生成安装样例静音 ' + PREVIEW_AUDIO);
  return path;
}

if (process.argv[1] && process.argv[1].endsWith('preview-audio.mjs')) ensurePreviewAudio();
