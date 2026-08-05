import { Project, SyntaxKind } from 'ts-morph';

type ImportNode = {
  module: string;
  names: string[];
};

type ParamTypeReference = {
  name: string;
  module: string;
};

type SampleCallable = ((...args: unknown[]) => unknown) & {
  __atfwReturnValue?: unknown;
};

function createSampleCallable(returnValue: unknown): SampleCallable {
  const callable = (() => returnValue) as SampleCallable;
  callable.__atfwReturnValue = returnValue;
  return callable;
}

function stringValue(node: any): string {
  return node?.getText?.() ?? ``;
}

function toEnumMemberConst(expression: any): any {
  const symbol = expression?.getSymbol?.();
  const declaration = symbol?.getValueDeclaration?.();
  if (!declaration || declaration.getKind?.() !== SyntaxKind.EnumMember) {
    return null;
  }

  const initializer = declaration.getInitializer?.();
  if (!initializer) return null;
  return toExpressionNode(initializer);
}

function toExpressionNode(expression: any, optionalParams = new Set<string>()): any {
  if (!expression) return null;

  switch (expression.getKind()) {
    case SyntaxKind.Identifier: {
      return {
        type: `Identifier`,
        name: expression.getText(),
      };
    }
    case SyntaxKind.TrueKeyword:
    case SyntaxKind.FalseKeyword: {
      return { type: `Const`, value: expression.getText() === `true` };
    }
    case SyntaxKind.StringLiteral: {
      return { type: `Const`, value: expression.getText().slice(1, -1) };
    }
    case SyntaxKind.NumericLiteral: {
      return { type: `Const`, value: Number(expression.getText()) };
    }
    case SyntaxKind.TypeOfExpression: {
      return {
        type: `TypeOfExpression`,
        expression: toExpressionNode(expression.getExpression(), optionalParams),
      };
    }
    case SyntaxKind.ArrayLiteralExpression: {
      return {
        type: `ArrayLiteralExpression`,
        elements: expression.getElements().map((element: any) => toExpressionNode(element, optionalParams)),
      };
    }
    case SyntaxKind.ObjectLiteralExpression: {
      return {
        type: `ObjectLiteralExpression`,
        properties: expression.getProperties().flatMap((property: any) => {
          if (property.getKind() === SyntaxKind.PropertyAssignment) {
            return [{
              name: property.getName(),
              value: toExpressionNode(property.getInitializer(), optionalParams),
            }];
          }

          if (property.getKind() === SyntaxKind.ShorthandPropertyAssignment) {
            return [{
              name: property.getName(),
              value: {
                type: `Identifier`,
                name: property.getName(),
              },
            }];
          }

          return [];
        }),
      };
    }
    case SyntaxKind.PrefixUnaryExpression: {
      return {
        type: `PrefixUnaryExpression`,
        operator: expression.getChildren()[0]?.getText?.() ?? `!`,
        operand: toExpressionNode(expression.getOperand(), optionalParams),
      };
    }
    case SyntaxKind.BinaryExpression: {
      const operator = expression.getChildren()[1]?.getText?.() ?? ``;
      const left = expression.getLeft();
      const right = expression.getRight();

      return {
        type: `BinaryExpression`,
        operator,
        left: toExpressionNode(left, optionalParams),
        right: toExpressionNode(right, optionalParams),
      };
    }
    case SyntaxKind.ConditionalExpression: {
      return {
        type: `ConditionalExpression`,
        condition: toExpressionNode(expression.getCondition(), optionalParams),
        whenTrue: toExpressionNode(expression.getWhenTrue(), optionalParams),
        whenFalse: toExpressionNode(expression.getWhenFalse(), optionalParams),
      };
    }
    case SyntaxKind.CallExpression: {
      return {
        type: `CallExpression`,
        expression: toExpressionNode(expression.getExpression(), optionalParams),
        arguments: expression.getArguments().map((arg: any) => toExpressionNode(arg, optionalParams)),
      };
    }
    case SyntaxKind.ParenthesizedExpression: {
      return toExpressionNode(expression.getExpression(), optionalParams);
    }
    case SyntaxKind.NullKeyword: {
      return { type: `Const`, value: null };
    }
    case SyntaxKind.UndefinedKeyword: {
      return { type: `Const`, value: `undefined` };
    }
    case SyntaxKind.PropertyAccessExpression: {
      const enumConst = toEnumMemberConst(expression);
      if (enumConst) {
        return enumConst;
      }

      return {
        type: `PropertyAccessExpression`,
        expression: toExpressionNode(expression.getExpression(), optionalParams),
        name: expression.getName(),
      };
    }
    case SyntaxKind.NewExpression: {
      return {
        type: `NewExpression`,
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
          parts.push({ type: `Const`, value: inner.slice(lastIndex, match.index) });
        }

        parts.push({
          type: `Identifier`,
          name: match[1].trim(),
        });
        lastIndex = match.index + match[0].length;
      }

      if (lastIndex < inner.length) {
        parts.push({ type: `Const`, value: inner.slice(lastIndex) });
      }

      return { type: `TemplateExpression`, parts };
    }
    case SyntaxKind.NoSubstitutionTemplateLiteral: {
      return { type: `Const`, value: expression.getText().slice(1, -1) };
    }
    case SyntaxKind.ThisKeyword: {
      return { type: `Identifier`, name: `this` };
    }
    default: {
      return { type: `Unknown`, text: stringValue(expression) };
    }
  }
}

