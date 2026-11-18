/** 卡片先落位，再从已有卡片向目标卡片连续连接。实现见 sequence.ts（5.1 顺序与连线）。 */
import {SEQ, linkStartAt, linkProgress, type LinkOpt} from './sequence.ts';
export const LINK = {cardEnter: SEQ.settle, hold: SEQ.hold, draw: SEQ.draw};
export const connectionAt = (sourceStart: number, targetStart: number, dur?: number) => linkStartAt(sourceStart, targetStart, dur);
export const connectionProgress = (frame: number, sourceStart: number, targetStart: number, opt: LinkOpt = {}) => linkProgress(frame, sourceStart, targetStart, opt);
export const afterCardProgress = (frame: number, start: number, opt: LinkOpt = {}) => linkProgress(frame, start, start, opt);
