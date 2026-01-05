'use client';

import { useState, useEffect, useRef } from 'react';

interface DreamEntry {
  id: string;
  title?: string;
  text: string;
  date: string;
  tags?: string[];
  autoTags?: string[];
}

interface DreamWebProps {
  dreams: DreamEntry[];
  onDreamClick?: (dream: DreamEntry) => void;
  language?: 'en' | 'ko';
}

interface Node {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  dream: DreamEntry;
  connections: number;
}

interface Edge {
  source: string;
  target: string;
  strength: number;
}

const translations = {
  en: {
    title: 'Dream Web',
    subtitle: 'Discover connections between your dreams',
    noDreams: 'Record at least 3 dreams to see connections',
    commonThemes: 'Common Themes',
    connections: 'connections',
    clickToExplore: 'Click on dreams to explore',
    strongConnection: 'Strong connection',
    mediumConnection: 'Medium connection',
    weakConnection: 'Weak connection'
  },
  ko: {
    title: '꿈 연결망',
    subtitle: '당신의 꿈들 사이의 연결을 발견하세요',
    noDreams: '최소 3개의 꿈을 기록하면 연결망을 볼 수 있습니다',
    commonThemes: '공통 테마',
    connections: '개 연결',
    clickToExplore: '꿈을 클릭해서 탐색하세요',
    strongConnection: '강한 연결',
    mediumConnection: '중간 연결',
    weakConnection: '약한 연결'
  }
};

// Calculate similarity between two dreams based on tags
function calculateSimilarity(dream1: DreamEntry, dream2: DreamEntry): number {
  const tags1 = new Set([...(dream1.autoTags || []), ...(dream1.tags || [])].map(t => t.toLowerCase()));
  const tags2 = new Set([...(dream2.autoTags || []), ...(dream2.tags || [])].map(t => t.toLowerCase()));

  if (tags1.size === 0 || tags2.size === 0) return 0;

  const intersection = new Set([...tags1].filter(t => tags2.has(t)));
  const union = new Set([...tags1, ...tags2]);

  return intersection.size / union.size;
}

