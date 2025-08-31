import React, { useRef, useLayoutEffect, useState, useMemo } from 'react';
import type { Person } from '../types';
import { hierarchy, tree, HierarchyPointNode } from 'd3-hierarchy';
import { select } from 'd3-selection';
import { zoom } from 'd3-zoom';
import { linkHorizontal } from 'd3-shape';
import { EditIcon, UserIcon } from './Icons';
import { getGeneration, getGenerationName, generationBackgroundColors } from '../services/familyTreeService';

type TreeNode = {
  type: 'person' | 'marriage';
  person?: Person;
  partner?: Person;
  children?: TreeNode[];
};

const PersonCard: React.FC<{ p: Person; onEdit: (p: Person) => void; offsetX: number }> = ({ p, onEdit, offsetX }) => {
  const nodeWidth = 240;
  const nodeHeight = 80;
  const generation = getGeneration(p.code);
  const c = generation > 0 ? generationBackgroundColors[(generation - 1) % generationBackgroundColors.length] : '#FFFFFF';
  const partnerStyle = p.code.endsWith('x');

  return (
    <g transform={`translate(${offsetX},0)`} className="cursor-pointer" onClick={() => onEdit(p)}>
      <rect
        width={nodeWidth}
        height={nodeHeight}
        x={-nodeWidth / 2}
        y={-nodeHeight / 2}
        rx="10"
        ry="10"
        fill={partnerStyle ? "#FAF0CA" : c}
        stroke={partnerStyle ? "#F4D35E" : "#0D3B66"}
        strokeWidth="2"
      />
      <foreignObject x={-nodeWidth/2} y={-nodeHeight/2} width={nodeWidth} height={nodeHeight}>
        <div className="w-full h-full flex items-center p-2 text-left">
          <div className="w-16 h-16 rounded-full bg-white/50 flex-shrink-0 flex items-center justify-center overflow-hidden mr-3 border-2 border-white/80">
            {p.photoUrl ? <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" /> : <UserIcon className="w-12 h-12 text-gray-500" />}
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
          <EditIcon className="w-4 h-4 ml-2 text-gray-600" />
        </div>
      </foreignObject>
    </g>
  );
};

const Node: React.FC<{ node: HierarchyPointNode<TreeNode>; onEdit: (p: Person) => void; }> = ({ node, onEdit }) => {
  const { x, y, data } = node;

  if (data.type === 'person' && data.person) {
    return (
      <g transform={`translate(${y},${x})`}>
        <PersonCard p={data.person} onEdit={onEdit} offsetX={0} />
      </g>
    );
  }

  if (data.type === 'marriage' && data.person && data.partner) {
    const nodeWidth = 240;
    const gap = 18;
    return (
      <g transform={`translate(${y},${x})`}>
        <PersonCard p={data.person} onEdit={onEdit} offsetX={-(nodeWidth/2 + gap/2)} />
        <PersonCard p={data.partner} onEdit={onEdit} offsetX={(nodeWidth/2 + gap/2)} />
        <line
          x1={-(nodeWidth/2 - 6)} y1={0}
          x2={(nodeWidth/2 + gap - 6)} y2={0}
          stroke="#0D3B66" strokeWidth={2}
        />
      </g>
    );
  }

  return null;
};

export const TreeView: React.FC<{ people: Person[]; onEdit: (p: Person) => void; }> = ({ people, onEdit }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);

  const hierarchyData = useMemo(() => {
    if (people.length === 0) return null;

    const map: Map<string, Person> = new Map(people.map(p => [p.id, p]));
    const roots: TreeNode[] = [];

    const marriageNodes: TreeNode[] = [];
    const attachedChildren: Set<string> = new Set();

    people.forEach(p => {
      if (p.partnerId) {
        const partner = map.get(p.partnerId);
        if (partner && partner.partnerId === p.id) {
          // Prüfen, ob Ehe-Knoten schon existiert
          if (!marriageNodes.find(m =>
            (m.person?.id === p.id && m.partner?.id === partner.id) ||
            (m.person?.id === partner.id && m.partner?.id === p.id))) {
            marriageNodes.push({ type: 'marriage', person: p, partner: partner, children: [] });
          }
        }
      }
    });

    // Kinder an Ehe-Knoten hängen
    people.forEach(child => {
      if (child.parentId) {
        const parent = map.get(child.parentId);
        if (parent) {
          const marriage = marriageNodes.find(m => m.person?.id === parent.id || m.partner?.id === parent.id);
          if (marriage) {
            marriage.children!.push({ type: 'person', person: child });
            attachedChildren.add(child.id);
          }
        }
      }
    });

    // Roots bestimmen
    people.forEach(p => {
      const isChild = attachedChildren.has(p.id);
      const isPartner = marriageNodes.some(m => m.person?.id === p.id || m.partner?.id === p.id);
      if (!p.parentId && !isChild) {
        if (isPartner) {
          const marriage = marriageNodes.find(m => m.person?.id === p.id || m.partner?.id === p.id);
          if (marriage && !roots.includes(marriage)) roots.push(marriage);
        } else {
          roots.push({ type: 'person', person: p });
        }
      }
    });

    const progenitor = roots.find(r => r.type === 'person' && r.person?.code === '1') || roots[0];
    if (!progenitor) return null;

    return hierarchy(progenitor);
  }, [people]);

  const treeLayout = useMemo(() => {
    if (!hierarchyData) return null;
    return tree<TreeNode>().nodeSize([120, 300])(hierarchyData);
  }, [hierarchyData]);

  const [viewBox, setViewBox] = useState('0 0 1000 800');

  useLayoutEffect(() => {
    if (!svgRef.current || !gRef.current) return;

    const svg = select(svgRef.current);
    const g = select(gRef.current);

    const handleZoom = zoom<SVGSVGElement, unknown>().scaleExtent([0.3, 2]).on('zoom', (event) => {
      g.attr('transform', event.transform);
    });

    svg.call(handleZoom as any);

    const initialTransform = `translate(${500}, ${400}) scale(0.8)`;
    g.attr('transform', initialTransform);
    setViewBox('0 0 1000 800');

    return () => {
      svg.on('.zoom', null);
    };
  }, []);

  if (!treeLayout) {
    return <div className="text-gray-600 italic p-4">Keine Daten vorhanden.</div>;
  }

  const nodes = treeLayout.descendants();
  const links = treeLayout.links();

  const linkPathGenerator = linkHorizontal<any, HierarchyPointNode<TreeNode>>()
    .x(d => d.y)
    .y(d => d.x);

  return (
    <div className="bg-white p-2 rounded-lg shadow-lg animate-fade-in w-full h-[70vh]">
      <svg ref={svgRef} width="100%" height="100%" viewBox={viewBox}>
        <g ref={gRef}>
          <g fill="none" stroke="#999" strokeOpacity="0.6" strokeWidth="1.5">
            {links.map((link, i) => (
              <path key={i} d={linkPathGenerator({ source: link.source, target: link.target }) || ''} />
            ))}
          </g>

          {nodes.map((node, idx) => (
            <Node key={idx} node={node} onEdit={onEdit} />
          ))}
        </g>
      </svg>
      <div className="px-2 py-1 text-xs text-gray-700">
        <span className="font-semibold">Stammeltern</span> · {getGenerationName(1)} – Partner werden nebeneinander angezeigt.
      </div>
    </div>
  );
};
