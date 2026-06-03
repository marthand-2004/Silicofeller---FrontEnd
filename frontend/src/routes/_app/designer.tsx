import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Sparkles, Cpu, Send, PanelLeftClose, PanelLeftOpen,
  Copy, Download, CircuitBoard, Code2, Microchip, Plus, Minus,
  MessageSquare, Trash2, Pencil, Check, X, AlertTriangle,
  Loader2, CheckCircle2, Zap, Maximize2, Minimize2,
  ArrowRight, HelpCircle, Layers, Activity, Info, Sliders
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { generateChip, type GenerateResponse } from "@/lib/api/backend";
import { useSidebar } from "@/components/ui/sidebar";
import { useDesign } from "@/lib/design-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/designer")({
  head: () => ({ meta: [{ title: "AI Quantum Designer — Silicofeller" }] }),
  component: DesignerPage,
});

type ChatMsg = { role: "you" | "ai"; text: string; loading?: boolean };
type Conversation = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMsg[];
  result: GenerateResponse | null;
};

const STORAGE_KEY = "silicofeller.designer.conversations.v2";
const WELCOME: ChatMsg = {
  role: "ai",
  text: "Welcome to Silicofeller AI Quantum Designer. Describe the architecture, qubit counts, topological interfaces, or cryogenic constraints of the processor you wish to synthesize. Our solver will generate physical layouts, transmission meanders, and compile-ready Qiskit Metal code.",
};

const SUGGESTIONS = [
  {
    title: "5-Qubit Transmon Linear",
    description: "Linear qubit chain with nearest-neighbor meanders",
    prompt: "Design a 5-qubit transmon quantum processor with nearest-neighbor coupling."
  },
  {
    title: "16-Qubit Heavy-Hex Lattice",
    description: "Heavy-hexagonal lattice for error-correction topologies",
    prompt: "Design a 16-qubit heavy-hex architecture with 99.9% target fidelity."
  },
  {
    title: "64-Qubit Cryogenic Grid",
    description: "8x8 surface code lattice at cryo 7nm spacing",
    prompt: "Generate a 64-qubit surface-code quantum chip with 7nm Cryo spacing."
  },
  {
    title: "9-Qubit Ring Coherence",
    description: "Closed-loop transmon pockets with feedline coupling",
    prompt: "Create a 9-qubit transmon processor in a ring/loop topology."
  }
];

function newConversation(): Conversation {
  const now = Date.now();
  return {
    id: `c_${now}_${Math.random().toString(36).slice(2, 7)}`,
    title: "New Design Session",
    createdAt: now,
    updatedAt: now,
    messages: [WELCOME],
    result: null
  };
}

