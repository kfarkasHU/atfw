type NodeType = 'Entry' | 'Exit' | 'Branch' | 'Return' | 'Throw';

type Node = {
  id: string;
  type: NodeType;
  condition?: {
    text: string;
    expr: any;
  };
  value?: {
    text: string;
    expr: any;
  };
  error?: {
    text: string;
    expr: any;
  };
};

type Edge = {
  from: string;
  to: string;
  label?: 'true' | 'false';
};

function formatCondition(condition: any): string {
  if (!condition) return '';

  if (condition.type === 'IRUnary') {
    return `!${formatCondition(condition.expr)}`;
  }

  if (condition.type === 'IRBinary') {
    const left = formatCondition(condition.left);
    const right = formatCondition(condition.right);

    if (condition.op === '&&') {
      return `${left} and ${right}`;
    }

    if (condition.op === '!==') {
      return `${left} !== '${condition.right?.value ?? ''}'`;
    }

    return `${left} ${condition.op} ${right}`;
  }

  if (condition.type === 'IRVar') return condition.name;
  if (condition.type === 'IRConst') return String(condition.value);

  return 'condition';
}

function formatValue(value: any): string {
  if (!value) return '';

  if (value.type === 'IRConst') return String(value.value);
  if (value.type === 'IRVar') return value.name;

  if (value.type === 'IRTemplate') {
    return "`${title} ${name}`";
  }

  if (value.type === 'IRNew') {
    return `Error('${value.args?.[0]?.value ?? ''}')`;
  }

  return 'value';
}

function createConditionPayload(condition: any): { text: string; expr: any } {
  return {
    text: formatCondition(condition),
    expr: condition,
  };
}

function createValuePayload(value: any): { text: string; expr: any } {
  return {
    text: formatValue(value),
    expr: value,
  };
}

function createNode(nodes: Node[], type: NodeType, payload: Partial<Node> = {}): Node {
  const node: Node = {
    id: `N${nodes.length}`,
    type,
    ...payload,
  };

  nodes.push(node);
  return node;
}

function addEdge(edges: Edge[], from: string, to: string, label?: 'true' | 'false') {
  const existingIndex = edges.findIndex((e) => e.from === from && e.to === to);
  if (existingIndex === -1) {
    edges.push(label ? { from, to, label } : { from, to });
    return;
  }

  const existing = edges[existingIndex];
  if (label && !existing.label) {
    edges[existingIndex] = { from, to, label };
  }
}

function buildStatements(
  stmts: any[],
  current: string,
  nodes: Node[],
  edges: Edge[],
  exitId: string,
  incomingLabel?: 'true' | 'false'
): string {
  if (stmts.length === 0) {
    return current;
  }

  const [stmt, ...rest] = stmts;

  if (stmt.type === 'IRIf') {
    const branch = createNode(nodes, 'Branch', {
      condition: createConditionPayload(stmt.condition),
    });

    addEdge(edges, current, branch.id, incomingLabel);

    const thenExit = buildStatements(stmt.then ?? [], branch.id, nodes, edges, exitId, 'true');
    const elseExit = buildStatements(rest, branch.id, nodes, edges, exitId, 'false');

    addEdge(edges, branch.id, thenExit, 'true');
    addEdge(edges, branch.id, elseExit, 'false');

    return branch.id;
  }

  if (stmt.type === 'IRReturn') {
    const ret = createNode(nodes, 'Return', {
      value: createValuePayload(stmt.value),
    });

    addEdge(edges, current, ret.id, incomingLabel);
    addEdge(edges, ret.id, exitId);

    return ret.id;
  }

  if (stmt.type === 'IRThrow') {
    const thr = createNode(nodes, 'Throw', {
      error: createValuePayload(stmt.error),
    });

    addEdge(edges, current, thr.id, incomingLabel);
    addEdge(edges, thr.id, exitId);

    return thr.id;
  }

  return buildStatements(rest, current, nodes, edges, exitId, incomingLabel);
}

export function createCfg(ir: any) {
  if (!ir) return null;

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const entry = createNode(nodes, 'Entry');
  const exit = createNode(nodes, 'Exit');

  buildStatements(ir.body ?? [], entry.id, nodes, edges, exit.id);

  return {
    type: 'CFG',
    function: ir.name ?? 'unknown',
    entry: entry.id,
    exit: exit.id,
    nodes,
    edges,
  };
}