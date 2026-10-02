import { useEffect, useMemo, useRef, useState } from 'react';
import { Background, Handle, MarkerType, Position, ReactFlow, type Node, type NodeProps, type ReactFlowInstance } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './architecture.css';
import { text, views, type Locale, type Mode, type Step } from './model';

type Data = { step: Step; locale: Locale };
type ArchitectureNode = Node<Data, 'architecture'>;
const sides = { top: Position.Top, right: Position.Right, bottom: Position.Bottom, left: Position.Left };
function ArchitectureNodeView({ data }: NodeProps<ArchitectureNode>) {
  return <>
    {Object.entries(sides).map(([side, position]) => <span key={side}>
      <Handle id={`in-${side}`} type="target" position={position} isConnectable={false}/>
      <Handle id={`out-${side}`} type="source" position={position} isConnectable={false}/>
    </span>)}
    <Handle id="in-top-right" type="target" position={Position.Top} style={{ left: '80%' }} isConnectable={false}/>
    <span className="architecture-node-owner">{text(data.step.owner, data.locale)}</span>
    <strong>{text(data.step.title, data.locale)}</strong>
    <span className="architecture-node-summary">{text(data.step.summary, data.locale)}</span>
  </>;
}
const nodeTypes = { architecture: ArchitectureNodeView };

