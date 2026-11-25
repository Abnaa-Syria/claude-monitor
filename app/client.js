'use client';
import { useState, useRef, useMemo, useEffect } from 'react';
import { setTheme } from './actions';
import { IconSun, IconMoon, IconCopy } from './icons';

// ---------- Theme toggle (cookie-backed, so the server renders the right theme) ----------
export function ThemeToggle() {
  const [, force] = useState(0);
  const toggle = async () => {
    const root = document.documentElement;
    const cur = root.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = cur === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    force(x => x + 1);
    await setTheme(next);
  };
  return (
    <button type="button" className="side-btn" onClick={toggle}>
      <IconMoon className="theme-dark-hide" /><span>تبديل الوضع</span>
    </button>
  );
}

// ---------- Copy to clipboard ----------
export function CopyButton({ text, label = 'نسخ', done = 'تم النسخ ✓', className = 'btn sm' }) {
  const [ok, setOk] = useState(false);
  return (
    <button type="button" className={className} onClick={async () => {
      try { await navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1800); } catch {}
    }}>
      <IconCopy />{ok ? done : label}
    </button>
  );
}

// ---------- Confirm before submitting a destructive form ----------
export function ConfirmSubmit({ message, children, className = 'btn danger' }) {
  return (
    <button type="submit" className={className} onClick={e => { if (!confirm(message)) e.preventDefault(); }}>
      {children}
    </button>
  );
}

// ---------- Daily stacked bar chart with hover tooltip ----------
// days: [{ day: 'YYYY-MM-DD', values: { [seriesKey]: { cost, tokens, sessions } } }]
// series: [{ key, label, slot }]
const fmtCost = v => '$' + (v >= 1000 ? Math.round(v).toLocaleString('en-US') : v.toFixed(2));
const fmtTok = v => (v >= 1e6 ? (v / 1e6).toFixed(2) + 'M' : v >= 1e3 ? (v / 1e3).toFixed(1) + 'K' : String(Math.round(v)));
const METRICS = { cost: { label: 'التكلفة', fmt: fmtCost }, tokens: { label: 'Tokens', fmt: fmtTok }, sessions: { label: 'الجلسات', fmt: v => String(v) } };

function niceMax(v) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const m = v / p;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p;
}

export function DailyChart({ days, series, height = 240 }) {
  const [metric, setMetric] = useState('cost');
  const [hover, setHover] = useState(null);
  const [W, setW] = useState(900);
  const box = useRef(null);
  useEffect(() => {
    const el = box.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el); return () => ro.disconnect();
  }, []);
  const H = height, padL = 4, padR = 58, padT = 10, padB = 28;
  const { totals, max } = useMemo(() => {
    const totals = days.map(d => series.reduce((a, s) => a + (d.values[s.key]?.[metric] || 0), 0));
    return { totals, max: niceMax(Math.max(0, ...totals)) };
  }, [days, series, metric]);
  const fmt = METRICS[metric].fmt;
  const n = days.length || 1;
  const slot = (W - padL - padR) / n;
  const bw = Math.max(2, Math.min(28, slot * 0.62));
  const y = v => padT + (H - padT - padB) * (1 - v / max);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(t => t * max);
  const labelEvery = Math.ceil(n / 10);

  return (
    <div className="chart" ref={box}>
      <div className="card-head" style={{ padding: 0, marginBottom: 12 }}>
        <div className="metric-tabs" role="tablist">
          {Object.entries(METRICS).map(([k, m]) => (
            <button key={k} type="button" className={metric === k ? 'on' : ''} onClick={() => setMetric(k)}>{m.label}</button>
          ))}
        </div>
        {series.length > 1 && (
          <div className="legend">{series.map(s => <span key={s.key} className={`org-${s.slot}`}><i className="dot" />{s.label}</span>)}</div>
        )}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label={`${METRICS[metric].label} اليومية`}
        onMouseLeave={() => setHover(null)} style={{ direction: 'ltr' }}>
        {ticks.map((t, i) => (
          <g key={i}>
            <line className="gridline" x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} />
            <text className="axis" x={W - padR + 8} y={y(t) + 4} textAnchor="start" direction="ltr">{fmt(t)}</text>
          </g>
        ))}
        {days.map((d, i) => {
          const cx = padL + slot * i + slot / 2;
          let acc = 0;
          const segs = series.map(s => {
            const v = d.values[s.key]?.[metric] || 0;
            const y0 = y(acc), y1 = y(acc + v); acc += v;
            return { s, v, y0, y1 };
          }).filter(g => g.v > 0);
          return (
            <g key={d.day}>
              <rect className={`hit${hover?.i === i ? ' on' : ''}`} x={padL + slot * i} y={padT} width={slot} height={H - padT - padB} rx="4"
                onMouseEnter={() => setHover({ i, x: Math.min(Math.max(cx, 95), W - 95), y: Math.max(y(totals[i]), 70) + 44 })} />
              {segs.map((g, j) => {
                const top = j === segs.length - 1;
                const h = Math.max(0, g.y0 - g.y1 - (j > 0 ? 2 : 0));
                return (
                  <path key={g.s.key} className={`org-${g.s.slot}`} style={{ fill: 'var(--c)', pointerEvents: 'none' }}
                    d={top && h > 4
                      ? `M${cx - bw / 2},${g.y0} V${g.y1 + 4} Q${cx - bw / 2},${g.y1} ${cx - bw / 2 + 4},${g.y1} H${cx + bw / 2 - 4} Q${cx + bw / 2},${g.y1} ${cx + bw / 2},${g.y1 + 4} V${g.y0} Z`
                      : `M${cx - bw / 2},${g.y0} V${g.y0 - h} H${cx + bw / 2} V${g.y0} Z`} />
                );
              })}
              {i % labelEvery === 0 && <text className="axis" x={cx} y={H - 8} textAnchor="middle">{d.label}</text>}
            </g>
          );
        })}
      </svg>
      {hover && days[hover.i] && (
        <div className="tip" style={{ left: hover.x, top: hover.y }}>
          <div className="t">{days[hover.i].label}</div>
          {series.map(s => (
            <div className="r" key={s.key}>
              <span className={`org-${s.slot}`}>{series.length > 1 && <i className="dot" />}{series.length > 1 ? s.label : METRICS[metric].label}</span>
              <b className="num">{fmt(days[hover.i].values[s.key]?.[metric] || 0)}</b>
            </div>
          ))}
          {series.length > 1 && <div className="r" style={{ borderTop: '1px solid var(--border)', marginTop: 6, paddingTop: 6 }}><span>الإجمالي</span><b className="num">{fmt(totals[hover.i])}</b></div>}
        </div>
      )}
    </div>
  );
}
