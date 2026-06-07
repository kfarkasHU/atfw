type CfgNode = {
  id: string;
  type: `Entry` | `Exit` | `Branch` | `Return` | `Throw` | `Effect`;
  condition?: { text: string; expr: any };
  value?: { text: string; expr: any };
  error?: { text: string; expr: any };
  effect?: { text: string; expr: any };
};

type CfgEdge = {
  from: string;
  to: string;
  label?: `true` | `false`;
};

type Import = { module: string; names: string[] };

type CfgInput = {
  type: string;
  function?: string;
  imports?: Array<Import>;
  locals?: Record<string, unknown>;
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
  type: `return` | `throw`;
  expr: any;
};

type PathItem = {
  id: string;
  constraints: PathConstraint[];
  effects: Array<{ expr: any }>;
  outcome: PathOutcome;
};

interface SinglePath {
  type: `Paths`,
  function: string,
  imports: Array<Import>,
  locals: Record<string, unknown>,
  paths: PathItem[];
}

function getOutgoing(edges: CfgEdge[], nodeId: string): CfgEdge[] {
  return edges.filter((edge) => edge.from === nodeId);
}

function createSinglePath(cfg: CfgInput): SinglePath {
  const nodeById = new Map(cfg.nodes.map((node) => [node.id, node]));
  const paths: PathItem[] = [];

  function walk(nodeId: string, constraints: PathConstraint[], effects: Array<{ expr: any }>, trail: Set<string>) {
    const node = nodeById.get(nodeId);
    if (!node || trail.has(nodeId)) return;

    const nextTrail = new Set(trail);
    nextTrail.add(nodeId);

    if (node.type === `Return`) {
      paths.push({
        id: `P${paths.length + 1}`,
        constraints,
        effects,
        outcome: {
          type: `return`,
          expr: node.value?.expr ?? null,
        },
      });
      return;
    }

    if (node.type === `Throw`) {
      paths.push({
        id: `P${paths.length + 1}`,
        constraints,
        effects,
        outcome: {
          type: `throw`,
          expr: node.error?.expr ?? null,
        },
      });
      return;
    }

    if (node.type === `Exit`) {
      return;
    }

    const outgoing = getOutgoing(cfg.edges, nodeId);

    if (node.type === `Effect`) {
      for (const edge of outgoing) {
        walk(edge.to, constraints, [...effects, { expr: node.effect?.expr ?? null }], nextTrail);
      }
      return;
    }

    if (node.type === `Branch` && node.condition) {
      for (const edge of outgoing) {
        if (edge.label !== `true` && edge.label !== `false`) continue;
        const value = edge.label === `true`;

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
          effects,
          nextTrail,
        );
      }
      return;
    }

    for (const edge of outgoing) {
      walk(edge.to, constraints, effects, nextTrail);
    }
  }

  walk(cfg.entry, [], [], new Set<string>());

  return {
    type: `Paths`,
    function: cfg.function ?? `unknown`,
    imports: cfg.imports ?? [],
    locals: cfg.locals ?? {},
    paths,
  };
}

export function createPath(cfg: CfgInput | CfgInput[]): Array<SinglePath> {
  if (!cfg) return [];

  const cfgList = Array.isArray(cfg) ? cfg : [cfg];

  return cfgList
    .filter(Boolean)
    .map((item) => createSinglePath(item));
}
