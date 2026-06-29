{
  "type": "CFG",
  "function": "test",
  "entry": "N0",
  "exit": "N1",
  "nodes": [
    {
      "id": "N0",
      "type": "Entry"
    },
    {
      "id": "N1",
      "type": "Exit"
    },
    {
      "id": "N2",
      "type": "Branch",
      "condition": {
        "text": "!isVisible",
        "expr": {
          "type": "IRUnary",
          "op": "!",
          "expr": {
            "type": "IRVar",
            "name": "isVisible"
          }
        }
      }
    },
    {
      "id": "N3",
      "type": "Return",
      "value": {
        "text": "undefined",
        "expr": {
          "type": "IRVar",
          "name": "undefined"
        }
      }
    },
    {
      "id": "N4",
      "type": "Branch",
      "condition": {
        "text": "title and title !== 'Dr'",
        "expr": {
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
        }
      }
    },
    {
      "id": "N5",
      "type": "Throw",
      "error": {
        "text": "Error('Title must be Dr or nil!')",
        "expr": {
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
    },
    {
      "id": "N6",
      "type": "Return",
      "value": {
        "text": "`${title} ${name}`",
        "expr": {
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
    }
  ],
  "edges": [
    {
      "from": "N0",
      "to": "N2"
    },
    {
      "from": "N2",
      "to": "N3",
      "label": "true"
    },
    {
      "from": "N3",
      "to": "N1"
    },
    {
      "from": "N2",
      "to": "N4",
      "label": "false"
    },
    {
      "from": "N4",
      "to": "N5",
      "label": "true"
    },
    {
      "from": "N5",
      "to": "N1"
    },
    {
      "from": "N4",
      "to": "N6",
      "label": "false"
    },
    {
      "from": "N6",
      "to": "N1"
    }
  ]
}