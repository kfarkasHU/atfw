type CfgNode = {
  id: string;
  type: 'Entry' | 'Exit' | 'Branch' | 'Return' | 'Throw';
  condition?: { text: string; expr: any };
  value?: { text: string; expr: any };
  error?: { text: string; expr: any };
};

type CfgEdge = {
  from: string;
  to: string;
  label?: 'true' | 'false';
};

type CfgInput = {
  type: string;
  function?: string;
  entry: string;
  exit: string;
  nodes: CfgNode[];
  edges: CfgEdge[];
};

type PathConstraint = {
  condition: string;
  expr: any;
  value: boolean;
};

type PathOutcome = {
  type: 'return' | 'throw';
  expr: any;
};

type PathItem = {
  id: string;
  constraints: PathConstraint[];
  outcome: PathOutcome;
};

function getOutgoing(edges: CfgEdge[], nodeId: string): CfgEdge[] {
  return edges.filter((edge) => edge.from === nodeId);
}

export function createPath(cfg: CfgInput): { type: 'Paths'; function: string; paths: PathItem[] } {
  if (!cfg) {
    return {
      type: 'Paths',
      function: 'unknown',
      paths: [],
    };
  }

  const nodeById = new Map(cfg.nodes.map((node) => [node.id, node]));
  const paths: PathItem[] = [];

  function walk(nodeId: string, constraints: PathConstraint[], trail: Set<string>) {
    const node = nodeById.get(nodeId);
    if (!node || trail.has(nodeId)) return;

    const nextTrail = new Set(trail);
    nextTrail.add(nodeId);

    if (node.type === 'Return') {
      paths.push({
        id: `P${paths.length + 1}`,
        constraints,
        outcome: {
          type: 'return',
          expr: node.value?.expr ?? null,
        },
      });
      return;
    }

    if (node.type === 'Throw') {
      paths.push({
        id: `P${paths.length + 1}`,
        constraints,
        outcome: {
          type: 'throw',
          expr: node.error?.expr ?? null,
        },
      });
      return;
    }

    if (node.type === 'Exit') {
      return;
    }

    const outgoing = getOutgoing(cfg.edges, nodeId);

    if (node.type === 'Branch' && node.condition) {
      for (const edge of outgoing) {
        if (edge.label !== 'true' && edge.label !== 'false') continue;
        const value = edge.label === 'true';

        walk(
          edge.to,
          [
            ...constraints,
            {
              condition: node.condition.text,
              expr: node.condition.expr,
              value,
            },
          ],
          nextTrail,
        );
      }
      return;
    }

    for (const edge of outgoing) {
      walk(edge.to, constraints, nextTrail);
    }
  }

  walk(cfg.entry, [], new Set<string>());

  return {
    type: 'Paths',
    function: cfg.function ?? 'unknown',
    paths,
  };
}