function toStatementNode(statement: any, optionalParams = new Set<string>(), functionDeclaration?: any): any {
  if (!statement) return null;

  if (statement.getKind() === SyntaxKind.ReturnStatement) {
    return {
      type: `Terminal`,
      kind: `return`,
      value: toExpressionNode(statement.getExpression(), optionalParams),
    };
  }

  if (statement.getKind() === SyntaxKind.ThrowStatement) {
    return {
      type: `Terminal`,
      kind: `throw`,
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
      type: `IfStatement`,
      expression: toExpressionNode(statement.getExpression(), optionalParams),
      thenStatement: thenStatements,
      elseStatement: elseStatements,
    };
  }

  if (statement.getKind() === SyntaxKind.SwitchStatement) {
    const switchExpression = statement.getExpression();
    const clauses = statement.getClauses?.() ?? [];
    const body: any[] = [];

    for (const clause of clauses) {
      const clauseStatements = (clause.getStatements?.() ?? []).map((child: any) => toStatementNode(child, optionalParams, functionDeclaration));

      if (clause.getKind() === SyntaxKind.DefaultClause) {
        body.push(...clauseStatements);
        continue;
      }

      const caseExpression = clause.getExpression?.();
      body.push({
        type: `IfStatement`,
        expression: {
          type: `BinaryExpression`,
          operator: `===`,
          left: toExpressionNode(switchExpression, optionalParams),
          right: toExpressionNode(caseExpression, optionalParams),
        },
        thenStatement: clauseStatements,
        elseStatement: [],
      });
    }

    return {
      type: `Block`,
      body,
    };
  }

  if (statement.getKind() === SyntaxKind.Block) {
    const statements = statement.getStatements().map((child: any) => toStatementNode(child, optionalParams, functionDeclaration));
    return {
      type: `Block`,
      body: statements,
    };
  }

  if (statement.getKind() === SyntaxKind.ExpressionStatement) {
    return {
      type: `Expression`,
      expression: toExpressionNode(statement.getExpression(), optionalParams),
    };
  }

  if (statement.getKind() === SyntaxKind.VariableStatement) {
    return {
      type: `VariableStatement`,
      declarations: statement.getDeclarationList().getDeclarations().map((declaration: any) => ({
        name: declaration.getName(),
        initializer: toExpressionNode(declaration.getInitializer(), optionalParams),
      })),
    };
  }

  return {
    type: `UnknownStatement`,
    text: stringValue(statement),
  };
}