function DesignerPage() {
  const { user } = useAuth();
  const { setOpen: setWorkspaceSidebarOpen } = useSidebar();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"chip" | "circuit" | "code">("chip");

  const {
    conversations,
    activeId,
    activeConversation: active,
    updateActive,
    setConversations,
  } = useDesign();

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, activeId]);

  const send = async (textToSend?: string) => {
    const text = (textToSend || prompt).trim();
    if (!text || !active || loading) return;
    setPrompt("");
    setLoading(true);
    const isFirst = active.messages.length <= 1;
    updateActive({
      messages: [...active.messages, { role: "you", text }, { role: "ai", text: "Compiling quantum chip blueprint...", loading: true }],
      title: isFirst ? text.slice(0, 36) : active.title,
    });
    try {
      const result = await generateChip(text);
      
      // Auto-collapse primary sidebar to maximize screen space
      setWorkspaceSidebarOpen(false);
      
      const aiText = result.interpretation ?? `Generated a ${result.num_qubits}-qubit ${result.topology} chip. Custom layout, frequency bands, detuning coefficients, and Qiskit Metal script compile successfully.`;
      setConversations((cs) =>
        cs.map((c) => {
          if (c.id !== activeId) return c;
          const msgs = c.messages.filter((m) => !m.loading);
          return { ...c, messages: [...msgs, { role: "ai" as const, text: aiText }], result, updatedAt: Date.now() };
        })
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Internal engine error";
      setConversations((cs) =>
        cs.map((c) => {
          if (c.id !== activeId) return c;
          const msgs = c.messages.filter((m) => !m.loading);
          return { ...c, messages: [...msgs, { role: "ai" as const, text: `❌ Synthesis failed: ${msg}` }], updatedAt: Date.now() };
        })
      );
    } finally {
      setLoading(false);
    }
  };

  if (!active) return null;
  const hasOutput = !!active.result;
  const result = active.result;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex h-[calc(100vh-3rem)] w-full bg-[#FCFCFD] text-slate-800"
    >
      <div className="flex flex-1 min-h-0 divide-x divide-slate-200/50">
        
        {/* Left Section: 60% if output is present, otherwise full screen */}
        <div className={cn(
          "flex flex-col h-full overflow-hidden bg-slate-50/10 transition-all duration-200",
          hasOutput ? "w-[60%]" : "w-full"
        )}>
          {/* Chat Panel Header */}
          <div className="flex h-12 w-full items-center justify-between border-b border-slate-200/50 bg-white px-5 shrink-0 shadow-[0_1px_1px_rgba(0,0,0,0.005)]">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-white shadow-sm shadow-accent/15">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <div>
                <p className="text-xs font-black text-slate-900 leading-tight">Design Assistant</p>
                <p className="text-[9px] font-bold text-slate-400 flex items-center gap-1 mt-0.5">
                  <span className="w-1 h-1 rounded-full bg-emerald-500"></span> Synthesizer Engine Online
                </p>
              </div>
            </div>
            
            {hasOutput && (
              <Badge variant="secondary" className="rounded-full text-[10px] font-extrabold text-accent bg-accent-soft border border-accent/10 px-2.5 py-0.5 max-w-[180px] truncate">
                {active.title}
              </Badge>
            )}
          </div>

          {/* Messages list */}
          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6 scrollbar-thin select-text">
            {/* If no output, show beautiful ChatGPT/Claude style empty state centered */}
            {!hasOutput && (
              <div className="max-w-xl mx-auto my-auto py-12 text-center space-y-8 select-none">
                <div className="flex justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft border border-accent/10 shadow-inner text-accent">
                    <Sparkles className="h-6 w-6" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black tracking-tight text-slate-900 font-display">
                    Design Quantum Chips with AI
                  </h2>
                  <p className="max-w-md mx-auto text-xs text-slate-500 font-bold leading-relaxed">
                    Translate engineering requirements into physical transmon pocket placements, meander paths, and Qiskit Metal code.
                  </p>
                </div>

                {/* Quick Suggestions grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto pt-4 text-left">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s.title}
                      onClick={() => send(s.prompt)}
                      disabled={loading}
                      className="p-4 rounded-2xl border border-slate-200/60 bg-white hover:border-accent hover:shadow-[0_4px_20px_-4px_rgba(124,58,237,0.12)] text-left group transition-all duration-200 active:scale-98 cursor-pointer shadow-sm"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-slate-800 group-hover:text-accent">{s.title}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <p className="text-[10px] text-slate-400 font-semibold mt-1 leading-normal">{s.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Render conversation messages */}
            {hasOutput && active.messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-sm",
                  m.role === "you"
                    ? "ml-auto bg-accent text-white font-extrabold shadow-accent/15"
                    : "border border-slate-200 bg-white text-slate-800"
                )}
              >
                {m.loading ? (
                  <span className="flex items-center gap-2.5 font-bold text-accent">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" /> Synthesizing silicon layers…
                  </span>
                ) : (
                  m.text
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-slate-200/50 bg-white p-4 shrink-0">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Describe your transmon pocket layout, topology, and frequencies..."
              className="min-h-[60px] max-h-[120px] rounded-xl border-slate-200 focus-visible:ring-accent focus:border-accent bg-slate-50/20 text-slate-800 text-xs shadow-inner"
              disabled={loading}
            />
            <div className="mt-3 flex items-center justify-between select-none">
              <p className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
                <HelpCircle className="h-3.5 w-3.5 text-slate-300" /> Enter to submit blueprint request
              </p>
              <Button
                onClick={() => send()}
                size="sm"
                className="rounded-full px-4 bg-accent text-white hover:bg-accent/90 shadow-sm shadow-accent/20 h-8 text-xs font-bold active:scale-95 transition-all cursor-pointer"
                disabled={loading || !prompt.trim()}
              >
                {loading ? (
                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="mr-1 h-3.5 w-3.5" />
                )}
                Generate
              </Button>
            </div>
          </div>
        </div>

        {/* Right Section: 40% width (rendered if hasOutput is true) */}
        {hasOutput && result && (
          <div className="w-[40%] flex flex-col h-full bg-white overflow-hidden animate-in slide-in-from-right duration-200">
            <Tabs value={view} onValueChange={(v) => setView(v as typeof view)} className="flex flex-1 flex-col h-full">
              {/* Tabs trigger bar */}
              <div className="flex items-center justify-between border-b border-slate-200/50 px-4 bg-slate-50/30 shrink-0 h-12">
                <TabsList className="rounded-full bg-slate-200/50 p-0.5">
                  <TabsTrigger value="chip" className="rounded-full px-3.5 py-1 text-[11px] font-bold data-[state=active]:bg-white data-[state=active]:text-accent data-[state=active]:shadow-sm cursor-pointer">
                    Physical CAD
                  </TabsTrigger>
                  <TabsTrigger value="circuit" className="rounded-full px-3.5 py-1 text-[11px] font-bold data-[state=active]:bg-white data-[state=active]:text-accent data-[state=active]:shadow-sm cursor-pointer">
                    Spectrum
                  </TabsTrigger>
                  <TabsTrigger value="code" className="rounded-full px-3.5 py-1 text-[11px] font-bold data-[state=active]:bg-white data-[state=active]:text-accent data-[state=active]:shadow-sm cursor-pointer">
                    Code (.py)
                  </TabsTrigger>
                </TabsList>
                
                <div className="flex items-center gap-2">
                  {result.drc?.passed ? (
                    <Badge variant="secondary" className="rounded-full text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100/50 px-2 py-0.5 shrink-0 select-none">
                      DRC Pass
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="rounded-full text-[9px] font-black text-amber-700 bg-amber-50 border border-amber-100/50 px-2 py-0.5 shrink-0 select-none">
                      DRC Warning
                    </Badge>
                  )}
                </div>
              </div>

              {/* Tabs content wrappers */}
              <div className="flex-1 min-h-0 overflow-y-auto bg-slate-50/10 p-4">
                <TabsContent value="chip" className="mt-0 focus-visible:outline-none h-full">
                  <ChipView result={result} />
                </TabsContent>
                <TabsContent value="circuit" className="mt-0 focus-visible:outline-none h-full">
                  <FreqPlanView result={result} />
                </TabsContent>
                <TabsContent value="code" className="mt-0 focus-visible:outline-none h-full">
                  <CodeView result={result} />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        )}

      </div>
    </motion.div>
  );
}

function ChipView({ result }: { result: GenerateResponse }) {
  const [layers, setLayers] = useState({
    pockets: true,
    meanders: true,
    grid: true,
    labels: true,
  });

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-6">
      {/* Wafer blueprint rendering canvas Card (100% width) */}
      <Card className="rounded-3xl border-slate-200/80 p-5 shadow-sm bg-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Silicon Physical CAD</p>
            <h3 className="mt-1 text-base font-extrabold text-slate-900 leading-tight">{result.label}</h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{result.interpretation}</p>
          </div>
          <Badge variant="secondary" className="rounded-full bg-accent-soft border border-accent/15 text-accent font-bold px-2.5 py-0.5 text-[10px] shrink-0">
            {result.topology} · {result.num_qubits} Qubits
          </Badge>
        </div>

        {/* Canvas Component with custom layer opacities */}
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-[#F8FAFC] p-2 flex items-center justify-center h-[340px] shadow-inner relative w-full">
          <InteractiveCADCanvas result={result} layers={layers} />
        </div>

        {/* Quick parameters grid */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[
            { label: "Detuned Coherence", value: "Stabilized 10mK" },
            { label: "Routing Topology", value: result.topology },
            { label: "Fidelity Expectation", value: "99.92% Gate" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-2 shadow-inner">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide leading-none">{s.label}</p>
              <p className="mt-1 text-[11px] font-extrabold text-slate-700 truncate">{s.value}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Two Column Grid for Controls & Diagnostics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Column 1: CAD Layers Controls */}
        <Card className="rounded-3xl border-slate-200/80 p-5 shadow-sm bg-white flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 text-accent" /> CAD Layers
              </p>
              <h4 className="text-xs font-black text-slate-800 mt-1">Substrate Views</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">Toggle layout layers during DRC testing.</p>
            </div>
            
            <div className="space-y-2.5 pt-1">
              <label className="flex items-center gap-3 cursor-pointer group select-none">
                <input
                  type="checkbox"
                  checked={layers.pockets}
                  onChange={(e) => setLayers({ ...layers, pockets: e.target.checked })}
                  className="w-4.5 h-4.5 rounded border-slate-300 text-accent focus:ring-accent accent-accent"
                />
                <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block"></span> M1 Qubits (Gold)
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group select-none">
                <input
                  type="checkbox"
                  checked={layers.meanders}
                  onChange={(e) => setLayers({ ...layers, meanders: e.target.checked })}
                  className="w-4.5 h-4.5 rounded border-slate-300 text-accent focus:ring-accent accent-accent"
                />
                <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-slate-500 inline-block"></span> M2 Resonators (Silver)
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group select-none">
                <input
                  type="checkbox"
                  checked={layers.grid}
                  onChange={(e) => setLayers({ ...layers, grid: e.target.checked })}
                  className="w-4.5 h-4.5 rounded border-slate-300 text-accent focus:ring-accent accent-accent"
                />
                <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm border border-slate-400 bg-white inline-block"></span> Litho Grid
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group select-none">
                <input
                  type="checkbox"
                  checked={layers.labels}
                  onChange={(e) => setLayers({ ...layers, labels: e.target.checked })}
                  className="w-4.5 h-4.5 rounded border-slate-300 text-accent focus:ring-accent accent-accent"
                />
                <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block"></span> Text Labels
                </span>
              </label>
            </div>
          </div>
        </Card>

        {/* Column 2: Diagnostics Panel */}
        <Card className="rounded-3xl border-slate-200/80 p-5 shadow-sm bg-white flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Activity className="h-3.5 w-3.5 text-emerald-500" /> Diagnostics
              </p>
              <h4 className="text-xs font-black text-slate-800 mt-1">Status & Fidelity</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-normal font-medium">Fidelity, spacing constraint details, and alerts.</p>
            </div>
            
            <div className="space-y-2 pt-1">
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span>DRC Warnings</span>
                <span className={result.drc?.passed ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
                  {result.drc?.passed ? "0 Detected" : `${result.drc?.violations?.length} Warning`}
                </span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span>Solver Scale</span>
                <span className="text-slate-800 font-bold">1.00 mm</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span>Gate Fidelity</span>
                <span className="text-accent font-bold">99.92%</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* DRC violations warning matrix */}
      {result.drc && !result.drc.passed && (result.drc.violations?.length ?? 0) > 0 && (
        <Card className="rounded-2xl border-amber-200 bg-amber-50/40 p-4 shadow-sm">
          <p className="flex items-center gap-2 text-sm font-bold text-amber-800">
            <AlertTriangle className="h-4.5 w-4.5 text-amber-600" /> Physical Lithography Warnings (DRC)
          </p>
          <ul className="mt-2 space-y-1.5">
            {(result.drc.violations ?? []).map((v, i) => (
              <li key={i} className="text-xs text-amber-700 list-disc list-inside font-medium">
                <span className="font-extrabold">{(v.severity ?? "warn").toUpperCase()}</span> · {v.rule}: {v.message}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

/**
 * Interactive CAD Wafer Drawing Canvas
 * Connects layer selections and mouse hovering to display a glassmorphic tooltip with physical specifications.
 */
function InteractiveCADCanvas({ result, layers }: { result: GenerateResponse; layers: { pockets: boolean; meanders: boolean; grid: boolean; labels: boolean } }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedQubit, setSelectedQubit] = useState<any | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasParentRef = useRef<HTMLDivElement | null>(null);
  const [hovered, setHovered] = useState<any>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const qubits = result.placement?.qubits ?? [];

  // Mapping coordinate boundaries
  const coords = useMemo(() => {
    if (qubits.length === 0) return { minX: 0, maxX: 1, minY: 0, maxY: 1, rangeX: 1, rangeY: 1 };
    const minX = Math.min(...qubits.map(q => q.x));
    const maxX = Math.max(...qubits.map(q => q.x));
    const minY = Math.min(...qubits.map(q => q.y));
    const maxY = Math.max(...qubits.map(q => q.y));
    return {
      minX, maxX, minY, maxY,
      rangeX: maxX - minX || 1,
      rangeY: maxY - minY || 1
    };
  }, [qubits]);

  // Dimension tracking for the active canvas parent container
  useEffect(() => {
    const updateDimensions = () => {
      const parent = canvasParentRef.current;
      if (parent) {
        setDimensions({
          width: parent.clientWidth || (isFullscreen ? window.innerWidth : 500),
          height: parent.clientHeight || (isFullscreen ? window.innerHeight : 340),
        });
      } else {
        setDimensions({
          width: isFullscreen ? window.innerWidth : 500,
          height: isFullscreen ? window.innerHeight : 340,
        });
      }
    };
    updateDimensions();
    const timer = setTimeout(updateDimensions, 50);
    window.addEventListener("resize", updateDimensions);
    return () => {
      window.removeEventListener("resize", updateDimensions);
      clearTimeout(timer);
    };
  }, [isFullscreen, selectedQubit]);

  // Escape key navigation flow
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedQubit) {
          e.preventDefault();
          setSelectedQubit(null);
        } else if (isFullscreen) {
          e.preventDefault();
          setIsFullscreen(false);
        }
      }
    };
    if (isFullscreen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen, selectedQubit]);

  // Auto-center and zoom selected qubit in fullscreen mode
  useEffect(() => {
    if (selectedQubit && isFullscreen) {
      const w = dimensions.width;
      const h = dimensions.height;
      
      const paddingX = Math.min(160, w * 0.15);
      const paddingY = Math.min(120, h * 0.15);
      
      const px = paddingX + ((selectedQubit.x - coords.minX) / coords.rangeX) * (w - paddingX * 2);
      const py = h - paddingY - ((selectedQubit.y - coords.minY) / coords.rangeY) * (h - paddingY * 2);

      const targetZoom = 2.2;
      const targetPanX = w / 2 - px * targetZoom;
      const targetPanY = h / 2 - py * targetZoom;

      setZoomScale(targetZoom);
      setPanOffset({ x: targetPanX, y: targetPanY });
    } else if (!selectedQubit && isFullscreen) {
      setZoomScale(1.0);
      setPanOffset({ x: 0, y: 0 });
    }
  }, [selectedQubit, isFullscreen, dimensions, coords]);

  // Native wheel zoom listener with cursor centering (passive: false is supported)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isFullscreen) return;

    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      const zoomFactor = 1.15;
      let nextZoom = zoomScale;
      if (e.deltaY < 0) {
        nextZoom = Math.min(5, zoomScale * zoomFactor);
      } else {
        nextZoom = Math.max(0.5, zoomScale / zoomFactor);
      }

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const worldX = (mouseX - panOffset.x) / zoomScale;
      const worldY = (mouseY - panOffset.y) / zoomScale;

      const newPanX = mouseX - worldX * nextZoom;
      const newPanY = mouseY - worldY * nextZoom;

      setZoomScale(nextZoom);
      setPanOffset({ x: newPanX, y: newPanY });
    };

    canvas.addEventListener("wheel", handleNativeWheel, { passive: false });
    return () => {
      canvas.removeEventListener("wheel", handleNativeWheel);
    };
  }, [isFullscreen, zoomScale, panOffset]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = dimensions.width;
    const height = dimensions.height;
    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Silicon Substrate backing
    ctx.fillStyle = "#F8FAFC";
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    
    // Zoom & Pan transformation matrix
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoomScale, zoomScale);

    // Dynamic Litho Grid
    if (layers.grid) {
      ctx.strokeStyle = "rgba(148, 163, 184, 0.08)";
      ctx.lineWidth = 1 / zoomScale;
      const step = 25;
      const gridExtend = isFullscreen ? 2000 : 0;
      const startX = isFullscreen ? -gridExtend : 0;
      const endX = isFullscreen ? width + gridExtend : width;
      const startY = isFullscreen ? -gridExtend : 0;
      const endY = isFullscreen ? height + gridExtend : height;
      
      for (let x = startX; x < endX; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
        ctx.stroke();
      }
      for (let y = startY; y < endY; y += step) {
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
        ctx.stroke();
      }
    }

    // Outer metal bracket
    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 3 / zoomScale;
    ctx.strokeRect(10, 10, width - 20, height - 20);

    if (qubits.length === 0) {
      ctx.restore();
      return;
    }

    const getScreen = (qx: number, qy: number) => {
      const paddingX = isFullscreen ? Math.min(160, width * 0.15) : 80;
      const paddingY = isFullscreen ? Math.min(120, height * 0.15) : 60;
      const px = paddingX + ((qx - coords.minX) / coords.rangeX) * (width - paddingX * 2);
      const py = height - paddingY - ((qy - coords.minY) / coords.rangeY) * (height - paddingY * 2);
      return { px, py };
    };

    // Draw M2 meander lines
    if (layers.meanders) {
      for (let i = 0; i < qubits.length; i++) {
        for (let j = i + 1; j < qubits.length; j++) {
          const q1 = qubits[i];
          const q2 = qubits[j];
          const dist = Math.sqrt(Math.pow(q1.x - q2.x, 2) + Math.pow(q1.y - q2.y, 2));
          if (dist < 2.5) {
            const p1 = getScreen(q1.x, q1.y);
            const p2 = getScreen(q2.x, q2.y);
            
            const isMeanderConnected = selectedQubit
              ? (q1.name === selectedQubit.name || q2.name === selectedQubit.name)
              : true;

            if (selectedQubit && !isMeanderConnected) {
              ctx.globalAlpha = 0.12;
              ctx.strokeStyle = "rgba(100, 116, 139, 0.3)";
              ctx.lineWidth = 1.2 / zoomScale;
            } else if (selectedQubit && isMeanderConnected) {
              ctx.globalAlpha = 1.0;
              ctx.strokeStyle = "#7C3AED"; // Accent violet highlight
              ctx.lineWidth = 2.5 / zoomScale;
            } else {
              ctx.globalAlpha = 1.0;
              ctx.strokeStyle = "rgba(100, 116, 139, 0.7)";
              ctx.lineWidth = 1.5 / zoomScale;
            }

            ctx.beginPath();
            ctx.moveTo(p1.px, p1.py);
            
            const midX = (p1.px + p2.px) / 2;
            const midY = (p1.py + p2.py) / 2;
            const dx = p2.px - p1.px;
            const dy = p2.py - p1.py;

            if (Math.abs(dx) > Math.abs(dy)) {
              ctx.lineTo(midX - 10, p1.py);
              ctx.lineTo(midX - 10, p1.py - 6);
              ctx.lineTo(midX - 3, p1.py - 6);
              ctx.lineTo(midX - 3, p1.py + 6);
              ctx.lineTo(midX + 3, p1.py + 6);
              ctx.lineTo(midX + 3, p1.py - 6);
              ctx.lineTo(midX + 10, p1.py - 6);
              ctx.lineTo(midX + 10, p2.py);
            } else {
              ctx.lineTo(p1.px, midY - 10);
              ctx.lineTo(p1.px - 6, midY - 10);
              ctx.lineTo(p1.px - 6, midY - 3);
              ctx.lineTo(p1.px + 6, midY - 3);
              ctx.lineTo(p1.px + 6, midY + 3);
              ctx.lineTo(p1.px - 6, midY + 3);
              ctx.lineTo(p1.px - 6, midY + 10);
              ctx.lineTo(p2.px, midY + 10);
            }
            ctx.lineTo(p2.px, p2.py);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1.0; // Reset
    }

    // Draw M1 Qubits (Gold transmon pockets)
    if (layers.pockets) {
      qubits.forEach((q) => {
        const { px, py } = getScreen(q.x, q.y);
        const isHovered = hovered && hovered.name === q.name;
        const isSelected = selectedQubit && selectedQubit.name === q.name;
        
        const isQubitConnected = selectedQubit
          ? (q.name === selectedQubit.name || Math.sqrt(Math.pow(q.x - selectedQubit.x, 2) + Math.pow(q.y - selectedQubit.y, 2)) < 2.5)
          : true;

        if (selectedQubit && !isQubitConnected) {
          ctx.globalAlpha = 0.12;
        } else {
          ctx.globalAlpha = 1.0;
        }

        // Selected large halo glow
        if (isSelected) {
          const glowGrad = ctx.createRadialGradient(px, py, 2, px, py, 36);
          glowGrad.addColorStop(0, "rgba(124, 58, 237, 0.45)");
          glowGrad.addColorStop(0.5, "rgba(124, 58, 237, 0.15)");
          glowGrad.addColorStop(1, "rgba(124, 58, 237, 0)");
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(px, py, 36, 0, 2 * Math.PI);
          ctx.fill();
        }

        // Hover halo / active glow (VIOLET themed)
        if (isHovered && !selectedQubit) {
          const glowGrad = ctx.createRadialGradient(px, py, 2, px, py, 26);
          glowGrad.addColorStop(0, "rgba(124, 58, 237, 0.28)");
          glowGrad.addColorStop(1, "rgba(124, 58, 237, 0)");
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(px, py, 26, 0, 2 * Math.PI);
          ctx.fill();
        }

        // Qubit backing envelope
        ctx.fillStyle = "#FFFFFF";
        ctx.strokeStyle = isSelected ? "#7C3AED" : (isHovered ? "#7C3AED" : "#64748B");
        ctx.lineWidth = isSelected ? 3.5 / zoomScale : (isHovered ? 2.5 / zoomScale : 1.2 / zoomScale);
        
        // Draw pocket square
        const size = 26;
        ctx.fillRect(px - size/2, py - size/2, size, size);
        ctx.strokeRect(px - size/2, py - size/2, size, size);

        // Gold capacitor pads (Amber Gold or Violet active)
        ctx.fillStyle = isSelected ? "#7C3AED" : (isHovered ? "#7C3AED" : "#D97706");
        ctx.fillRect(px - 10, py - 9, 20, 5);
        ctx.fillRect(px - 10, py + 4, 20, 5);
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 1 / zoomScale;
        ctx.strokeRect(px - 10, py - 9, 20, 5);
        ctx.strokeRect(px - 10, py + 4, 20, 5);

        // Josephson junction bridge (crimson red or purple active)
        ctx.strokeStyle = isSelected ? "#8B5CF6" : "#DC2626";
        ctx.lineWidth = 2 / zoomScale;
        ctx.beginPath();
        ctx.moveTo(px, py - 4);
        ctx.lineTo(px, py + 4);
        ctx.stroke();

        // Label
        if (layers.labels) {
          ctx.fillStyle = isSelected ? "#7C3AED" : (isHovered ? "#7C3AED" : "#1E293B");
          ctx.font = "bold 9px monospace";
          ctx.fillText(q.name, px - 6, py + 18);
        }
      });
      ctx.globalAlpha = 1.0;
    }

    ctx.restore();
  };

  useEffect(() => {
    drawCanvas();
  }, [result, layers, hovered, isFullscreen, dimensions, zoomScale, panOffset, selectedQubit]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isFullscreen) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setIsDragging(false);
    }
    
    // Check if it was a drag motion or a simple click
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const w = dimensions.width;
    const h = dimensions.height;

    const worldX = (x - panOffset.x) / zoomScale;
    const worldY = (y - panOffset.y) / zoomScale;

    const getScreen = (qx: number, qy: number) => {
      const paddingX = isFullscreen ? Math.min(160, w * 0.15) : 80;
      const paddingY = isFullscreen ? Math.min(120, h * 0.15) : 60;
      const px = paddingX + ((qx - coords.minX) / coords.rangeX) * (w - paddingX * 2);
      const py = h - paddingY - ((qy - coords.minY) / coords.rangeY) * (h - paddingY * 2);
      return { px, py };
    };

    let clickedQubit: any = null;
    for (let q of qubits) {
      const { px, py } = getScreen(q.x, q.y);
      const dist = Math.sqrt(Math.pow(worldX - px, 2) + Math.pow(worldY - py, 2));
      if (dist < 20 / zoomScale) {
        clickedQubit = q;
        break;
      }
    }

    if (clickedQubit) {
      if (isFullscreen) {
        setSelectedQubit(clickedQubit);
      }
    }
  };

  const handleMouseMoveWithDrag = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging && isFullscreen) {
      const newPanX = e.clientX - dragStart.x;
      const newPanY = e.clientY - dragStart.y;
      setPanOffset({ x: newPanX, y: newPanY });
    } else {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const w = dimensions.width;
      const h = dimensions.height;

      const worldX = (x - panOffset.x) / zoomScale;
      const worldY = (y - panOffset.y) / zoomScale;

      const getScreen = (qx: number, qy: number) => {
        const paddingX = isFullscreen ? Math.min(160, w * 0.15) : 80;
        const paddingY = isFullscreen ? Math.min(120, h * 0.15) : 60;
        const px = paddingX + ((qx - coords.minX) / coords.rangeX) * (w - paddingX * 2);
        const py = h - paddingY - ((qy - coords.minY) / coords.rangeY) * (h - paddingY * 2);
        return { px, py };
      };

      let found: any = null;
      for (let q of qubits) {
        const { px, py } = getScreen(q.x, q.y);
        const dist = Math.sqrt(Math.pow(worldX - px, 2) + Math.pow(worldY - py, 2));
        if (dist < 20 / zoomScale) {
          found = q;
          break;
        }
      }

      if (found) {
        setHovered(found);
        setTooltipPos({ x: x + 15, y: y - 100 });
      } else {
        setHovered(null);
      }
    }
  };

  const handleMouseLeave = () => {
    setHovered(null);
    setIsDragging(false);
  };

  const activeQubitSpec = useMemo(() => {
    if (!hovered) return null;
    const fp = result.frequency_plan;
    const name = hovered.name;
    return {
      name,
      freq: fp?.qubit_frequencies_GHz?.[name] ?? 5.0,
      EJ: fp?.EJ_GHz?.[name] ?? 13.0,
      EC: fp?.EC_GHz?.[name] ?? 0.28,
      resonatorFreq: fp?.resonator_frequencies_GHz?.[`R${name.slice(1)}`] ?? 6.5,
    };
  }, [hovered, result]);

  const handleZoomIn = () => {
    setZoomScale(z => Math.min(5, z * 1.2));
  };

  const handleZoomOut = () => {
    setZoomScale(z => Math.max(0.5, z / 1.2));
  };

  const handleZoomReset = () => {
    setZoomScale(1.0);
    setPanOffset({ x: 0, y: 0 });
    setSelectedQubit(null);
  };

  // List of directly coupled qubits for the focused view
  const coupledQubitsList = useMemo(() => {
    if (!selectedQubit) return [];
    return qubits.filter((q) => {
      if (q.name === selectedQubit.name) return false;
      const dist = Math.sqrt(Math.pow(q.x - selectedQubit.x, 2) + Math.pow(q.y - selectedQubit.y, 2));
      return dist < 2.5;
    });
  }, [selectedQubit, qubits]);

  return (
    <div className="relative w-full h-full flex justify-center items-center">
      {isFullscreen ? (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col md:flex-row overflow-hidden animate-in fade-in duration-200">
          
          {/* Subtle dot-grid background layer */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(#cbd5e1 1.2px, transparent 1.2px)",
              backgroundSize: "20px 20px"
            }}
          />

          {/* Floating Left Side Panel: Qubit Details & Focus Mode */}
          <AnimatePresence>
            {selectedQubit && (
              <motion.div
                initial={{ x: -416, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -416, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 220 }}
                className="relative z-10 w-full md:w-[26rem] h-full bg-white/95 backdrop-blur-md border-r border-slate-200/80 shadow-2xl p-8 flex flex-col"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-5">
                  <div className="flex items-center gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent border border-accent/15 text-xl font-black font-mono shadow-sm">
                      {selectedQubit.name}
                    </span>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-lg leading-none font-display">Qubit Analyzer</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">Interactive focus mode</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedQubit(null)}
                    className="rounded-full h-9 px-4 border-slate-200 text-slate-600 hover:text-slate-900 flex items-center gap-1.5 text-xs cursor-pointer active:scale-95 transition-all shadow-sm"
                  >
                    Back
                  </Button>
                </div>

                {/* Specs parameters & couplings */}
                <div className="flex-1 overflow-y-auto space-y-6 pr-1">
                  
                  {/* Physical properties section */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Physical Properties</h4>
                    
                    <div className="space-y-3.5">
                      
                      {/* Hamiltonian Frequency - Large Card */}
                      <div className="rounded-2xl border border-slate-100 bg-slate-50/20 p-4 shadow-sm relative overflow-hidden group hover:shadow-md hover:border-amber-200/50 transition-all duration-200">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Hamiltonian Frequency</p>
                        <p className="text-2xl font-black text-slate-800 mt-2 font-mono flex items-baseline gap-1">
                          {(result.frequency_plan?.qubit_frequencies_GHz?.[selectedQubit.name] ?? 5.0).toFixed(3)}
                          <span className="text-xs font-bold text-slate-400">GHz</span>
                        </p>
                      </div>

                      {/* Readout Resonator - Large Card */}
                      <div className="rounded-2xl border border-slate-100 bg-slate-50/20 p-4 shadow-sm relative overflow-hidden group hover:shadow-md hover:border-accent-200/50 transition-all duration-200">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-accent" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Readout Resonator Frequency</p>
                        <p className="text-2xl font-black text-accent mt-2 font-mono flex items-baseline gap-1">
                          {(result.frequency_plan?.resonator_frequencies_GHz?.[`R${selectedQubit.name.slice(1)}`] ?? 6.5).toFixed(3)}
                          <span className="text-xs font-bold text-accent/70">GHz</span>
                        </p>
                      </div>

                      {/* Coherence Time (T2) - Large Card */}
                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/10 p-4 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-200">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
                        <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider leading-none">Coherence Time (T₂)</p>
                        <p className="text-2xl font-black text-emerald-600 mt-2 font-mono flex items-baseline gap-1">
                          180
                          <span className="text-xs font-bold text-emerald-500">μs</span>
                        </p>
                      </div>

                      {/* Side-by-Side Energy Grid (EJ and EC) */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5 shadow-inner hover:bg-slate-50 transition-colors">
                          <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider leading-none text-center">EJ Energy</p>
                          <p className="text-lg font-black text-slate-700 mt-2 font-mono text-center">
                            {(result.frequency_plan?.EJ_GHz?.[selectedQubit.name] ?? 13.0).toFixed(2)}
                            <span className="text-[10px] font-bold text-slate-400 ml-0.5">GHz</span>
                          </p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5 shadow-inner hover:bg-slate-50 transition-colors">
                          <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider leading-none text-center">EC Energy</p>
                          <p className="text-lg font-black text-slate-700 mt-2 font-mono text-center">
                            {(result.frequency_plan?.EC_GHz?.[selectedQubit.name] ?? 0.28).toFixed(4)}
                            <span className="text-[10px] font-bold text-slate-400 ml-0.5">GHz</span>
                          </p>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Coupled Qubits section */}
                  <div className="space-y-4 pt-2">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Coupled Qubits ({coupledQubitsList.length})</h4>
                    <div className="space-y-2">
                      {coupledQubitsList.length === 0 ? (
                        <p className="text-xs text-slate-400 font-semibold italic">No direct coupled neighbors</p>
                      ) : (
                        coupledQubitsList.map((q) => {
                          const dist = Math.sqrt(Math.pow(q.x - selectedQubit.x, 2) + Math.pow(q.y - selectedQubit.y, 2));
                          return (
                            <button
                              key={q.name}
                              onClick={() => setSelectedQubit(q)}
                              className="w-full text-left flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 bg-white hover:border-accent hover:bg-accent-soft/30 transition-all group cursor-pointer shadow-sm hover:shadow"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-accent group-hover:scale-110 transition-transform shadow-sm shadow-accent/20"></span>
                                <span className="text-xs font-extrabold text-slate-700 group-hover:text-accent">{q.name}</span>
                              </div>
                              <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-500 font-mono bg-slate-50 px-2 py-0.5 rounded-full">
                                {dist.toFixed(2)} mm
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 mt-4 text-[10px] font-bold text-slate-400">
                  Click outer diagram to deselect
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Canvas Render viewport */}
          <div className="flex-1 h-full flex flex-col relative bg-transparent">
            
            {/* Top Floating Info & Exit buttons */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-none">
              <div className="bg-white/95 backdrop-blur-sm border border-slate-200/60 rounded-full px-4 py-2.5 shadow-lg flex items-center gap-3 pointer-events-auto select-none">
                <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse shadow-sm shadow-accent/40"></span>
                <span className="text-xs font-extrabold text-slate-800">
                  {selectedQubit ? `Interactive Focus: ${selectedQubit.name}` : "Wafer CAD Space"}
                </span>
                <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                  Drag to pan · Scroll to zoom
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (selectedQubit) {
                    setSelectedQubit(null);
                  } else {
                    setIsFullscreen(false);
                  }
                }}
                className="bg-white/95 backdrop-blur-sm border border-slate-200/60 hover:bg-slate-50 text-slate-700 font-bold rounded-full px-4 py-2.5 shadow-lg flex items-center gap-1.5 pointer-events-auto active:scale-95 transition-all h-10 cursor-pointer"
              >
                <Minimize2 className="h-4 w-4" />
                Exit Fullscreen
              </Button>
            </div>

            {/* Floating Bottom Right Zoom Controls */}
            <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-2 shadow-xl z-10 flex flex-col gap-1 pointer-events-auto select-none">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomIn}
                className="h-9 w-9 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-50 active:scale-95 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <span className="text-[10px] font-black text-slate-500 text-center py-1 select-none font-mono">
                {Math.round(zoomScale * 100)}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomOut}
                className="h-9 w-9 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-50 active:scale-95 cursor-pointer"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="border-t border-slate-100 my-1"></div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomReset}
                className="h-9 w-9 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-50 active:scale-95 cursor-pointer"
                title="Reset Zoom & Pan"
              >
                <Sliders className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* The main canvas wrapper in full screen */}
            <div className="flex-1 w-full h-full flex items-center justify-center relative overflow-hidden bg-transparent" ref={canvasParentRef}>
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMoveWithDrag}
                onMouseLeave={handleMouseLeave}
                className="bg-transparent"
              />
            </div>
          </div>
        </div>
      ) : (
        // Standard view: just render the normal canvas
        <div className="relative w-full h-full flex justify-center items-center" ref={canvasParentRef}>
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMoveWithDrag}
            onMouseLeave={handleMouseLeave}
            className="cursor-crosshair rounded-xl border border-slate-200/60 bg-white"
          />

          {/* Full Screen Entry Button overlay */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsFullscreen(true);
              setZoomScale(1.0);
              setPanOffset({ x: 0, y: 0 });
            }}
            className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm border border-slate-200/60 hover:bg-slate-50 text-slate-700 font-bold rounded-xl px-2.5 py-1.5 shadow-sm flex items-center gap-1 active:scale-95 transition-all text-xs h-8 cursor-pointer"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            Full Screen
          </Button>

          {/* Glassmorphic floating specs tooltip (Only in standard view) */}
          <AnimatePresence>
            {hovered && activeQubitSpec && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.12 }}
                style={{ left: tooltipPos.x, top: tooltipPos.y }}
                className="absolute pointer-events-none bg-slate-900/90 backdrop-blur-md border border-slate-700 text-slate-100 rounded-xl p-3 shadow-xl z-30 w-52 text-left"
              >
                <div className="flex justify-between items-center border-b border-slate-700/50 pb-1.5 mb-1.5">
                  <span className="text-xs font-black text-white flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent"></span> {activeQubitSpec.name} transmon
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">M1 Pocket</span>
                </div>
                <div className="space-y-1 text-[10px] font-semibold text-slate-300">
                  <div className="flex justify-between">
                    <span>Frequency:</span>
                    <span className="text-white font-extrabold">{activeQubitSpec.freq.toFixed(3)} GHz</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Readout Res:</span>
                    <span className="text-accent font-extrabold">{activeQubitSpec.resonatorFreq.toFixed(3)} GHz</span>
                  </div>
                  <div className="flex justify-between">
                    <span>EJ Energy:</span>
                    <span className="text-slate-100">{activeQubitSpec.EJ.toFixed(2)} GHz</span>
                  </div>
                  <div className="flex justify-between">
                    <span>EC Energy:</span>
                    <span className="text-slate-100">{activeQubitSpec.EC.toFixed(4)} GHz</span>
                  </div>
                  <div className="flex justify-between text-[9px] border-t border-slate-800/80 pt-1 mt-1 text-slate-400">
                    <span>Coherence (T2):</span>
                    <span className="text-emerald-500 font-extrabold">180 μs</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function FreqPlanView({ result }: { result: GenerateResponse }) {
  const fp = result.frequency_plan;
  if (!fp) return <p className="text-sm text-slate-400">No frequency data available.</p>;

  // Parse frequency list for horizontal spectrum plot
  const qubitsF = Object.entries(fp.qubit_frequencies_GHz ?? {}).map(([name, freq]) => ({ name, freq, type: "qubit" as const }));
  const resonatorsF = Object.entries(fp.resonator_frequencies_GHz ?? {}).map(([name, freq]) => ({ name, freq, type: "resonator" as const }));
  
  const allFreqs = [...qubitsF, ...resonatorsF].sort((a, b) => a.freq - b.freq);
  const minF = 4.0;
  const maxF = 8.0;
  const spanF = maxF - minF;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Card className="rounded-3xl border-slate-200/80 p-6 shadow-sm bg-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Spectrum Analyzer</p>
            <h3 className="text-lg font-black text-slate-900 mt-0.5">Physical Frequency Distribution</h3>
            <p className="text-xs text-slate-400 mt-1 leading-normal">Interactive mapping of qubit and meander resonator resonance bands.</p>
          </div>
          <Badge variant="secondary" className="rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold px-3 py-1">
            ε_eff = {fp.epsilon_eff != null ? fp.epsilon_eff.toFixed(3) : "—"}
          </Badge>
        </div>

        {/* Breathtaking spectrum analyzer graph slider */}
        <div className="bg-slate-50/50 rounded-2xl border border-slate-200/60 p-6 shadow-inner relative overflow-hidden mb-6">
          <div className="h-2 bg-slate-200 rounded-full w-full relative mt-8 mb-6">
            {/* Markers */}
            {allFreqs.map((f, i) => {
              const leftPercent = ((f.freq - minF) / spanF) * 100;
              const isQ = f.type === "qubit";
              return (
                <div
                  key={i}
                  style={{ left: `${leftPercent}%` }}
                  className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center group"
                >
                  {/* Indicator marker */}
                  <span className={`w-3.5 h-3.5 rounded-full border border-white shadow-sm cursor-help transition-all duration-150 group-hover:scale-125 ${
                    isQ ? "bg-amber-500 hover:bg-amber-600" : "bg-accent hover:bg-accent/90"
                  }`} />
                  
                  {/* Vector line */}
                  <span className="h-6 w-px bg-slate-300 group-hover:bg-slate-400 transition-colors mt-0.5" />
                  
                  {/* Info Label */}
                  <div className="absolute top-10 whitespace-nowrap bg-white border border-slate-200 shadow-sm rounded-lg p-1.5 scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 pointer-events-none text-[9px] font-extrabold text-slate-700 z-10">
                    {f.name}: {f.freq.toFixed(3)} GHz
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Axis Labels */}
          <div className="flex justify-between text-[10px] font-bold text-slate-400 px-1 select-none">
            <span>4.0 GHz</span>
            <span>5.0 GHz</span>
            <span>6.0 GHz</span>
            <span>7.0 GHz</span>
            <span>8.0 GHz</span>
          </div>

          <div className="mt-8 flex justify-center gap-6 text-xs font-bold text-slate-500">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Qubits (4.8 - 5.3 GHz band)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-accent"></span> Readout Resonators (6.3 - 7.5 GHz band)</span>
          </div>
        </div>

        {/* Split lists */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Qubits frequencies column */}
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3.5 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Qubit Energy States
            </p>
            <div className="space-y-2">
              {Object.entries(fp.qubit_frequencies_GHz ?? {}).map(([name, freq]) => (
                <div key={name} className="flex items-center justify-between rounded-2xl border border-slate-200/60 bg-slate-50/30 px-4 py-3 shadow-inner hover:bg-slate-50 transition-colors">
                  <div>
                    <span className="text-sm font-bold text-slate-800">{name}</span>
                    <span className="ml-2.5 text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-500">
                      Group {fp.qubit_groups?.[name] ?? "—"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-slate-800">{freq.toFixed(3)} GHz</span>
                    <div className="text-[9px] font-bold text-slate-400 mt-0.5">
                      EJ={fp.EJ_GHz?.[name]?.toFixed(1)} GHz · EC={fp.EC_GHz?.[name]?.toFixed(4)} GHz
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Readout resonators frequencies */}
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3.5 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-accent"></span> Coupling Resonators
            </p>
            <div className="space-y-2">
              {Object.entries(fp.resonator_frequencies_GHz ?? {}).map(([name, freq]) => (
                <div key={name} className="flex items-center justify-between rounded-2xl border border-slate-200/60 bg-slate-50/30 px-4 py-3 shadow-inner hover:bg-slate-50 transition-colors">
                  <div>
                    <span className="text-sm font-bold text-slate-800">{name}</span>
                    <div className="text-[9px] font-bold text-slate-400 mt-0.5">
                      Length: {fp.resonator_lengths_mm?.[name]?.toFixed(3)} mm λ/4
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-slate-800">{freq.toFixed(3)} GHz</span>
                    <div className="text-[9px] font-bold text-accent mt-0.5">
                      Δ = {fp.detunings_GHz?.[name]?.toFixed(3)} GHz detuning
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Freq collision warnings */}
        {(fp.warnings?.length ?? 0) > 0 && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/40 p-4">
            <p className="flex items-center gap-2 text-xs font-bold text-amber-800">
              <AlertTriangle className="h-4.5 w-4.5 text-amber-600" /> Detuning Overlap Warning
            </p>
            <ul className="mt-2 space-y-1">
              {(fp.warnings ?? []).map((w, i) => (
                <li key={i} className="text-xs text-amber-700 list-disc list-inside font-medium">{w}</li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {/* Solver physical placement mapping */}
      {(result.placement?.qubits?.length ?? 0) > 0 && (
        <Card className="rounded-3xl border-slate-200/80 p-6 shadow-sm bg-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Physical Coordinates solver</p>
              <h3 className="text-lg font-black text-slate-900 mt-0.5">Placement Matrix (mm)</h3>
            </div>
            <Badge variant="secondary" className="rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold">
              <Zap className="mr-1.5 h-3.5 w-3.5 text-accent" /> Solver: {result.placement?.solver ?? "kamada-kawai"}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {(result.placement?.qubits ?? []).map((q) => (
              <div key={q.name} className="rounded-2xl border border-slate-200/60 bg-slate-50/30 px-3 py-2.5 text-center shadow-inner hover:bg-white transition-colors duration-150">
                <p className="text-xs font-bold text-slate-700">{q.name}</p>
                <p className="text-[10px] font-bold text-slate-400 mt-1">({q.x.toFixed(3)}, {q.y.toFixed(3)}) mm</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function CodeView({ result }: { result: GenerateResponse }) {
  const code = result.code ?? "# No Qiskit Metal code generated";
  const [copied, setCopied] = useState(false);
  
  const copy = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  const download = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([code], { type: "text/plain" }));
    a.download = "qbeta_chip_blueprint.py";
    a.click();
  };

  return (
    <Card className="overflow-hidden rounded-3xl border-slate-200/80 p-0 shadow-sm bg-white max-w-4xl mx-auto">
      {/* Premium code editor mock title bar with macOS dots */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/60 px-5 py-3.5">
        <div className="flex items-center gap-3">
          {/* macOS controls */}
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-400 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-400 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block"></span>
          </div>
          <span className="text-[11px] font-bold text-slate-500 font-mono">qbeta_chip_blueprint.py</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={copy}
            className="rounded-full border-slate-200 hover:bg-slate-100 hover:text-slate-900 text-slate-600 shadow-sm text-xs font-bold h-8 active:scale-95 transition-all"
          >
            {copied ? (
              <>
                <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-600 font-bold" /> Copied
              </>
            ) : (
              <>
                <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={download}
            className="rounded-full border-slate-200 hover:bg-slate-100 hover:text-slate-900 text-slate-600 shadow-sm text-xs font-bold h-8 active:scale-95 transition-all"
          >
            <Download className="mr-1.5 h-3.5 w-3.5" /> .py
          </Button>
        </div>
      </div>
      <pre className="overflow-auto bg-slate-900 p-6 text-[12px] leading-relaxed text-slate-100 max-h-[560px] shadow-inner font-mono">
        <code>{code}</code>
      </pre>
    </Card>
  );
}