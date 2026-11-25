// 渲染期 DOM 检查（仅 --props='{"check":true}' 时启用）：字号下限 / 文字填充率 / 行高 / 溢出 / 文字必须落在版式区内
import React, {useEffect, useState} from 'react';
import {continueRender, delayRender} from 'remotion';
import {CARD_TYPE_SIZES, MIN_FONT, NEAR_BLACK_L, PALETTE, RULE, type CardSize} from './tokens';
import {BIG_CARD_AREA} from './layouts.ts';
import {CARD_GUARD, cardContentFaults, fillFault, parseRgba} from './content-guard.ts';
import type {Rect} from './grid.ts';

const textRects = (root: Element) => {
  const out: DOMRect[] = []; const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n: Node | null;
  while ((n = w.nextNode())) { if (!n.textContent?.trim()) continue; const r = document.createRange(); r.selectNodeContents(n);
    for (const x of Array.from(r.getClientRects())) if (x.width > 0) out.push(x); }
  return out;
};
const union = (rs: DOMRect[]) => rs.length ? {l: Math.min(...rs.map((r) => r.left)), r: Math.max(...rs.map((r) => r.right)), t: Math.min(...rs.map((r) => r.top)), b: Math.max(...rs.map((r) => r.bottom))} : null;
const lum = (c: string) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return 1; const v = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number);
  if (v.length > 3 && v[3] < 0.3) return 1; const f = (x: number) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(v[0]) + 0.7152 * f(v[1]) + 0.0722 * f(v[2]); };
const blockOf = (el: Element): Element => { let e: Element | null = el; while (e && getComputedStyle(e).display.startsWith('inline')) e = e.parentElement; return e ?? el; };