function sampleValueFromType(type: any, seed: string, depth = 0): any {
  if (!type) return `${seed}_value`;
  if (depth > 4) return {};

  const typeText = type.getText?.()?.trim?.() ?? ``;
  if ([`boolean`, `true`, `false`, `Boolean`].includes(typeText)) return false;
  if ([`number`, `Number`].includes(typeText)) return 1;
  if ([`string`, `String`].includes(typeText)) return `${seed}_value`;

  if (type.isUnion?.()) {
    const unionTypes = type.getUnionTypes?.().filter((item: any) => !item.isNull?.() && !item.isUndefined?.()) ?? [];
    const isPrimitiveCandidate = (item: any) => {
      const text = item.getText?.()?.trim?.() ?? ``;
      return [
        `string`, `String`, `number`, `Number`, `boolean`, `Boolean`, `true`, `false`,
      ].includes(text)
        || item.isStringLiteral?.()
        || item.isNumberLiteral?.()
        || item.isBooleanLiteral?.()
        || /^`[^`]*`$/s.test(text)
        || /^'[^']*'$/s.test(text)
        || /^"[^"]*"$/s.test(text)
        || /^-?\d+(\.\d+)?$/.test(text);
    };

    const aliasOrObjectCandidate = unionTypes.find((item: any) => !isPrimitiveCandidate(item));
    const candidate = unionTypes.find((item: any) => {
      const text = item.getText?.()?.trim?.() ?? ``;
      return Boolean(item.getProperties?.()?.length)
        || item.isObject?.()
        || text.startsWith(`{`)
        || text.endsWith(`[]`);
    }) ?? aliasOrObjectCandidate ?? unionTypes[0];
    if (candidate) {
      return sampleValueFromType(candidate, seed, depth + 1);
    }
  }

  if (type.isStringLiteral?.()) return type.getLiteralValue?.() ?? `${seed}_value`;
  if (type.isNumberLiteral?.()) return type.getLiteralValue?.() ?? 1;
  if (type.isBooleanLiteral?.()) return typeText === `true`;
  if (/^`[^`]*`$/s.test(typeText) || /^'[^']*'$/s.test(typeText) || /^"[^"]*"$/s.test(typeText)) {
    return typeText.slice(1, -1);
  }
  if (/^-?\d+(\.\d+)?$/.test(typeText)) return Number(typeText);

  if (type.isBoolean?.()) return false;
  if (type.isNumber?.()) return 1;
  if (type.isString?.()) return `${seed}_value`;
  if (type.isArray?.() || type.isTuple?.()) return [];

  const callSignatures = type.getCallSignatures?.() ?? [];
  if (callSignatures.length) {
    const returnType = callSignatures[0]?.getReturnType?.();
    return createSampleCallable(sampleValueFromType(returnType, `${seed}_result`, depth + 1));
  }

  const properties = type.getProperties?.() ?? [];
  if (properties.length) {
    const objectValue: Record<string, any> = {};

    for (const property of properties) {
      const propertyName = property.getName?.();
      if (!propertyName) continue;

      const declarations = property.getDeclarations?.() ?? [];
      const declaration = declarations[0];
      const propertyType = declaration?.getType?.() ?? property.getTypeAtLocation?.(declaration);
      const propertySample = sampleValueFromType(propertyType, propertyName, depth + 1);

      if (propertySample !== undefined) {
        objectValue[propertyName] = propertySample;
      }
    }

    return objectValue;
  }

  if (type.isObject?.()) return {};
  return `${seed}_value`;
}

function toParameterTypeReference(parameter: any, importMap: Map<string, string>, sourceExportNames: Set<string>): ParamTypeReference | undefined {
  const typeNode = parameter.getTypeNode?.();
  const typeNameNode = typeNode?.getTypeName?.();
  const typeName = typeNameNode?.getText?.()?.trim?.();

  if (!typeName || !/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(typeName)) {
    return undefined;
  }

  const importedModule = importMap.get(typeName);
  if (importedModule) {
    return { name: typeName, module: importedModule };
  }

  if (sourceExportNames.has(typeName)) {
    return { name: typeName, module: `.` };
  }

  return undefined;
}

function toTypeReference(typeNode: any, importMap: Map<string, string>, sourceExportNames: Set<string>): ParamTypeReference | undefined {
  const typeNameNode = typeNode?.getTypeName?.();
  const typeName = typeNameNode?.getText?.()?.trim?.();

  if (!typeName || !/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(typeName)) {
    return undefined;
  }

  const importedModule = importMap.get(typeName);
  if (importedModule) {
    return { name: typeName, module: importedModule };
  }

  if (sourceExportNames.has(typeName)) {
    return { name: typeName, module: `.` };
  }

  return undefined;
}

function toParameterNode(parameter: any, importMap: Map<string, string>, sourceExportNames: Set<string>): any {
  const typeNode = parameter.getTypeNode();
  const typeName = typeNode?.getText() ?? parameter.getType().getText() ?? `any`;
  const optional = parameter.hasQuestionToken();
  const parameterType = parameter.getType();
  const unionTypes = parameterType.getUnionTypes?.().filter((item: any) => !item.isNull?.() && !item.isUndefined?.()) ?? [];
  const defaultValueSource = unionTypes.find((item: any) => {
    const text = item.getText?.()?.trim?.() ?? ``;
    return Boolean(item.getProperties?.()?.length)
      || item.isObject?.()
      || text.startsWith(`{`)
      || /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(text);
  }) ?? parameterType;

  return {
    name: parameter.getName(),
    type: optional ? `${typeName}?` : typeName,
    optional,
    defaultValue: sampleValueFromType(defaultValueSource, parameter.getName()),
    typeReference: toParameterTypeReference(parameter, importMap, sourceExportNames),
  };
}

function toImportNode(importDeclaration: any): ImportNode | null {
  if (importDeclaration.isTypeOnly?.()) {
    return null;
  }

  const moduleSpecifier = importDeclaration.getModuleSpecifierValue?.();
  const namedImports = (importDeclaration.getNamedImports?.() ?? []).filter((namedImport: any) => !namedImport.isTypeOnly?.());

  if (!moduleSpecifier || !namedImports.length) {
    return null;
  }

  return {
    module: moduleSpecifier,
    names: namedImports.map((namedImport: any) => namedImport.getName()),
  };
}

function toFunctionNode(functionDeclaration: any, imports: ImportNode[]): any {
  const bodyStatements = functionDeclaration.getBody()?.getStatements?.() ?? [];
  const optionalParams = new Set<string>(
    functionDeclaration.getParameters()
      .filter((parameter: any) => parameter.hasQuestionToken())
      .map((parameter: any) => parameter.getName()),
  );

  const sourceFile = functionDeclaration.getSourceFile?.();
  const allImportMap = new Map<string, string>(
    (sourceFile?.getImportDeclarations?.() ?? []).flatMap((importDeclaration: any) => {
      const moduleSpecifier = importDeclaration.getModuleSpecifierValue?.();
      return (importDeclaration.getNamedImports?.() ?? []).map((namedImport: any) => [namedImport.getName(), moduleSpecifier] as const);
    }),
  );
  const sourceExportNames = new Set<string>(
    (Array.from(sourceFile?.getExportedDeclarations?.().keys?.() ?? []) as string[])
      .filter((name) => name !== functionDeclaration.getName()),
  );

  return {
    type: `Function`,
    name: functionDeclaration.getName(),
    exported: functionDeclaration.hasModifier(SyntaxKind.ExportKeyword),
    params: functionDeclaration.getParameters().map((parameter: any) => toParameterNode(parameter, allImportMap, sourceExportNames)),
    returnType: functionDeclaration.getReturnTypeNode?.()?.getText?.() ?? functionDeclaration.getReturnType?.()?.getText?.() ?? `any`,
    returnTypeReference: toTypeReference(functionDeclaration.getReturnTypeNode?.(), allImportMap, sourceExportNames),
    imports,
    body: bodyStatements.map((statement: any) => toStatementNode(statement, optionalParams, functionDeclaration)),
  };
}

export function createAst(inputFilePath: string): any {
  const project = new Project();
  const sourceFile = project.addSourceFileAtPath(inputFilePath);
  const exportedDeclarations = sourceFile.getExportedDeclarations();
  const exportedFunctions: any[] = [];
  const imports = sourceFile.getImportDeclarations().map((importDeclaration) => toImportNode(importDeclaration)).filter(m => !!m);

  for (const declarations of exportedDeclarations.values()) {
    for (const declaration of declarations) {
      if (declaration.getKind() === SyntaxKind.FunctionDeclaration) {
        exportedFunctions.push(declaration);
      }
    }
  }

  return exportedFunctions.map((functionDeclaration) => toFunctionNode(functionDeclaration, imports));
}
