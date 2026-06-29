import { Project, SyntaxKind } from 'ts-morph';

function stringValue(node: any): string {
  return node?.getText?.() ?? '';
}

function toExpressionNode(expression: any, optionalParams = new Set<string>()): any {
  if (!expression) return null;

  switch (expression.getKind()) {
    case SyntaxKind.Identifier: {
      return {
        type: 'Identifier',
        name: expression.getText(),
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
      return {
        type: 'PrefixUnaryExpression',
        operator: expression.getChildren()[0]?.getText?.() ?? '!',
        operand: toExpressionNode(expression.getOperand(), optionalParams),
      };
    }
    case SyntaxKind.BinaryExpression: {
      const operator = expression.getChildren()[1]?.getText?.() ?? '';
      const left = expression.getLeft();
      const right = expression.getRight();

      return {
        type: 'BinaryExpression',
        operator,
        left: toExpressionNode(left, optionalParams),
        right: toExpressionNode(right, optionalParams),
      };
    }
    case SyntaxKind.ParenthesizedExpression: {
      return toExpressionNode(expression.getExpression(), optionalParams);
    }
    case SyntaxKind.NullKeyword: {
      return { type: 'Const', value: null };
    }
    case SyntaxKind.UndefinedKeyword: {
      return { type: 'Const', value: 'undefined' };
    }
    case SyntaxKind.PropertyAccessExpression: {
      return {
        type: 'PropertyAccessExpression',
        expression: toExpressionNode(expression.getExpression(), optionalParams),
        name: expression.getName(),
      };
    }
    case SyntaxKind.NewExpression: {
      return {
        type: 'NewExpression',
        expression: expression.getExpression().getText(),
        arguments: expression.getArguments().map((arg: any) => toExpressionNode(arg, optionalParams)),
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
          type: 'Identifier',
          name: match[1].trim(),
        });
        lastIndex = match.index + match[0].length;
      }

      if (lastIndex < inner.length) {
        parts.push({ type: 'Const', value: inner.slice(lastIndex) });
      }

      return { type: 'TemplateExpression', parts };
    }
    case SyntaxKind.NoSubstitutionTemplateLiteral: {
      return { type: 'Const', value: expression.getText().slice(1, -1) };
    }
    case SyntaxKind.ThisKeyword: {
      return { type: 'Identifier', name: 'this' };
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
    const elseStatement = statement.getElseStatement();
    const thenStatements = statement.getThenStatement()?.getKind() === SyntaxKind.Block
      ? statement.getThenStatement().getStatements().map((child: any) => toStatementNode(child, optionalParams, functionDeclaration))
      : [toStatementNode(statement.getThenStatement(), optionalParams, functionDeclaration)];
    const elseStatements = elseStatement?.getKind() === SyntaxKind.Block
      ? elseStatement.getStatements().map((child: any) => toStatementNode(child, optionalParams, functionDeclaration))
      : elseStatement
        ? [toStatementNode(elseStatement, optionalParams, functionDeclaration)]
        : [];

    return {
      type: 'IfStatement',
      expression: toExpressionNode(statement.getExpression(), optionalParams),
      thenStatement: thenStatements,
      elseStatement: elseStatements,
    };
  }

  if (statement.getKind() === SyntaxKind.Block) {
    const statements = statement.getStatements().map((child: any) => toStatementNode(child, optionalParams, functionDeclaration));
    return {
      type: 'Block',
      body: statements,
    };
  }

  if (statement.getKind() === SyntaxKind.ExpressionStatement) {
    return {
      type: 'Expression',
      expression: toExpressionNode(statement.getExpression(), optionalParams),
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
  const optionalParams = new Set<string>(
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

export function createAst(inputFilePath: string): any {
  const project = new Project();
  const sourceFile = project.addSourceFileAtPath(inputFilePath);
  const exportedDeclarations = sourceFile.getExportedDeclarations();
  const exportedFunctions: any[] = [];

  for (const declarations of exportedDeclarations.values()) {
    for (const declaration of declarations) {
      if (declaration.getKind() === SyntaxKind.FunctionDeclaration) {
        exportedFunctions.push(declaration);
      }
    }
  }

  return exportedFunctions.map((functionDeclaration) => toFunctionNode(functionDeclaration));
}
