interface Location {
  fromSource: string;
  fromDestination: string;
}

interface Parameter {
  name: string;
  type: string;
}

interface _ReturnType {
  type: string;
}

interface Dependency {
  type: "external" | "internal";
}

interface ExternalDependency extends Dependency {
  parameters: ReadonlyArray<Parameter>;
  returnType: _ReturnType,
  type: "external";
}

interface InternalDependency extends Dependency {
  method: MethodSchemantics;
  type: "internal";
}

interface Action {
  type: "return" | "branch" | "assignment";
}

interface ActionReturn extends Action {
  type: "return";
  returnType: "throw" | "return";
  value: string;  // error message, input parameter ref, value ref (calculate??)
}

interface ConditionOperation {
  type: "eq" | "neq" | "gt" | "lt"; // TODO: Extend
  leftReference: string;
  rightRefernce: string;
}

interface ConditionOperationGroup {
  leftOperation: ConditionOperation;
  rightOperation: ConditionOperation;
  operation: "AND" | "OR";
}

interface Condition {
  operationGroups: ReadonlyArray<ConditionOperationGroup>;
}

interface ActionBranch extends Action {
  type: "branch";
  condition: Condition;
  leftBranch: Action;
  rightBranch: Action;
}

interface MethodSchemantics {
  name: string;
  location: Location;
  parameters: ReadonlyArray<Parameter>;
  returnType: _ReturnType,
  dependencies: ReadonlyArray<ExternalDependency | InternalDependency>;
  actions: ReadonlyArray<Action>;
}

interface CFModel {
  method: MethodSchemantics;
}


// AST -> CF -> TRACE -> TEST
