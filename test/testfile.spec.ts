[
  {
    "condition": {
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
    },
    "terminal": {
      "type": "statement",
      "statementType": "terminal",
      "terminalType": "return",
      "expression": {
        "type": "expression",
        "expressionType": "constant",
        "constantExpressionType": "undefined"
      }
    }
  },
  {
    "condition": {
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
        "variableName": "isVisible"
      },
      "right": {
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
    "terminal": {
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
    }
  },
  {
    "condition": {
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
        "variableName": "isVisible"
      },
      "right": {
        "type": "expression",
        "expressionType": "logical",
        "logicalExpressionType": "unary",
        "operator": "exclamation",
        "operand": {
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
      }
    },
    "terminal": {
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
            "literal": " ",
            "token": {
              "type": "expression",
              "expressionType": "dynamic",
              "dynamicExpressionType": "variable",
              "variableName": "title"
            }
          },
          {
            "type": "expression",
            "templateType": "part",
            "templatePartType": "span",
            "literal": "",
            "token": {
              "type": "expression",
              "expressionType": "dynamic",
              "dynamicExpressionType": "variable",
              "variableName": "name"
            }
          }
        ]
      }
    }
  }
]