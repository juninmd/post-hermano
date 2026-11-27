import { createGlobalStyle } from 'styled-components';

/** Design tokens "Aurora": escuro por padrão, claro via [data-theme='light']. */
export const GlobalStyle = createGlobalStyle`
  :root {
    --bg: #080914; --surface: rgba(255,255,255,.035); --surface2: rgba(255,255,255,.06);
    --surface3: rgba(255,255,255,.09); --input: rgba(8,9,20,.6); --overlay: #0e1020;
    --line: rgba(255,255,255,.09); --line2: rgba(255,255,255,.16);
    --fg: #e9ebfa; --fg-strong: #ffffff; --mute: #8b90b3;
    --accent: #7c6cff; --accent-h: #6a59f5; --accent2: #22d3ee; --glow: rgba(124,108,255,.35);
    --ok: #34d399; --warn: #fbbf24; --err: #fb7185;
    --get: #60a5fa; --post: #34d399; --put: #fbbf24; --patch: #c084fc; --delete: #fb7185;
    --shadow: 0 20px 60px rgba(0,0,0,.45);
    color-scheme: dark;
  }
  :root[data-theme='light'] {
    --bg: #eef0fa; --surface: rgba(255,255,255,.65); --surface2: rgba(255,255,255,.85);
    --surface3: rgba(255,255,255,.95); --input: rgba(255,255,255,.9); --overlay: #ffffff;
    --line: rgba(24,26,70,.12); --line2: rgba(24,26,70,.22);
    --fg: #15173a; --fg-strong: #0b0c26; --mute: #5a5f88;
    --accent: #5848f0; --accent-h: #4a3bdc; --accent2: #0891b2; --glow: rgba(88,72,240,.25);
    --ok: #059669; --warn: #b45309; --err: #e11d48;
    --get: #2563eb; --post: #059669; --put: #b45309; --patch: #9333ea; --delete: #e11d48;
    --shadow: 0 20px 50px rgba(40,40,110,.15);
    color-scheme: light;
  }

  /*
   * Ponte Sonido -> tokens Aurora. Sonido lê --sn-*; aqui os valores apontam
   * para as variáveis que o app já usava, então o acento roxo e as superfícies
   * de vidro continuam os mesmos. Precisa valer também no tema claro porque
   * o Sonido define :root[data-theme='light'] com especificidade maior.
   */
  :root,
  :root[data-theme='light'] {
    --sn-color-bg: var(--bg);
    --sn-color-surface: var(--overlay);
    --sn-color-surface-2: var(--surface2);
    --sn-color-surface-hover: var(--surface3);
    --sn-color-border: var(--line2);
    --sn-color-border-soft: var(--line);
    --sn-color-text: var(--fg);
    --sn-color-text-dim: var(--mute);
    --sn-color-text-faint: var(--mute);
    --sn-color-on-accent: #ffffff;
    --sn-color-on-danger: #ffffff;
    --sn-color-accent: var(--accent);
    --sn-color-accent-2: var(--accent2);
    --sn-color-aqua: var(--accent2);
    --sn-color-gold: var(--warn);
    --sn-color-success: var(--ok);
    --sn-color-warning: var(--warn);
    --sn-color-danger: var(--err);
    --sn-color-info: var(--get);
    --sn-gradient: linear-gradient(135deg, var(--accent), #5b8cff);
    --sn-sig-1: var(--accent);
    --sn-sig-2: var(--accent2);
    --sn-sig-3: #5b8cff;
    --sn-gradient-signature: linear-gradient(115deg, var(--accent) 0%, #5b8cff 55%, var(--accent2) 100%);
    --sn-gradient-soft: linear-gradient(135deg, var(--glow), transparent);
    --sn-glass: var(--surface);
    --sn-glass-strong: var(--overlay);
    --sn-glass-edge: var(--line);
    --sn-scrim: rgba(4, 5, 14, 0.55);
    --sn-font: Inter, 'Segoe UI', system-ui, -apple-system, sans-serif;
    --sn-font-display: var(--sn-font);
    --sn-font-mono: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
    --sn-radius-sm: 8px;
    --sn-radius: 10px;
    --sn-radius-lg: 16px;
    --sn-shadow-card: var(--shadow);
    --sn-shadow-pop: var(--shadow);
    --sn-shadow-lift: var(--shadow);
    --sn-shadow-glow: 0 6px 20px var(--glow);
    --sn-ring: 0 0 0 3px var(--glow);
    --sn-blur: 18px;
  }

  :root {
    font-family: Inter, 'Segoe UI', system-ui, -apple-system, sans-serif;
    font-size: 14px; line-height: 1.5; font-weight: 400;
    color: var(--fg); background-color: var(--bg);
    font-synthesis: none; text-rendering: optimizeLegibility; -webkit-font-smoothing: antialiased;
  }
  body { margin: 0; display: flex; min-width: 800px; min-height: 100vh; background: var(--bg); color: var(--fg); overflow: hidden; }
  body::before, body::after {
    content: ''; position: fixed; width: 55vmax; height: 55vmax; border-radius: 50%;
    filter: blur(90px); pointer-events: none; z-index: 0; animation: aurora-drift 22s ease-in-out infinite alternate;
  }
  body::before { background: var(--accent); opacity: .4; left: -10%; top: -20%; }
  body::after { background: var(--accent2); opacity: .3; right: -15%; bottom: -25%; animation-delay: -8s; }
  #root { width: 100%; height: 100vh; position: relative; z-index: 1; }
  * { box-sizing: border-box; }

  button, input, select, textarea {
    font-family: inherit;
    transition: background-color .18s, border-color .18s, color .18s, box-shadow .18s, transform .18s;
  }
  button { cursor: pointer; border-radius: 8px; }
  input, select, textarea { border-radius: 8px; }
  input:focus, textarea:focus, button:focus-visible, [data-select-trigger]:focus-visible {
    outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--glow);
  }
  textarea, pre, code { font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace; }
  ::selection { background: var(--glow); }
  ::-webkit-scrollbar { width: 10px; height: 10px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--line2); border-radius: 6px; border: 2px solid transparent; background-clip: padding-box; }

  @keyframes aurora-drift { to { transform: translate(8vmax, 6vmax) scale(1.15); } }
  @keyframes rise { from { opacity: 0; transform: translateY(10px); } }
  @keyframes pop { from { opacity: 0; transform: scale(.85); } }
  @keyframes ping { 0% { transform: scale(.3); opacity: .9; } 100% { transform: scale(1.15); opacity: 0; } }

  @media (prefers-reduced-motion: reduce) {
    * { transition: none !important; animation: none !important; }
  }
`;