export default function ArchitectureFlow({ locale }: { locale: Locale }) {
  const cn = locale === 'cn';
  const [mode, setMode] = useState<Mode>('render');
  const [selected, setSelected] = useState(views.render.start);
  const [api, setApi] = useState<ReactFlowInstance<ArchitectureNode> | null>(null);
  const [mobile, setMobile] = useState(false);
  const [panning, setPanning] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const canvas = useRef<HTMLDivElement>(null);
  const view = views[mode];
  const step = view.steps.find(item => item.id === selected) ?? view.steps[0];
  const nodes: ArchitectureNode[] = useMemo(() => view.steps.map(item => ({
    id: item.id, type: 'architecture', position: item.position,
    data: { step: item, locale }, width: 250, height: 104,
    selected: item.id === selected,
    ariaLabel: `${text(item.title, locale)} — ${text(item.owner, locale)}`,
  })), [view, locale, selected]);
  const edges = useMemo(() => view.links.map((link, i) => ({
    id: `${mode}-${i}`, source: link.from, target: link.to, type: 'smoothstep',
    sourceHandle: `out-${link.fromSide ?? 'bottom'}`, targetHandle: `in-${link.toSide ?? 'top'}`,
    label: text(link.label, locale),
    markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--accent)' },
    markerStart: link.both ? { type: MarkerType.ArrowClosed, color: 'var(--accent)' } : undefined,
    className: link.ownership ? 'architecture-ownership-edge' : '',
    style: { stroke: 'var(--accent)', strokeWidth: 1.6 },
    labelStyle: { fill: 'var(--text)', fontSize: 13 },
    labelBgStyle: { fill: 'var(--surface)' }, labelBgPadding: [6, 4] as [number, number],
  })), [view, mode, locale]);

  useEffect(() => {
    const syncTheme = () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!canvas.current) return;
    const observer = new ResizeObserver(([entry]) => setMobile(entry.contentRect.width < 600));
    observer.observe(canvas.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!api) return;
    const frame = requestAnimationFrame(() => {
      const first = views[mode].steps.find(item => item.id === views[mode].start)!;
      if (mobile) void api.setCenter(first.position.x + 125, first.position.y + 52, { zoom: 1 });
      else void api.fitView({ padding: 0.12, maxZoom: 1 });
    });
    return () => cancelAnimationFrame(frame);
  }, [api, mode, mobile]);

  function choose(id: string) {
    setSelected(id);
    const next = view.steps.find(item => item.id === id)!;
    void api?.setCenter(next.position.x + 125, next.position.y + 52, { zoom: 1 });
  }
  function pan(x: number, y: number) {
    if (!api) return;
    const current = api.getViewport();
    void api.setViewport({ ...current, x: current.x + x, y: current.y + y });
  }
  const instruction = cn
    ? '选择节点查看职责。开启“移动图”后拖动；滚轮仍滚动页面。聚焦画布后可用方向键平移。“全图”显示整体关系，“定位节点”恢复清晰的节点视图。'
    : 'Select a node to read its role. Enable Move graph to drag; the wheel still scrolls the page. Focus the canvas and use arrow keys to pan. Fit view shows the whole map; Focus a node restores readable detail.';

  return <section className="architecture-explorer" id="architecture-explorer" aria-labelledby="architecture-title" data-architecture-mode={mode}>
    <div className="architecture-heading"><div><span className="eyebrow">{cn ? '交互式架构图' : 'INTERACTIVE ARCHITECTURE'}</span><h2 id="architecture-title">{cn ? '沿着一条路径，理解各层职责。' : 'Follow a path. See who owns each step.'}</h2></div><p>{cn ? '源码中的逻辑关系示意，不连接运行中的应用或账户。' : 'A map of the implementation, not a connection to a live app or account.'}</p></div>
    <div className="architecture-modes" role="group" aria-label={cn ? '架构视图' : 'Architecture view'}>
      {(['render', 'agents'] as const).map(value => <button type="button" key={value} aria-pressed={mode === value} onClick={() => { setMode(value); setSelected(views[value].start); }}>{text(views[value].title, locale)}</button>)}
    </div>
    <p className="architecture-intro">{text(view.intro, locale)}</p>
    <div className="architecture-toolbar">
      <div className="architecture-select"><label htmlFor="architecture-focus">{cn ? '定位节点' : 'Focus a node'}</label><select id="architecture-focus" value={step.id} onChange={event => choose(event.target.value)}>{view.steps.map(item => <option key={item.id} value={item.id}>{text(item.title, locale)}</option>)}</select></div>
      <div className="architecture-tools" role="group" aria-label={cn ? '图形控制' : 'Graph controls'}>
        <button type="button" onClick={() => void api?.zoomIn()} aria-label={cn ? '放大' : 'Zoom in'}>+</button>
        <button type="button" onClick={() => void api?.zoomOut()} aria-label={cn ? '缩小' : 'Zoom out'}>−</button>
        <button type="button" onClick={() => void api?.fitView({ padding: 0.12, maxZoom: 1 })}>{cn ? '全图' : 'Fit view'}</button>
        <button type="button" aria-pressed={panning} onClick={() => setPanning(value => !value)}>{cn ? '移动图' : 'Move graph'}</button>
        <span className="architecture-zoom" aria-label={cn ? '缩放比例' : 'Zoom level'}>{Math.round(zoom * 100)}%</span>
      </div>
    </div>
    <p className="architecture-help" id="architecture-help">{instruction}</p>
    <div className={`architecture-canvas${panning ? ' can-pan' : ''}`} ref={canvas} role="region" aria-label={cn ? '架构画布' : 'Architecture canvas'} aria-describedby="architecture-help" tabIndex={0}
      onKeyDown={event => {
        if (event.target !== event.currentTarget) return;
        const directions: Record<string, [number, number]> = { ArrowLeft: [70, 0], ArrowRight: [-70, 0], ArrowUp: [0, 70], ArrowDown: [0, -70] };
        if (directions[event.key]) { event.preventDefault(); pan(...directions[event.key]); }
      }}>
      <ReactFlow<ArchitectureNode> nodes={nodes} edges={edges} nodeTypes={nodeTypes} onInit={setApi}
        onNodesChange={changes => { const choice = changes.find(change => change.type === 'select' && change.selected); if (choice?.type === 'select') setSelected(choice.id); }}
        onNodeClick={(_, node) => setSelected(node.id)} onMove={(_, viewport) => setZoom(viewport.zoom)}
        nodesDraggable={false} nodesConnectable={false} edgesFocusable={false} edgesReconnectable={false}
        deleteKeyCode={null} selectionKeyCode={null} multiSelectionKeyCode={null}
        minZoom={0.2} maxZoom={1.6} panOnDrag={panning} panOnScroll={false}
        zoomOnScroll={false} zoomOnPinch={panning} zoomOnDoubleClick={false} preventScrolling={false}
        colorMode={theme} attributionPosition="bottom-right"
        ariaLabelConfig={{
          'node.a11yDescription.default': cn ? '按 Enter 或空格查看节点详情。节点位置固定。' : 'Press Enter or Space to read node details. Node positions are fixed.',
          'node.a11yDescription.keyboardDisabled': cn ? '按 Enter 或空格查看节点详情。' : 'Press Enter or Space to read node details.',
        }}>
        <Background gap={24} size={1} color="var(--line)"/>
      </ReactFlow>
    </div>
    <div className="architecture-legend"><span>{cn ? '实线：执行或请求路径' : 'Solid: execution or request path'}</span><span>{cn ? '双箭头：请求与应答' : 'Two arrows: request and reply'}</span>{mode === 'agents' && <span>{cn ? '虚线：运行时归属' : 'Dashed: runtime ownership'}</span>}</div>
    <div className="architecture-detail" aria-live="polite" aria-atomic="true" data-node-detail={step.id}>
      <div><span className="eyebrow">{text(step.owner, locale)}</span><h3>{text(step.title, locale)}</h3></div>
      <p>{text(step.detail, locale)}</p><a href={step.source}>{cn ? '阅读对应源码导读 ↗' : 'Read the source walkthrough ↗'}</a>
    </div>
    <details className="architecture-text"><summary>{cn ? '文字版：两条路径与各节点职责' : 'Text version: both paths and their responsibilities'}</summary>
      {(['render', 'agents'] as const).map(value => <div key={value}><h3>{text(views[value].title, locale)}</h3><p>{text(views[value].intro, locale)}</p><ol>{views[value].steps.map(item => <li key={item.id}><strong>{text(item.title, locale)}</strong> — {text(item.detail, locale)}</li>)}</ol><ul>{views[value].links.map((link, i) => <li key={i}>{text(views[value].steps.find(item => item.id === link.from)!.title, locale)} {link.both ? '↔' : '→'} {text(views[value].steps.find(item => item.id === link.to)!.title, locale)}: {text(link.label, locale)}</li>)}</ul></div>)}
    </details>
  </section>;
}
