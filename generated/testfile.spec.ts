{
  "type": "IRFunction",
  "name": "test",
  "params": [
    "isVisible",
    "name",
    "title"
  ],
  "body": [
    {
      "type": "IRIf",
      "condition": {
        "type": "IRUnary",
        "op": "!",
        "expr": {
          "type": "IRVar",
          "name": "isVisible"
        }
      },
      "then": [
        {
          "type": "IRReturn",
          "value": {
            "type": "IRVar",
            "name": "undefined"
          }
        }
      ]
    },
    {
      "type": "IRIf",
      "condition": {
        "type": "IRBinary",
        "op": "&&",
        "left": {
          "type": "IRVar",
          "name": "title"
        },
        "right": {
          "type": "IRBinary",
          "op": "!==",
          "left": {
            "type": "IRVar",
            "name": "title"
          },
          "right": {
            "type": "IRConst",
            "value": "Dr"
          }
        }
      },
      "then": [
        {
          "type": "IRThrow",
          "error": {
            "type": "IRNew",
            "class": "Error",
            "args": [
              {
                "type": "IRConst",
                "value": "Title must be Dr or nil!"
              }
            ]
          }
        }
      ]
    },
    {
      "type": "IRReturn",
      "value": {
        "type": "IRTemplate",
        "parts": [
          {
            "type": "IRVar",
            "name": "title"
          },
          {
            "type": "IRConst",
            "value": " "
          },
          {
            "type": "IRVar",
            "name": "name"
          }
        ]
      }
    }
  ]
}