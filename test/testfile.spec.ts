[
  {
    "schematics": {
      "name": "returnUndefined",
      "outputType": "any",
      "parameters": []
    },
    "imports": {
      "p1": [],
      "p2": [],
      "p3": [],
      "relative": [],
      "external": [],
      "builtIn": []
    },
    "nir": {
      "type": "node",
      "nodeType": "block",
      "nodes": [
        {
          "type": "statement",
          "statementType": "terminal",
          "terminalType": "return",
          "expression": {
            "type": "expression",
            "expressionType": "constant",
            "constantExpressionType": "undefined"
          }
        }
      ]
    }
  },
  {
    "schematics": {
      "name": "returnNull",
      "outputType": "any",
      "parameters": []
    },
    "imports": {
      "p1": [],
      "p2": [],
      "p3": [],
      "relative": [],
      "external": [],
      "builtIn": []
    },
    "nir": {
      "type": "node",
      "nodeType": "block",
      "nodes": [
        {
          "type": "statement",
          "statementType": "terminal",
          "terminalType": "return",
          "expression": {
            "type": "expression",
            "expressionType": "constant",
            "constantExpressionType": "null"
          }
        }
      ]
    }
  },
  {
    "schematics": {
      "name": "returnHello",
      "outputType": "string",
      "parameters": []
    },
    "imports": {
      "p1": [],
      "p2": [],
      "p3": [],
      "relative": [],
      "external": [],
      "builtIn": []
    },
    "nir": {
      "type": "node",
      "nodeType": "block",
      "nodes": [
        {
          "type": "statement",
          "statementType": "terminal",
          "terminalType": "return",
          "expression": {
            "type": "expression",
            "expressionType": "constant",
            "constantExpressionType": "string",
            "text": "hello"
          }
        }
      ]
    }
  },
  {
    "schematics": {
      "name": "returnTrue",
      "outputType": "boolean",
      "parameters": []
    },
    "imports": {
      "p1": [],
      "p2": [],
      "p3": [],
      "relative": [],
      "external": [],
      "builtIn": []
    },
    "nir": {
      "type": "node",
      "nodeType": "block",
      "nodes": [
        {
          "type": "statement",
          "statementType": "terminal",
          "terminalType": "return",
          "expression": {
            "type": "expression",
            "expressionType": "constant",
            "constantExpressionType": "true"
          }
        }
      ]
    }
  },
  {
    "schematics": {
      "name": "returnFalse",
      "outputType": "boolean",
      "parameters": []
    },
    "imports": {
      "p1": [],
      "p2": [],
      "p3": [],
      "relative": [],
      "external": [],
      "builtIn": []
    },
    "nir": {
      "type": "node",
      "nodeType": "block",
      "nodes": [
        {
          "type": "statement",
          "statementType": "terminal",
          "terminalType": "return",
          "expression": {
            "type": "expression",
            "expressionType": "constant",
            "constantExpressionType": "false"
          }
        }
      ]
    }
  },
  {
    "schematics": {
      "name": "returnParamString",
      "outputType": "string",
      "parameters": [
        {
          "name": "param",
          "type": "string",
          "index": 0,
          "isSpread": false,
          "isOptional": false
        }
      ]
    },
    "imports": {
      "p1": [],
      "p2": [],
      "p3": [],
      "relative": [],
      "external": [],
      "builtIn": []
    },
    "nir": {
      "type": "node",
      "nodeType": "block",
      "nodes": [
        {
          "type": "statement",
          "statementType": "terminal",
          "terminalType": "return",
          "expression": {
            "type": "expression",
            "expressionType": "dynamic",
            "dynamicExpressionType": "variable",
            "variableName": "param"
          }
        }
      ]
    }
  },
  {
    "schematics": {
      "name": "returnParamNumber",
      "outputType": "number",
      "parameters": [
        {
          "name": "param",
          "type": "number",
          "index": 0,
          "isSpread": false,
          "isOptional": false
        }
      ]
    },
    "imports": {
      "p1": [],
      "p2": [],
      "p3": [],
      "relative": [],
      "external": [],
      "builtIn": []
    },
    "nir": {
      "type": "node",
      "nodeType": "block",
      "nodes": [
        {
          "type": "statement",
          "statementType": "terminal",
          "terminalType": "return",
          "expression": {
            "type": "expression",
            "expressionType": "dynamic",
            "dynamicExpressionType": "variable",
            "variableName": "param"
          }
        }
      ]
    }
  },
  {
    "schematics": {
      "name": "returnZero",
      "outputType": "number",
      "parameters": []
    },
    "imports": {
      "p1": [],
      "p2": [],
      "p3": [],
      "relative": [],
      "external": [],
      "builtIn": []
    },
    "nir": {
      "type": "node",
      "nodeType": "block",
      "nodes": [
        {
          "type": "statement",
          "statementType": "terminal",
          "terminalType": "return",
          "expression": {
            "type": "expression",
            "expressionType": "constant",
            "constantExpressionType": "number",
            "text": "0"
          }
        }
      ]
    }
  },
  {
    "schematics": {
      "name": "returnInterpolated",
      "outputType": "string",
      "parameters": [
        {
          "name": "name",
          "type": "string",
          "index": 0,
          "isSpread": false,
          "isOptional": false
        }
      ]
    },
    "imports": {
      "p1": [],
      "p2": [],
      "p3": [],
      "relative": [],
      "external": [],
      "builtIn": []
    },
    "nir": {
      "type": "node",
      "nodeType": "block",
      "nodes": [
        {
          "type": "statement",
          "statementType": "terminal",
          "terminalType": "return",
          "expression": {
            "type": "expression",
            "expressionType": "template",
            "parts": [
              {
                "type": "expression",
                "templateType": "part",
                "templatePartType": "head",
                "literal": "Hello "
              },
              {
                "type": "expression",
                "templateType": "part",
                "templatePartType": "span",
                "literal": "!"
              }
            ]
          }
        }
      ]
    }
  },
  {
    "schematics": {
      "name": "throwString",
      "outputType": "void",
      "parameters": []
    },
    "imports": {
      "p1": [],
      "p2": [],
      "p3": [],
      "relative": [],
      "external": [],
      "builtIn": []
    },
    "nir": {
      "type": "node",
      "nodeType": "block",
      "nodes": [
        {
          "type": "statement",
          "statementType": "terminal",
          "terminalType": "throw",
          "expression": {
            "type": "expression",
            "expressionType": "constant",
            "constantExpressionType": "string",
            "text": "error"
          }
        }
      ]
    }
  },
  {
    "schematics": {
      "name": "throwNumber",
      "outputType": "void",
      "parameters": []
    },
    "imports": {
      "p1": [],
      "p2": [],
      "p3": [],
      "relative": [],
      "external": [],
      "builtIn": []
    },
    "nir": {
      "type": "node",
      "nodeType": "block",
      "nodes": [
        {
          "type": "statement",
          "statementType": "terminal",
          "terminalType": "throw",
          "expression": {
            "type": "expression",
            "expressionType": "constant",
            "constantExpressionType": "number",
            "text": "1"
          }
        }
      ]
    }
  },
  {
    "schematics": {
      "name": "throwBoolean",
      "outputType": "void",
      "parameters": []
    },
    "imports": {
      "p1": [],
      "p2": [],
      "p3": [],
      "relative": [],
      "external": [],
      "builtIn": []
    },
    "nir": {
      "type": "node",
      "nodeType": "block",
      "nodes": [
        {
          "type": "statement",
          "statementType": "terminal",
          "terminalType": "throw",
          "expression": {
            "type": "expression",
            "expressionType": "constant",
            "constantExpressionType": "false"
          }
        }
      ]
    }
  },
  {
    "schematics": {
      "name": "throwParam",
      "outputType": "void",
      "parameters": [
        {
          "name": "param",
          "type": "any",
          "index": 0,
          "isSpread": false,
          "isOptional": false
        }
      ]
    },
    "imports": {
      "p1": [],
      "p2": [],
      "p3": [],
      "relative": [],
      "external": [],
      "builtIn": []
    },
    "nir": {
      "type": "node",
      "nodeType": "block",
      "nodes": [
        {
          "type": "statement",
          "statementType": "terminal",
          "terminalType": "throw",
          "expression": {
            "type": "expression",
            "expressionType": "dynamic",
            "dynamicExpressionType": "variable",
            "variableName": "param"
          }
        }
      ]
    }
  },
  {
    "schematics": {
      "name": "throwErrorWithMessage",
      "outputType": "void",
      "parameters": [
        {
          "name": "error",
          "type": "string",
          "index": 0,
          "isSpread": false,
          "isOptional": false
        }
      ]
    },
    "imports": {
      "p1": [],
      "p2": [],
      "p3": [],
      "relative": [],
      "external": [],
      "builtIn": []
    },
    "nir": {
      "type": "node",
      "nodeType": "block",
      "nodes": [
        {
          "type": "statement",
          "statementType": "terminal",
          "terminalType": "throw",
          "expression": {
            "type": "expression",
            "expressionType": "call",
            "expression": {
              "type": "expression",
              "expressionType": "dynamic",
              "dynamicExpressionType": "variable",
              "variableName": "Error"
            },
            "arguments": [
              {
                "type": "expression",
                "expressionType": "template",
                "parts": [
                  {
                    "type": "expression",
                    "templateType": "part",
                    "templatePartType": "head",
                    "literal": "message: "
                  },
                  {
                    "type": "expression",
                    "templateType": "part",
                    "templatePartType": "span",
                    "literal": ""
                  }
                ]
              }
            ]
          }
        }
      ]
    }
  },
  {
    "schematics": {
      "name": "throwNewErrorWithMessage",
      "outputType": "void",
      "parameters": []
    },
    "imports": {
      "p1": [],
      "p2": [],
      "p3": [],
      "relative": [],
      "external": [],
      "builtIn": []
    },
    "nir": {
      "type": "node",
      "nodeType": "block",
      "nodes": [
        {
          "type": "statement",
          "statementType": "terminal",
          "terminalType": "throw",
          "expression": {
            "type": "expression",
            "expressionType": "new",
            "expression": {
              "type": "expression",
              "expressionType": "dynamic",
              "dynamicExpressionType": "variable",
              "variableName": "Error"
            },
            "arguments": []
          }
        }
      ]
    }
  },
  {
    "schematics": {
      "name": "returnIfTrue",
      "outputType": "\"left\" | \"right\"",
      "parameters": [
        {
          "name": "input",
          "type": "boolean",
          "index": 0,
          "isSpread": false,
          "isOptional": false
        }
      ]
    },
    "imports": {
      "p1": [],
      "p2": [],
      "p3": [],
      "relative": [],
      "external": [],
      "builtIn": []
    },
    "nir": {
      "type": "node",
      "nodeType": "block",
      "nodes": [
        {
          "type": "statement",
          "statementType": "terminal",
          "terminalType": "return",
          "expression": {
            "type": "statement",
            "statementType": "branch",
            "branchType": "ternary",
            "whenTrue": {
              "type": "expression",
              "expressionType": "constant",
              "constantExpressionType": "string",
              "text": "left"
            },
            "whenFalse": {
              "type": "expression",
              "expressionType": "constant",
              "constantExpressionType": "string",
              "text": "right"
            },
            "expression": {
              "type": "expression",
              "expressionType": "dynamic",
              "dynamicExpressionType": "variable",
              "variableName": "input"
            }
          }
        }
      ]
    }
  },
  {
    "schematics": {
      "name": "test",
      "outputType": "string",
      "parameters": [
        {
          "name": "isVisible",
          "type": "boolean",
          "index": 0,
          "isSpread": false,
          "isOptional": false
        },
        {
          "name": "name",
          "type": "string",
          "index": 1,
          "isSpread": false,
          "isOptional": false
        },
        {
          "name": "title",
          "type": "string",
          "index": 2,
          "isSpread": false,
          "isOptional": true
        }
      ]
    },
    "imports": {
      "p1": [],
      "p2": [],
      "p3": [],
      "relative": [],
      "external": [],
      "builtIn": []
    },
    "nir": {
      "type": "node",
      "nodeType": "block",
      "nodes": [
        {
          "type": "statement",
          "statementType": "branch",
          "branchType": "if",
          "whenTrue": {
            "type": "statement",
            "statementType": "terminal",
            "terminalType": "return",
            "expression": {
              "type": "expression",
              "expressionType": "constant",
              "constantExpressionType": "undefined"
            }
          },
          "expression": {
            "type": "expression",
            "expressionType": "logical",
            "logicalExpressionType": "unary",
            "operand": {
              "type": "expression",
              "expressionType": "dynamic",
              "dynamicExpressionType": "variable",
              "variableName": "isVisible"
            },
            "operator": "exclamation"
          }
        },
        {
          "type": "statement",
          "statementType": "branch",
          "branchType": "if",
          "whenTrue": {
            "type": "statement",
            "statementType": "terminal",
            "terminalType": "throw",
            "expression": {
              "type": "expression",
              "expressionType": "new",
              "expression": {
                "type": "expression",
                "expressionType": "dynamic",
                "dynamicExpressionType": "variable",
                "variableName": "Error"
              },
              "arguments": [
                {
                  "type": "expression",
                  "expressionType": "constant",
                  "constantExpressionType": "string",
                  "text": "Title must be Dr or nil!"
                }
              ]
            }
          },
          "expression": {
            "type": "expression",
            "expressionType": "logical",
            "logicalExpressionType": "binary",
            "tokenSymbol": {
              "type": "expression",
              "expressionType": "operator",
              "value": "and"
            },
            "left": {
              "type": "expression",
              "expressionType": "dynamic",
              "dynamicExpressionType": "variable",
              "variableName": "title"
            },
            "right": {
              "type": "expression",
              "expressionType": "logical",
              "logicalExpressionType": "binary",
              "tokenSymbol": {
                "type": "expression",
                "expressionType": "operator",
                "value": "neqeq"
              },
              "left": {
                "type": "expression",
                "expressionType": "dynamic",
                "dynamicExpressionType": "variable",
                "variableName": "title"
              },
              "right": {
                "type": "expression",
                "expressionType": "constant",
                "constantExpressionType": "string",
                "text": "Dr"
              }
            }
          }
        },
        {
          "type": "statement",
          "statementType": "terminal",
          "terminalType": "return",
          "expression": {
            "type": "expression",
            "expressionType": "template",
            "parts": [
              {
                "type": "expression",
                "templateType": "part",
                "templatePartType": "head",
                "literal": ""
              },
              {
                "type": "expression",
                "templateType": "part",
                "templatePartType": "span",
                "literal": " "
              },
              {
                "type": "expression",
                "templateType": "part",
                "templatePartType": "span",
                "literal": ""
              }
            ]
          }
        }
      ]
    }
  }
]