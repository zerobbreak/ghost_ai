import { SignUp } from "@clerk/nextjs";
import { Sparkles, Users, ScrollText } from "lucide-react";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left panel — 50 % width */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between px-14 py-16 border-r border-(--color-border-default) bg-(--color-bg-base) shrink-0 relative overflow-hidden [font-family:var(--font-geist-sans)]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(0,200,212,0.09) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      >
        {/* Logo */}
        <div>
          <span className="text-2xl font-semibold tracking-tight text-(--color-text-primary)">
            ghost
            <span className="text-(--color-accent-primary)">.</span>
            ai
          </span>
        </div>

        {/* Diagram + copy */}
        <div className="space-y-10">
          <svg
            viewBox="0 0 380 200"
            className="w-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <style>{`
              .node-fill         { fill: var(--color-bg-elevated); }
              .node-stroke       { stroke: var(--color-border-subtle); stroke-width: 1; fill: none; }
              .node-stroke-accent{ stroke: var(--color-accent-primary); stroke-width: 1.5; fill: var(--color-bg-elevated); }
              .node-stroke-ai    { stroke: var(--color-accent-ai); stroke-width: 1.5; fill: var(--color-bg-elevated); }
              .node-text         { fill: var(--color-text-muted);      font-size: 9.5px; }
              .node-text-accent  { fill: var(--color-accent-primary);  font-size: 9.5px; }
              .node-text-ai      { fill: var(--color-accent-ai-text);  font-size: 9.5px; }
              .edge              { stroke: var(--color-border-default); stroke-width: 1; fill: none; }
              .edge-accent       { stroke: var(--color-accent-primary); stroke-width: 1; fill: none; opacity: 0.5; }
              .edge-ai           { stroke: var(--color-accent-ai);      stroke-width: 1; fill: none; opacity: 0.5; }

              @keyframes node-in   { from { opacity:0; transform:scale(.9); } to { opacity:1; transform:scale(1); } }
              @keyframes edge-in   { from { opacity:0; }                       to { opacity:1; } }
              @keyframes pulse-glow{ 0%,100%{ opacity:.85; } 50%{ opacity:1; } }

              .n0 { animation: node-in  .35s ease-out  .10s both; }
              .n1 { animation: node-in  .35s ease-out  .30s both; }
              .n2 { animation: node-in  .35s ease-out  .55s both; }
              .n3 { animation: node-in  .35s ease-out  .55s both; }
              .n4 { animation: node-in  .35s ease-out  .80s both; }
              .n5 { animation: node-in  .35s ease-out  .80s both; }
              .e0 { animation: edge-in  .30s ease-out  .20s both; }
              .e1 { animation: edge-in  .30s ease-out  .45s both; }
              .e2 { animation: edge-in  .30s ease-out  .45s both; }
              .e3 { animation: edge-in  .30s ease-out  .70s both; }
              .e4 { animation: edge-in  .30s ease-out  .70s both; }
              .pulsing { animation: pulse-glow 2.8s ease-in-out 1.2s infinite; }
            `}</style>

            <defs>
              <filter id="glow-accent" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="glow-ai" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <marker id="arr"    markerWidth="5" markerHeight="5" refX="4.5" refY="2.5" orient="auto"><path d="M0,0 L0,5 L5,2.5 z" fill="#2a2a30" /></marker>
              <marker id="arr-a"  markerWidth="5" markerHeight="5" refX="4.5" refY="2.5" orient="auto"><path d="M0,0 L0,5 L5,2.5 z" fill="#00c8d4" opacity="0.5" /></marker>
              <marker id="arr-ai" markerWidth="5" markerHeight="5" refX="4.5" refY="2.5" orient="auto"><path d="M0,0 L0,5 L5,2.5 z" fill="#6457f9" opacity="0.5" /></marker>
            </defs>

            {/* Edges */}
            <line className="edge e0"         x1="88"  y1="100" x2="114" y2="100" markerEnd="url(#arr)" />
            <line className="edge e1"         x1="192" y1="92"  x2="218" y2="60"  markerEnd="url(#arr)" />
            <line className="edge-accent e2"  x1="192" y1="100" x2="218" y2="100" markerEnd="url(#arr-a)" />
            <line className="edge e3"         x1="296" y1="92"  x2="306" y2="78"  markerEnd="url(#arr)" />
            <line className="edge e4"         x1="296" y1="108" x2="306" y2="122" markerEnd="url(#arr)" />
            <line className="edge-ai n2"      x1="190" y1="28"  x2="165" y2="84"  markerEnd="url(#arr-ai)" />

            {/* Client */}
            <g className="n0">
              <rect className="node-fill node-stroke" x="12" y="86" width="76" height="28" rx="4" />
              <text className="node-text" x="50" y="104" textAnchor="middle" fontFamily="var(--font-geist-mono), monospace">Client</text>
            </g>
            {/* API GW */}
            <g className="n1 pulsing" filter="url(#glow-accent)">
              <rect className="node-stroke-accent" x="114" y="86" width="78" height="28" rx="4" />
              <text className="node-text-accent" x="153" y="104" textAnchor="middle" fontFamily="var(--font-geist-mono), monospace">API GW</text>
            </g>
            {/* Auth */}
            <g className="n2">
              <rect className="node-fill node-stroke" x="218" y="44" width="76" height="28" rx="4" />
              <text className="node-text" x="256" y="62" textAnchor="middle" fontFamily="var(--font-geist-mono), monospace">Auth</text>
            </g>
            {/* Service */}
            <g className="n3">
              <rect className="node-fill node-stroke" x="218" y="86" width="76" height="28" rx="4" />
              <text className="node-text" x="256" y="104" textAnchor="middle" fontFamily="var(--font-geist-mono), monospace">Service</text>
            </g>
            {/* Cache */}
            <g className="n4">
              <rect className="node-fill node-stroke" x="304" y="62" width="68" height="28" rx="4" />
              <text className="node-text" x="338" y="80" textAnchor="middle" fontFamily="var(--font-geist-mono), monospace">Cache</text>
            </g>
            {/* DB */}
            <g className="n5">
              <rect className="node-fill node-stroke" x="304" y="108" width="68" height="28" rx="4" />
              <text className="node-text" x="338" y="126" textAnchor="middle" fontFamily="var(--font-geist-mono), monospace">DB</text>
            </g>
            {/* AI Agent */}
            <g className="n2 pulsing" filter="url(#glow-ai)">
              <rect className="node-stroke-ai" x="152" y="8" width="76" height="28" rx="4" />
              <text className="node-text-ai" x="190" y="26" textAnchor="middle" fontFamily="var(--font-geist-mono), monospace">AI Agent</text>
            </g>
          </svg>

          {/* Tagline + features */}
          <div className="space-y-5">
            <p className="text-base font-medium text-(--color-text-primary) leading-snug">
              Design, document, and ship your system architecture.
            </p>
            <ul className="space-y-3 text-sm text-(--color-text-muted) leading-relaxed">
              <li className="flex items-center gap-3">
                <Sparkles className="h-[15px] w-[15px] shrink-0 text-(--color-accent-primary)" />
                AI generates architecture from plain English
              </li>
              <li className="flex items-center gap-3">
                <Users className="h-[15px] w-[15px] shrink-0 text-(--color-accent-primary)" />
                Real-time collaborative canvas with live cursors
              </li>
              <li className="flex items-center gap-3">
                <ScrollText className="h-[15px] w-[15px] shrink-0 text-(--color-accent-primary)" />
                One-click Markdown spec export
              </li>
            </ul>
          </div>
        </div>

        <div />
      </div>

      {/* Right panel — Clerk form */}
      <div className="flex flex-1 items-center justify-center bg-(--color-bg-base) px-6 py-12">
        <SignUp />
      </div>
    </div>
  );
}
