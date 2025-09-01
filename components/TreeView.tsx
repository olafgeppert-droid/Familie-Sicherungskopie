// src/components/TreeView.tsx
import React, { useRef, useLayoutEffect, useState, useMemo } from 'react';
import type { Person } from '../types';
import { hierarchy, tree, HierarchyPointNode } from 'd3-hierarchy';
import { select } from 'd3-selection';
import { zoom } from 'd3-zoom';
import { linkHorizontal } from 'd3-shape';
import { UserIcon } from './Icons';
import { getGeneration, getGenerationName, generationBackgroundColors } from '../services/familyTreeService';

type Unit = {
  id: string;
  persons: Person[];        // 1 oder 2 Personen (Partner)
  children: Unit[];
};

type TreeNode = Unit;

const NODE_WIDTH = 210;
const NODE_HEIGHT = 78;
const PARTNER_GAP = 16;

const Card: React.FC<{ p: Person; onClick: (p: Person) => void; offsetX?: number }> = ({ p, onClick, offsetX = 0 }) => {
  const g = getGeneration(p.code);
  const c = g > 0 ? generationBackgroundColors[(g - 1) % generationBackgroundColors.length] : '#FFFFFF';
  const partnerStyle = p.code.endsWith('x');

  return (
    <g transform={`translate(${offsetX},0)`} className="cursor-pointer" onClick={() => onClick(p)}>
      <rect
        width={NODE_WIDTH}
        height={NODE_HEIGHT}
        x={-NODE_WIDTH / 2}
        y={-NODE_HEIGHT / 2}
        rx="10"
        ry="10"
        fill={partnerStyle ? "#FAF0CA" : c}
        stroke={partnerStyle ? "#F4D35E" : "#0D3B66"}
        strokeWidth={2}
      />
      <foreignObject x={-NODE_WIDTH / 2} y={-NODE_HEIGHT / 2} width={NODE_WIDTH} height={NODE_HEIGHT}>
        <div className="w-full h-full flex items-center p-2 text-left">
          <div className="w-14 h-14 rounded-full bg-white/50 flex-shrink-0 flex items-center justify-center overflow-hidden mr-3 border-2 border-white/80">
            {p.photoUrl ? <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" /> : <UserIcon className="w-10 h-10 text-gray-500" />}
          </div>
          <div className="flex-grow overflow-hidden">
            <div className="text-sm font-bold truncate" style={{ color: "#0D3B66" }} title={`${p.code} / ${p.name}`}>
              {p.hasRing && <span className="mr-1" title="Ringbesitzer" style={{ textShadow: '0 0 3px gold' }}>💍</span>}
              {p.code} / {p.name}
            </div>
            <div className="text-xs text-gray-700 mt-1">
              * {p.birthDate ? new Date(p.birthDate).toLocaleDateString('de-DE') : '?'}
              {p.deathDate ? ` † ${new Date(p.deathDate).toLocaleDateString('de-DE')}` : ''}
            </div>
          </div>
        </div>
      </foreignObject>
    </g>
  );
};

const UnitNode: React.FC<{ node: HierarchyPointNode<TreeNode>; onEdit: (p: Person) => void; }> = ({ node, onEdit }) => {
  const { x, y, data } = node;
  const hasTwo = data.persons.length === 2;

  const leftOffset = hasTwo ? -(NODE_WIDTH/2 + PARTNER_GAP/2) : 0;
  const rightOffset = hasTwo ? (NODE_WIDTH/2 + PARTNER_GAP/2) : 0;

  return (
    <g transform={`translate(${y},${x})`}>
      {data.persons.length === 1 && (
        <Card p={data.persons[0]} onClick={onEdit} offsetX={0} />
      )}
      {data.persons.length === 2 && (
        <>
          <Card p={data.persons[0]} onClick={onEdit} offsetX={leftOffset} />
          <Card p={data.persons[1]} onClick={onEdit} offsetX={rightOffset} />
          <line
            x1={leftOffset + NODE_WIDTH/2 - 10}
            y1={0}
            x2={rightOffset - NODE_WIDTH/2 + 10}
            y2={0}
            stroke="#0D3B66"
            strokeWidth={2}
          />
        </>
      )}
    </g>
  );
};

export const TreeView: React.FC<{ people: Person[]; onEdit: (p: Person) => void; }> = ({ people, onEdit }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);

  const forest = useMemo(() => {
    if (!people || people.length === 0) return null;

    const byId = new Map<string, Person>(people.map(p => [p.id, p]));

    const paired = new Set<string>();
    const unitsById = new Map<string, Unit>();

    const makeUnitIdForPair = (a: Person, b: Person) => {
      const [id1, id2] = [a.id, b.id].sort();
      return `u-${id1}-${id2}`;
    };

    // Paare bilden (nur bei beidseitiger Verlinkung)
    people.forEach(p => {
      if (!p.partnerId) return;
      const partner = byId.get(p.partnerId);
      if (!partner) return;
      if (partner.partnerId !== p.id) return;
      const uid = makeUnitIdForPair(p, partner);
      if (unitsById.has(uid)) return;
      // Person ohne 'x' links, Partner mit 'x' rechts
      const leftFirst = p.code.endsWith('x') ? partner : p;
      const rightSecond = p.code.endsWith('x') ? p : partner;
      unitsById.set(uid, { id: uid, persons: [leftFirst, rightSecond], children: [] });
      paired.add(p.id);
      paired.add(partner.id);
    });

    // Singles hinzufügen
    people.forEach(p => {
      if (paired.has(p.id)) return;
      const uid = `u-${p.id}`;
      unitsById.set(uid, { id: uid, persons: [p], children: [] });
    });

    const unitOfPerson = (pid: string): Unit | undefined => {
      const direct = unitsById.get(`u-${pid}`);
      if (direct) return direct;
      for (const u of unitsById.values()) {
        if (u.persons.some(pp => pp.id === pid)) return u;
      }
      return undefined;
    };

    // Kanten (Eltern → Kinder) auf Unit-Ebene
    const hasParent = new Map<string, boolean>();
    for (const u of unitsById.values()) hasParent.set(u.id, false);

    people.forEach(p => {
      if (!p.parentId) return;
      const parentUnit = unitOfPerson(p.parentId);
      const childUnit = unitOfPerson(p.id);
      if (!parentUnit || !childUnit) return;
      parentUnit.children.push(childUnit);
      hasParent.set(childUnit.id, true);
    });

    // Wurzeln (können mehrere sein)
    const roots: Unit[] = [];
    for (const u of unitsById.values()) {
      if (!hasParent.get(u.id)) roots.push(u);
    }

    // Pseudo-Root, damit d3.tree mit einem Baum arbeiten kann
    const pseudoRoot: Unit = { id: 'root', persons: [], children: roots };

    return hierarchy<TreeNode>(pseudoRoot);
  }, [people]);

  const layout = useMemo(() => {
    if (!forest) return null;

    // Mehr vertikaler/horizontaler Abstand gegen Überlappungen
    const vertical = NODE_HEIGHT + 90;               // vorher: +60
    const horizontal = NODE_WIDTH + PARTNER_GAP + 180; // ausreichend Platz für Paare

    const t = tree<TreeNode>()
      .nodeSize([vertical, horizontal])
      .separation((a, b) => {
        // Paare (2 Karten) brauchen mehr seitlichen Abstand als Singles
        const aw = a.data.persons.length === 2 ? 2 : 1;
        const bw = b.data.persons.length === 2 ? 2 : 1;

        // Etwas mehr Abstand zwischen nicht-Geschwistern
        const sameParent = a.parent && b.parent && a.parent === b.parent;
        const base = (aw + bw) / 2;
        return sameParent ? base : base + 0.5;
      });

    return t(forest);
  }, [forest]);

  const [viewBox, setViewBox] = useState('0 0 1000 800');

  useLayoutEffect(() => {
    if (!layout || !svgRef.current || !gRef.current) return;
    const svg = select(svgRef.current);
    const g = select(gRef.current);

    // Alles in den ViewBox-Rahmen packen
    const { x, y, width, height } = (g.node() as SVGGElement).getBBox();
    const pad = 140;
    setViewBox(`${x - pad} ${y - pad - 90} ${width + pad * 2} ${height + pad * 2 + 90}`);

    // Zoom & Pan
    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 2.2])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoomBehavior as any);

    return () => { svg.on('.zoom', null); };
  }, [layout]);

  if (!layout) {
    return <div className="text-gray-600 italic p-4">Keine Daten vorhanden.</div>;
  }

  const nodes = layout.descendants().filter(n => n.data.id !== 'root');
  const links = layout.links().filter(l => l.source.data.id !== 'root');

  const linkPath = linkHorizontal<any, HierarchyPointNode<TreeNode>>()
    .x(d => d.y)
    .y(d => d.x);

  // Generations-Header (Spaltenüberschriften) vorbereiten
  const generationY: Record<number, number> = {};
  nodes.forEach(n => {
    if (!n.data.persons.length) return;
    const g = getGeneration(n.data.persons[0].code);
    if (!(g in generationY)) generationY[g] = n.y;
    else generationY[g] = Math.min(generationY[g], n.y);
  });
  const headers = Object.entries(generationY)
    .map(([g, y]) => ({ gen: parseInt(g, 10), y }))
    .sort((a, b) => a.y - b.y);

  return (
    <div className="bg-white p-2 rounded-lg shadow-lg animate-fade-in w-full h-[70vh]">
      <svg ref={svgRef} width="100%" height="100%" viewBox={viewBox}>
        <g ref={gRef}>
          {/* Vertikale Hilfslinien je Generation (dezent) */}
          {headers.map((h, i) => (
            <line
              key={`vline-${i}`}
              x1={h.y}
              y1={-9999}
              x2={h.y}
              y2={9999}
              stroke="#E5E7EB"
              strokeDasharray="6 6"
              strokeWidth={1}
              opacity={0.7}
              pointerEvents="none"
            />
          ))}

          {/* Verbindungslinien */}
          <g fill="none" stroke="#9AA6B2" strokeOpacity={0.85} strokeWidth={1.5}>
            {links.map((l, i) => (
              <path key={i} d={linkPath({ source: l.source, target: l.target }) || ''} />
            ))}
          </g>

          {/* Generation-Überschriften */}
          {headers.map((h, i) => (
            <g key={`hdr-${i}`} transform={`translate(${h.y},-60)`} pointerEvents="none">
              <text
                x={0}
                y={0}
                textAnchor="middle"
                fontWeight="bold"
                fontSize="16"
                fill="#0D3B66"
              >
                {getGenerationName(h.gen)}
              </text>
            </g>
          ))}

          {/* Knoten */}
          {nodes.map((n, i) => (
            <UnitNode key={i} node={n as HierarchyPointNode<TreeNode>} onEdit={onEdit} />
          ))}
        </g>
      </svg>
    </div>
  );
};