export default function DreamWeb({
  dreams,
  onDreamClick,
  language = 'ko'
}: DreamWebProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const t = translations[language];

  // Initialize nodes and edges
  useEffect(() => {
    if (dreams.length < 3) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.width;
    const height = canvas.height;

    // Create nodes
    const newNodes: Node[] = dreams.map((dream, i) => {
      const angle = (i / dreams.length) * Math.PI * 2;
      const radius = Math.min(width, height) * 0.3;
      return {
        id: dream.id,
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        dream,
        connections: 0
      };
    });

    // Create edges based on similarity
    const newEdges: Edge[] = [];
    for (let i = 0; i < dreams.length; i++) {
      for (let j = i + 1; j < dreams.length; j++) {
        const similarity = calculateSimilarity(dreams[i], dreams[j]);
        if (similarity > 0.2) { // Only show connections above threshold
          newEdges.push({
            source: dreams[i].id,
            target: dreams[j].id,
            strength: similarity
          });
          newNodes[i].connections++;
          newNodes[j].connections++;
        }
      }
    }

    setNodes(newNodes);
    setEdges(newEdges);
  }, [dreams]);

  // Physics simulation
  useEffect(() => {
    if (nodes.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const simulate = () => {
      // Apply forces
      const newNodes = nodes.map(node => ({ ...node }));

      // Repulsion between nodes
      for (let i = 0; i < newNodes.length; i++) {
        for (let j = i + 1; j < newNodes.length; j++) {
          const dx = newNodes[j].x - newNodes[i].x;
          const dy = newNodes[j].y - newNodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > 0) {
            const force = 500 / (dist * dist);
            newNodes[i].vx -= (dx / dist) * force;
            newNodes[i].vy -= (dy / dist) * force;
            newNodes[j].vx += (dx / dist) * force;
            newNodes[j].vy += (dy / dist) * force;
          }
        }
      }

      // Attraction along edges
      edges.forEach(edge => {
        const source = newNodes.find(n => n.id === edge.source);
        const target = newNodes.find(n => n.id === edge.target);
        if (!source || !target) return;

        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
          const force = (dist - 150) * 0.01 * edge.strength;
          source.vx += (dx / dist) * force;
          source.vy += (dy / dist) * force;
          target.vx -= (dx / dist) * force;
          target.vy -= (dy / dist) * force;
        }
      });

      // Center attraction
      newNodes.forEach(node => {
        const dx = width / 2 - node.x;
        const dy = height / 2 - node.y;
        node.vx += dx * 0.001;
        node.vy += dy * 0.001;
      });

      // Update positions
      newNodes.forEach(node => {
        node.x += node.vx;
        node.y += node.vy;
        node.vx *= 0.85; // Damping
        node.vy *= 0.85;

        // Boundary
        const padding = 50;
        if (node.x < padding) node.x = padding;
        if (node.x > width - padding) node.x = width - padding;
        if (node.y < padding) node.y = padding;
        if (node.y > height - padding) node.y = height - padding;
      });

      setNodes(newNodes);

      // Render
      ctx.clearRect(0, 0, width, height);

      // Draw edges
      edges.forEach(edge => {
        const source = newNodes.find(n => n.id === edge.source);
        const target = newNodes.find(n => n.id === edge.target);
        if (!source || !target) return;

        const isHighlighted = selectedNode === edge.source || selectedNode === edge.target;

        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = isHighlighted
          ? `rgba(127, 176, 105, ${edge.strength})`
          : `rgba(209, 213, 219, ${edge.strength * 0.5})`;
        ctx.lineWidth = edge.strength * 3;
        ctx.stroke();
      });

      // Draw nodes
      newNodes.forEach(node => {
        const isSelected = selectedNode === node.id;
        const isHovered = hoveredNode === node.id;
        const nodeSize = 8 + node.connections * 2;

        // Node circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeSize, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? '#7FB069' : isHovered ? '#A8D5A8' : '#E5E7EB';
        ctx.fill();
        ctx.strokeStyle = isSelected || isHovered ? '#7FB069' : '#D1D5DB';
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.stroke();

        // Label
        if (isSelected || isHovered) {
          const label = node.dream.title || node.dream.text.substring(0, 30) + '...';
          ctx.font = '12px S-CoreDream, sans-serif';
          ctx.fillStyle = '#374151';
          const metrics = ctx.measureText(label);

          // Background
          ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
          ctx.fillRect(
            node.x - metrics.width / 2 - 6,
            node.y - nodeSize - 25,
            metrics.width + 12,
            20
          );

          // Text
          ctx.fillStyle = '#374151';
          ctx.textAlign = 'center';
          ctx.fillText(label, node.x, node.y - nodeSize - 10);
        }
      });

      animationRef.current = requestAnimationFrame(simulate);
    };

    simulate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [nodes, edges, selectedNode, hoveredNode]);

  // Handle canvas click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find clicked node
    const clickedNode = nodes.find(node => {
      const nodeSize = 8 + node.connections * 2;
      const dx = node.x - x;
      const dy = node.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= nodeSize;
    });

    if (clickedNode) {
      setSelectedNode(clickedNode.id);
      if (onDreamClick) {
        onDreamClick(clickedNode.dream);
      }
    } else {
      setSelectedNode(null);
    }
  };

  // Handle canvas hover
  const handleCanvasMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const hoveredNode = nodes.find(node => {
      const nodeSize = 8 + node.connections * 2;
      const dx = node.x - x;
      const dy = node.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= nodeSize;
    });

    setHoveredNode(hoveredNode?.id || null);
    canvas.style.cursor = hoveredNode ? 'pointer' : 'default';
  };

  if (dreams.length < 3) {
    return (
      <div
        style={{
          padding: '3rem',
          textAlign: 'center',
          fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif"
        }}
      >
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🕸️</div>
        <div style={{ fontSize: '1.1rem', color: '#9ca3af' }}>{t.noDreams}</div>
      </div>
    );
  }

  // Find common themes
  const tagCounts = new Map<string, number>();
  dreams.forEach(dream => {
    const allTags = [...(dream.autoTags || []), ...(dream.tags || [])];
    allTags.forEach(tag => {
      const normalized = tag.toLowerCase();
      tagCounts.set(normalized, (tagCounts.get(normalized) || 0) + 1);
    });
  });
  const commonThemes = Array.from(tagCounts.entries())
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div
      style={{
        padding: '2rem',
        fontFamily: language === 'ko' ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif"
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2
          style={{
            fontSize: '1.8rem',
            fontWeight: 'bold',
            marginBottom: '0.5rem',
            color: '#374151'
          }}
        >
          {t.title}
        </h2>
        <p style={{ fontSize: '0.95rem', color: '#9ca3af' }}>
          {t.subtitle}
        </p>
      </div>

      {/* Canvas */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '2rem'
        }}
      >
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMove}
          style={{
            border: '2px solid #E5E7EB',
            borderRadius: '16px',
            background: '#FAFAFA',
            maxWidth: '100%',
            height: 'auto'
          }}
        />
      </div>

      {/* Common themes */}
      {commonThemes.length > 0 && (
        <div
          style={{
            maxWidth: '800px',
            margin: '0 auto',
            background: 'white',
            padding: '1.5rem',
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
          }}
        >
          <h3
            style={{
              fontSize: '1.2rem',
              fontWeight: 'bold',
              marginBottom: '1rem',
              color: '#374151'
            }}
          >
            {t.commonThemes}
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {commonThemes.map(([theme, count]) => (
              <div
                key={theme}
                style={{
                  background: 'linear-gradient(135deg, #7FB069, #A8D5A8)',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '12px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <span>#{theme}</span>
                <span
                  style={{
                    background: 'rgba(255, 255, 255, 0.3)',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '8px',
                    fontSize: '0.8rem'
                  }}
                >
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div
        style={{
          textAlign: 'center',
          marginTop: '1.5rem',
          fontSize: '0.9rem',
          color: '#9ca3af'
        }}
      >
        💡 {t.clickToExplore}
      </div>
    </div>
  );
}