export const DomCheck: React.FC<{id: string; zones: Record<string, Rect>}> = ({id, zones}) => {
  const [h] = useState(() => delayRender('domcheck'));
  useEffect(() => {
    (async () => {
      await (document as any).fonts.ready; await new Promise((r) => setTimeout(r, 300));
      const errs: string[] = []; const seenBlocks = new Set<Element>();
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n: Node | null;
      while ((n = w.nextNode())) {
        const txt = n.textContent?.trim(); if (!txt) continue; const el = n.parentElement!; if (el.closest('style,script,[data-deco],[data-sub]')) continue;
        const cs = getComputedStyle(el); const fs = parseFloat(cs.fontSize);
        const role = el.closest('[data-role]')?.getAttribute('data-role');
        // 5.1.1：不允许近黑文字（卡面/正文一律浅色或色调高亮）
        if (lum(cs.color) < NEAR_BLACK_L) errs.push(`近黑文字 ${cs.color}「${txt.slice(0, 12)}」`);
        // 5.1.1：小卡内文字字号必须取自该档字阶表
        const cardEl = el.closest('[data-card]'); const size = cardEl?.getAttribute('data-card') as CardSize | undefined;
        if (size && !CARD_TYPE_SIZES(size).some((z) => Math.abs(z - fs) < 0.6)) errs.push(`${size} 卡字号 ${fs}px 不在字阶 [${CARD_TYPE_SIZES(size).join('/')}]「${txt.slice(0, 12)}」`);
        if (fs < MIN_FONT.any - 0.5) errs.push(`字号过小 ${fs}px「${txt.slice(0, 12)}」`);
        else if (role === 'body' && fs < MIN_FONT.body - 0.5) errs.push(`正文字号 ${fs}px < ${MIN_FONT.body}「${txt.slice(0, 12)}」`);
        else if (role === 'room' && fs < MIN_FONT.room - 0.5) errs.push(`房间名 ${fs}px < ${MIN_FONT.room}「${txt.slice(0, 12)}」`);
        else if (role === 'label' && fs < MIN_FONT.label - 0.5) errs.push(`标签 ${fs}px < ${MIN_FONT.label}「${txt.slice(0, 12)}」`);
        const r = document.createRange(); r.selectNodeContents(n); const u = union(Array.from(r.getClientRects()) as DOMRect[]);
        const projectedCard = el.closest('[data-mg-card]')?.getBoundingClientRect();
        const inZone = u && (projectedCard
          ? u.l >= projectedCard.left - 6 && u.r <= projectedCard.right + 6 && u.t >= projectedCard.top - 52 && u.b <= projectedCard.bottom + 6
          : Object.values(zones).some((z) => u.l >= z.x - 6 && u.r <= z.x + z.w + 6 && u.t >= z.y - 6 && u.b <= z.y + z.h + 6));
        if (u && !inZone) errs.push(`文字出版式区「${txt.slice(0, 12)}」@${Math.round(u.l)},${Math.round(u.t)}–${Math.round(u.r)},${Math.round(u.b)}`);
        const blk = blockOf(el); if (seenBlocks.has(blk)) continue; seenBlocks.add(blk);
        const rs = textRects(blk).sort((a, b) => a.top - b.top); let lines = 0, lb = -1e9;
        for (const x of rs) { if (x.top >= lb - 2) { lines++; lb = x.bottom; } else lb = Math.max(lb, x.bottom); }
        if (lines > 1) { const bcs = getComputedStyle(blk); const lh = bcs.lineHeight === 'normal' ? 1.2 : parseFloat(bcs.lineHeight) / parseFloat(bcs.fontSize);
          if (lh < RULE.lineHeight - 0.01) errs.push(`多行行高 ${lh.toFixed(2)} < ${RULE.lineHeight}「${(blk.textContent || '').slice(0, 12)}」`); }
      }
      // 小卡定格：按实际字符范围核对每行，将数字与单位视为同一行。
      document.querySelectorAll('[data-card][data-card-key]').forEach((card) => {
        const box = card.getBoundingClientRect();
        const style = getComputedStyle(card);
        if (box.width <= 0 || Number(style.opacity) < 0.99 || style.transform !== 'none') return;
        const center = (box.left + box.right) / 2;
        for (const line of card.children) {
          if (line.matches('[data-deco],[data-media]')) continue;
          const text = union(textRects(line));
          if (text && Math.abs((text.l + text.r) / 2 - center) > 2) {
            errs.push(`小卡文字未水平居中「${(line.textContent ?? '').trim().slice(0, 12)}」`);
          }
        }
      });
      document.querySelectorAll('[data-fit]').forEach((c) => {
        const box = c.getBoundingClientRect(); const target = c.querySelector('[data-fit-text]') ?? c; const u = union(textRects(target));
        if (!u) return; const ratio = (u.r - u.l) / box.width;
        if (ratio > RULE.fillMax + 0.005) errs.push(`填充率 ${(ratio * 100).toFixed(0)}% > ${RULE.fillMax * 100}%（${c.getAttribute('data-fit')}「${(c.textContent || '').slice(0, 12)}」）`);
        if (c.scrollWidth > c.clientWidth + 1 || c.scrollHeight > c.clientHeight + 1) errs.push(`容器溢出（${c.getAttribute('data-fit')}「${(c.textContent || '').slice(0, 12)}」）`);
      });
      // 5.1.1：大卡（面积 > BIG_CARD_AREA）必须含图/视频/图表（img、video、canvas、[data-viz]），纯文字大卡不允许
      document.querySelectorAll('[data-card],[data-mg-card]').forEach((c) => {
        const b = c.getBoundingClientRect(); const area = b.width * b.height;
        if (area > BIG_CARD_AREA && !c.querySelector('img,video,canvas,[data-viz],[data-media]')) errs.push(`纯文字大卡 ${Math.round(b.width)}×${Math.round(b.height)}（> ${BIG_CARD_AREA / 1000}k px²）「${(c.textContent || '').slice(0, 12)}」：大卡必须放图`);
      });
      // 5.1.1：任何带毛玻璃（backdrop-filter）的面板，面积 > BIG_CARD_AREA 又不含图/视频/图表，也算纯文字大卡（覆盖旧版式手写的玻璃卡）
      document.querySelectorAll('div').forEach((c) => {
        if (c.closest('[data-deco],[data-viz]') || c.hasAttribute('data-card') || c.hasAttribute('data-mg-card')) return;
        const cs = getComputedStyle(c); const bf = cs.backdropFilter || (cs as any).webkitBackdropFilter; if (!bf || bf === 'none') return;
        const b = c.getBoundingClientRect(); if (b.width * b.height > BIG_CARD_AREA && !c.querySelector('img,video,canvas,[data-viz],[data-media]')) errs.push(`纯文字大玻璃面板 ${Math.round(b.width)}×${Math.round(b.height)}「${(c.textContent || '').slice(0, 12)}」：大面板必须放图或图表`);
      });
      // 5.1.2 卡面内容守卫：占位字 / 大圆大卡只有一两个字 / 长条卡内容太少 / 卡太宽太空 / 非墨蓝玻璃色（棕、纯灰、实心）。阈值见 content-guard.ts。
      {
        const cands = new Set<Element>(Array.from(document.querySelectorAll('[data-card],[data-mg-card]')));
        document.querySelectorAll('div').forEach((d) => {
          if (d.closest('[data-deco]')) return; const bf = getComputedStyle(d).backdropFilter || (getComputedStyle(d) as any).webkitBackdropFilter; if (!bf || bf === 'none') return;
          const host = d.closest('[data-card],[data-mg-card]'); if (host && host !== d) return; cands.add(d);
        });
        const palFills = Object.values(PALETTE.tones).flatMap((t) => [t.fill0, t.fill1]).map((x) => parseRgba(x)!);
        cands.forEach((el) => {
          const b = el.getBoundingClientRect(); if (b.width < 40 || b.height < 40) return;
          const label = `${el.getAttribute('data-card') ? '小卡' : el.getAttribute('data-mg-card') ? `卡${el.getAttribute('data-mg-card')}` : '玻璃面板'} ${Math.round(b.width)}×${Math.round(b.height)}「${(el.textContent || '').trim().slice(0, 10)}」`;
          // 文字与图标
          const runs: string[] = []; const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let tn: Node | null; const spans: [number, number][] = [];
          while ((tn = tw.nextNode())) { const t = tn.textContent?.trim(); if (!t || (tn.parentElement && tn.parentElement.closest('[data-deco],style,script'))) continue; runs.push(t);
            const r = document.createRange(); r.selectNodeContents(tn); for (const x of Array.from(r.getClientRects())) if (x.width > 0) spans.push([x.left, x.right]); }
          const vis = Array.from(el.querySelectorAll('img,video,canvas,svg,[data-viz],[data-media]')).filter((v) => { const dc = v.closest('[data-deco]'); if (dc && dc !== v) return false; /* 毛玻璃底下的背景副本（GlassUnderlay）不算卡内图 */ const q = v.getBoundingClientRect(); return q.width >= 24 && q.height >= 24; });
          vis.forEach((v) => { const q = v.getBoundingClientRect(); spans.push([q.left, q.right]); });
          const contentW = spans.length ? Math.max(...spans.map((q) => q[1])) - Math.min(...spans.map((q) => q[0])) : 0;
          const viz = !!el.closest('[data-viz]') || !!el.querySelector('[data-viz]');
          const rad = (x: Element) => { const q = x.getBoundingClientRect(); const br = getComputedStyle(x).borderTopLeftRadius; const r = br.endsWith('%') ? parseFloat(br) / 100 * Math.min(q.width, q.height) : parseFloat(br) || 0; return {r, w: q.width, h: q.height}; };
          const circle = [el, ...Array.from(el.children)].some((x) => { const q = rad(x); return q.w >= 100 && Math.abs(q.w - q.h) < 6 && q.r >= Math.min(q.w, q.h) / 2 - 1; });
          const pill = (() => { const q = rad(el); return q.r >= Math.min(q.w, q.h) / 2 - 1 && !circle; })(); // 全圆角胶囊是标签/结论，不算长条卡
          cardContentFaults({id: label, w: pill ? 1 : b.width, h: pill ? 1 : b.height, circle, texts: runs, hasVisual: vis.length > 0, contentW, viz}, BIG_CARD_AREA, label).forEach((m) => errs.push(m));
          // 卡面填充色
          const surf = [el, ...Array.from(el.querySelectorAll('div'))].filter((x) => { if (x.closest('[data-deco]')) return false; const cs = getComputedStyle(x); const q = x.getBoundingClientRect();
            return (cs.backgroundImage.includes('gradient') || parseRgba(cs.backgroundColor)?.a! > 0.5) && q.width * q.height >= 0.9 * b.width * b.height; });
          surf.forEach((x) => { const cs = getComputedStyle(x); const stops = [...(cs.backgroundImage.match(/rgba?\([^)]+\)/g) ?? []), cs.backgroundColor].map((q) => parseRgba(q)).filter((c): c is NonNullable<typeof c> => !!c && c.a >= 0.55);
            for (const c of stops) { const f = fillFault(c); if (f) errs.push(`${label} ${f}`);
              else if (!viz && !palFills.some((p) => Math.abs(p.r - c.r) <= 4 && Math.abs(p.g - c.g) <= 4 && Math.abs(p.b - c.b) <= 4 && Math.abs(p.a - c.a) <= 0.05)) errs.push(`${label} 卡面填充 rgba(${c.r},${c.g},${c.b},${c.a}) 不是墨蓝·电光色板里的玻璃色（灰中性/蓝数据/青决策/红风险/紫重点）`); } });
        });
      }
      console.log(`CHECK|${id}|${JSON.stringify(errs)}`);
      continueRender(h);
    })();
  }, []);
  return null;
};
