{
  "type": "Function",
  "name": "test",
  "exported": true,
  "params": [
    {
      "name": "isVisible",
      "type": "boolean",
      "optional": false
    },
    {
      "name": "name",
      "type": "string",
      "optional": false
    },
    {
      "name": "title",
      "type": "string?",
      "optional": true
    }
  ],
  "body": [
    {
      "type": "Branch",
      "condition": {
        "type": "UnaryPredicate",
        "op": "!",
        "expr": {
          "type": "Var",
          "name": "isVisible"
        }
      },
      "then": {
        "type": "Terminal",
        "kind": "return",
        "value": {
          "type": "Const",
          "value": "undefined"
        }
      }
    },
    {
      "type": "Branch",
      "condition": {
        "type": "AndPredicate",
        "left": {
          "type": "ExistsPredicate",
          "value": {
            "type": "Var",
            "name": "title",
            "optional": true
          }
        },
        "right": {
          "type": "BinaryPredicate",
          "op": "!=",
          "left": {
            "type": "Var",
            "name": "title",
            "optional": true
          },
          "right": {
            "type": "Const",
            "value": "Dr"
          }
        }
      },
      "then": {
        "type": "Terminal",
        "kind": "throw",
        "error": {
          "type": "NewObject",
          "class": "Error",
          "args": [
            {
              "type": "Const",
              "value": "Title must be Dr or nil!"
            }
          ]
        }
      }
    },
    {
      "type": "Terminal",
      "kind": "return",
      "value": {
        "type": "TemplateString",
        "parts": [
          {
            "type": "Var",
            "name": "title",
            "optional": true
          },
          {
            "type": "Const",
            "value": " "
          },
          {
            "type": "Var",
            "name": "name"
          }
        ]
      }
    }
  ]
}