import dagre from 'dagre';
import { Node, Edge } from '@/types/graph';

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

export interface LayoutOptions {
  direction?: 'TB' | 'BT' | 'LR' | 'RL';
  nodeWidth?: number;
  nodeHeight?: number;
  rankSep?: number;
  nodeSep?: number;
}

export const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
) => {
  const {
    direction = 'TB',
    nodeWidth = 172,
    nodeHeight = 36,
    rankSep = 150,
    nodeSep = 100,
  } = options;

  const isHorizontal = direction === 'LR' || direction === 'RL';
  dagreGraph.setGraph({
    rankdir: direction,
    ranksep: rankSep,
    nodesep: nodeSep,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { 
      width: isHorizontal ? nodeHeight : nodeWidth, 
      height: isHorizontal ? nodeWidth : nodeHeight 
    });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const newNode = {
      ...node,
      targetPosition: isHorizontal ? 'left' as const : 'top' as const,
      sourcePosition: isHorizontal ? 'right' as const : 'bottom' as const,
      // We are shifting the dagre node position (anchor=center center) to the top left
      // so it matches the React Flow node anchor point (top left).
      position: {
        x: nodeWithPosition.x - (isHorizontal ? nodeHeight : nodeWidth) / 2,
        y: nodeWithPosition.y - (isHorizontal ? nodeWidth : nodeHeight) / 2,
      },
    };

    return newNode;
  });

  return { nodes: layoutedNodes, edges };
};

// Alternative layout algorithms
export const getCircularLayout = (nodes: Node[], edges: Edge[]) => {
  const centerX = 400;
  const centerY = 300;
  const radius = Math.max(200, nodes.length * 30);
  
  const layoutedNodes = nodes.map((node, index) => {
    const angle = (2 * Math.PI * index) / nodes.length;
    return {
      ...node,
      position: {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

export const getGridLayout = (nodes: Node[], edges: Edge[]) => {
  const cols = Math.ceil(Math.sqrt(nodes.length));
  const nodeSpacing = 200;
  
  const layoutedNodes = nodes.map((node, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    
    return {
      ...node,
      position: {
        x: col * nodeSpacing + 100,
        y: row * nodeSpacing + 100,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

// Force-directed layout (simple version)
export const getForceLayout = (nodes: Node[], edges: Edge[]) => {
  const width = 800;
  const height = 600;
  
  // Initialize random positions
  let layoutedNodes = nodes.map((node) => ({
    ...node,
    position: {
      x: Math.random() * width,
      y: Math.random() * height,
    },
  }));

  // Simple force simulation
  const iterations = 100;
  const repulsionStrength = 1000;
  const attractionStrength = 0.1;
  const centeringStrength = 0.01;

  for (let iter = 0; iter < iterations; iter++) {
    const forces = layoutedNodes.map(() => ({ x: 0, y: 0 }));

    // Repulsion between all nodes
    for (let i = 0; i < layoutedNodes.length; i++) {
      for (let j = i + 1; j < layoutedNodes.length; j++) {
        const dx = layoutedNodes[j].position.x - layoutedNodes[i].position.x;
        const dy = layoutedNodes[j].position.y - layoutedNodes[i].position.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = repulsionStrength / (distance * distance);
        
        forces[i].x -= (dx / distance) * force;
        forces[i].y -= (dy / distance) * force;
        forces[j].x += (dx / distance) * force;
        forces[j].y += (dy / distance) * force;
      }
    }

    // Attraction for connected nodes
    edges.forEach((edge) => {
      const sourceIndex = layoutedNodes.findIndex(n => n.id === edge.source);
      const targetIndex = layoutedNodes.findIndex(n => n.id === edge.target);
      
      if (sourceIndex !== -1 && targetIndex !== -1) {
        const dx = layoutedNodes[targetIndex].position.x - layoutedNodes[sourceIndex].position.x;
        const dy = layoutedNodes[targetIndex].position.y - layoutedNodes[sourceIndex].position.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        
        forces[sourceIndex].x += dx * attractionStrength;
        forces[sourceIndex].y += dy * attractionStrength;
        forces[targetIndex].x -= dx * attractionStrength;
        forces[targetIndex].y -= dy * attractionStrength;
      }
    });

    // Center attraction
    const centerX = width / 2;
    const centerY = height / 2;
    layoutedNodes.forEach((node, i) => {
      forces[i].x += (centerX - node.position.x) * centeringStrength;
      forces[i].y += (centerY - node.position.y) * centeringStrength;
    });

    // Apply forces
    layoutedNodes = layoutedNodes.map((node, i) => ({
      ...node,
      position: {
        x: Math.max(50, Math.min(width - 50, node.position.x + forces[i].x)),
        y: Math.max(50, Math.min(height - 50, node.position.y + forces[i].y)),
      },
    }));
  }

  return { nodes: layoutedNodes, edges };
};
