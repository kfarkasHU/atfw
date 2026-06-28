import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { Project, SyntaxKind } from 'ts-morph';

function stringValue(node: any): string {
  return node?.getText?.() ?? '';
}

function toExpressionNode(expression: any, optionalParams = new Set<string>()): any {
  if (!expression) return null;

  switch (expression.getKind()) {
    case SyntaxKind.Identifier: {
      const name = expression.getText();
      if (name === 'undefined') {
        return { type: 'Const', value: 'undefined' };
      }

      return {
        type: 'Var',
        name,
        ...(optionalParams.has(name) ? { optional: true } : {}),
      };
    }
    case SyntaxKind.TrueKeyword:
    case SyntaxKind.FalseKeyword: {
      return { type: 'Const', value: expression.getText() === 'true' };
    }
    case SyntaxKind.StringLiteral: {
      return { type: 'Const', value: expression.getText().slice(1, -1) };
    }
    case SyntaxKind.NumericLiteral: {
      return { type: 'Const', value: Number(expression.getText()) };
    }
    case SyntaxKind.PrefixUnaryExpression: {
      const operator = expression.getChildren()[0]?.getText?.() ?? '!';
      return {
        type: 'UnaryPredicate',
        op: operator,
        expr: toExpressionNode(expression.getOperand(), optionalParams),
      };
    }
    case SyntaxKind.BinaryExpression: {
      const operator = expression.getChildren()[1]?.getText?.() ?? '';
      const op = operator === '!=='
        ? '!='
        : operator === '&&'
          ? '&&'
          : operator;
      const left = expression.getLeft();
      const right = expression.getRight();

      if (op === '&&') {
        return {
          type: 'AndPredicate',
          left: left.getKind() === SyntaxKind.Identifier
            ? { type: 'ExistsPredicate', value: toExpressionNode(left, optionalParams) }
            : toExpressionNode(left, optionalParams),
          right: toExpressionNode(right, optionalParams),
        };
      }

      if (op === '!==') {
        return {
          type: 'BinaryPredicate',
          op,
          left: toExpressionNode(left, optionalParams),
          right: toExpressionNode(right, optionalParams),
        };
      }

      return {
        type: 'BinaryPredicate',
        op,
        left: toExpressionNode(left, optionalParams),
        right: toExpressionNode(right, optionalParams),
      };
    }
    case SyntaxKind.ParenthesizedExpression: {
      return toExpressionNode(expression.getExpression());
    }
    case SyntaxKind.NullKeyword: {
      return { type: 'Const', value: null };
    }
    case SyntaxKind.UndefinedKeyword: {
      return { type: 'Const', value: 'undefined' };
    }
    case SyntaxKind.NewExpression: {
      return {
        type: 'NewObject',
        class: expression.getExpression().getText(),
        args: expression.getArguments().map((arg: any) => toExpressionNode(arg, optionalParams)),
      };
    }
    case SyntaxKind.TemplateExpression: {
      const inner = expression.getText().slice(1, -1);
      const parts: any[] = [];
      let lastIndex = 0;
      const regex = /\$\{([^}]+)\}/g;
      let match: RegExpExecArray | null;

      while ((match = regex.exec(inner)) !== null) {
        if (match.index > lastIndex) {
          parts.push({ type: 'Const', value: inner.slice(lastIndex, match.index) });
        }

        parts.push({
          type: 'Var',
          name: match[1].trim(),
          ...(optionalParams.has(match[1].trim()) ? { optional: true } : {}),
        });
        lastIndex = match.index + match[0].length;
      }

      if (lastIndex < inner.length) {
        parts.push({ type: 'Const', value: inner.slice(lastIndex) });
      }

      return { type: 'TemplateString', parts };
    }
    case SyntaxKind.NoSubstitutionTemplateLiteral: {
      return { type: 'Const', value: expression.getText().slice(1, -1) };
    }
    case SyntaxKind.ThisExpression: {
      return { type: 'Var', name: 'this' };
    }
    default: {
      return { type: 'Unknown', text: stringValue(expression) };
    }
  }
}

function toStatementNode(statement: any, optionalParams = new Set<string>(), functionDeclaration?: any): any {
  if (!statement) return null;

  if (statement.getKind() === SyntaxKind.ReturnStatement) {
    return {
      type: 'Terminal',
      kind: 'return',
      value: toExpressionNode(statement.getExpression(), optionalParams),
    };
  }

  if (statement.getKind() === SyntaxKind.ThrowStatement) {
    return {
      type: 'Terminal',
      kind: 'throw',
      error: toExpressionNode(statement.getExpression(), optionalParams),
    };
  }

  if (statement.getKind() === SyntaxKind.IfStatement) {
    return {
      type: 'Branch',
      condition: toExpressionNode(statement.getExpression(), optionalParams),
      then: toStatementNode(statement.getThenStatement(), optionalParams, functionDeclaration),
    };
  }

  return {
    type: 'UnknownStatement',
    text: stringValue(statement),
  };
}

function toParameterNode(parameter: any): any {
  const typeNode = parameter.getTypeNode();
  const typeName = typeNode?.getText() ?? parameter.getType().getText() ?? 'any';
  const optional = parameter.hasQuestionToken();

  return {
    name: parameter.getName(),
    type: optional ? `${typeName}?` : typeName,
    optional,
  };
}

function toFunctionNode(functionDeclaration: any): any {
  const bodyStatements = functionDeclaration.getBody()?.getStatements?.() ?? [];
  const optionalParams = new Set(
    functionDeclaration.getParameters()
      .filter((parameter: any) => parameter.hasQuestionToken())
      .map((parameter: any) => parameter.getName()),
  );

  return {
    type: 'Function',
    name: functionDeclaration.getName(),
    exported: functionDeclaration.hasModifier(SyntaxKind.ExportKeyword),
    params: functionDeclaration.getParameters().map((parameter: any) => toParameterNode(parameter)),
    body: bodyStatements.map((statement: any) => toStatementNode(statement, optionalParams, functionDeclaration)),
  };
}

export function writeAstToFile(inputFilePath: string, outputFilePath: string): string {
  const absoluteInputPath = path.isAbsolute(inputFilePath)
    ? inputFilePath
    : path.resolve(process.cwd(), inputFilePath);
  const absoluteOutputPath = path.isAbsolute(outputFilePath)
    ? outputFilePath
    : path.resolve(process.cwd(), outputFilePath);

  const project = new Project();
  const sourceFile = project.addSourceFileAtPath(absoluteInputPath);
  const functionDeclaration = sourceFile.getFunctions()[0];
  const ast = functionDeclaration ? toFunctionNode(functionDeclaration) : null;

  mkdirSync(path.dirname(absoluteOutputPath), { recursive: true });
  writeFileSync(absoluteOutputPath, JSON.stringify(ast, null, 2));

  return absoluteOutputPath;
}
