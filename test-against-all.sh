#!/usr/bin/env bash
set -euo pipefail

RUNNERS=(
  jest
  vitest
)

INPUT_FILES=(
  test/array-categorize-by-contains.ts
  test/array-categorize-by-length.ts
  test/array-includes-one.ts
  test/array-includes-value.ts
  test/array-is-empty.ts
  test/array-length-at-least-two.ts
  test/array-length-equals-one.ts
  test/array-length-not-two.ts
  test/boolean-constraints.ts
  test/call-flow.ts
  test/comparison-gt-ten.ts
  test/comparison-gte-zero.ts
  test/comparison-lt-zero.ts
  test/comparison-lte-five.ts
  test/equality-number-forty-two.ts
  test/equality-string-yes.ts
  test/if-falsy.ts
  test/if-truthy.ts
  test/if-true.ts
  test/testfile.ts
  test/import-test.ts
  test/is-array.ts
  test/is-boolean.ts
  test/is-defined.ts
  test/is-empty-string.ts
  test/is-false.ts
  test/is-nil.ts
  test/is-null.ts
  test/is-number.ts
  test/is-object.ts
  test/is-primitive.ts
  test/is-primitive-or.ts
  test/is-string.ts
  test/is-true.ts
  test/is-zero.ts
  test/logical-and-boolean.ts
  test/logical-not-flag.ts
  test/logical-or-boolean.ts
  test/null-equality.ts
  test/numeric-boundaries.ts
  test/noop.ts
  test/pure-falsy-number.ts
  test/pure-falsy-string.ts
  test/pure-truthy-object.ts
  test/pure-truthy-string.ts
  test/ternary-by-flag.ts
  test/ternary-by-number.ts
  test/throws-on-zero.ts
  test/truthy-object.ts
  test/truthy-string.ts
  test/typeguard-empty-string.ts
  test/typeguard-is-nil.ts
  test/typeof-number-check.ts
  test/typeof-string-check.ts
  test/undefined-equality.ts
)

GREEN='\033[0;32m'
RED='\033[0;31m'
BOLD='\033[1m'
RESET='\033[0m'

pass() { printf "${GREEN}✔ %s${RESET}\n" "$*"; }
fail() { printf "${RED}✖ %s${RESET}\n" "$*"; }
header() { printf "\n${BOLD}%s${RESET}\n" "$*"; }

FAILED=()

header "=== Generating test files ==="

for runner in "${RUNNERS[@]}"; do
  rm -f "generated/${runner}"/*.spec.ts

  for input in "${INPUT_FILES[@]}"; do
    # Derive output filename: strip leading path, swap extension, place under generated/<runner>/
    basename="${input##*/}"          # e.g. testfile.ts
    stem="${basename%.ts}"           # e.g. testfile
    output="generated/${runner}/${stem}.spec.ts"

    echo "  [${runner}] ${input} → ${output}"
    npx tsx src/cli.ts "$input" "$output" --runner "$runner"
  done
done

pass "Generation complete."

header "=== Running jest ==="
if npm run test:jest --silent; then
  pass "jest passed"
else
  fail "jest failed"
  FAILED+=(jest)
fi

header "=== Running vitest ==="
if npm run test:vitest --silent; then
  pass "vitest passed"
else
  fail "vitest failed"
  FAILED+=(vitest)
fi

header "=== Summary ==="

if [[ ${#FAILED[@]} -eq 0 ]]; then
  pass "All runners passed."
  exit 0
else
  fail "Failed runners: ${FAILED[*]}"
  exit 1
fi
