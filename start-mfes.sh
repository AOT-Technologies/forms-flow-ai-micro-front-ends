#!/usr/bin/env bash
#
# start-mfes.sh — launch the formsflow micro-frontends, each in its own
# VS Code integrated terminal.
#
# Usage:
#   ./start-mfes.sh              # asks whether to run `npm install` first
#   ./start-mfes.sh --install    # skip the question: install + start
#   ./start-mfes.sh --no-install # skip the question: start only
#
# Requires: macOS + VS Code. The first run will ask you to grant
# "Accessibility" permission to Visual Studio Code (needed to open
# terminals via simulated keystrokes).

set -u

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

MFES=(
  forms-flow-admin
  forms-flow-components
  forms-flow-nav
  forms-flow-review
  forms-flow-service
  forms-flow-submissions
  forms-flow-theme
)

# Seconds to wait after opening a terminal before typing into it.
SPAWN_DELAY="${SPAWN_DELAY:-0.8}"

if [[ "$(uname)" != "Darwin" ]]; then
  echo "This script only supports macOS (it uses AppleScript to drive VS Code)." >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# 1. Single question: run npm install for all micro-frontends?
# ---------------------------------------------------------------------------
RUN_INSTALL=""
case "${1:-}" in
  --install)    RUN_INSTALL="yes" ;;
  --no-install) RUN_INSTALL="no" ;;
  "") ;;
  *) echo "Unknown option: $1 (use --install or --no-install)" >&2; exit 1 ;;
esac

if [[ -z "$RUN_INSTALL" ]]; then
  read -r -p "Run 'npm install' for ALL micro-frontends before starting? [y/N] " answer
  case "$answer" in
    [yY]|[yY][eE][sS]) RUN_INSTALL="yes" ;;
    *)                 RUN_INSTALL="no" ;;
  esac
fi

# ---------------------------------------------------------------------------
# 2. Sanity checks
# ---------------------------------------------------------------------------
for mfe in "${MFES[@]}"; do
  if [[ ! -d "$REPO_ROOT/$mfe" ]]; then
    echo "ERROR: folder not found: $REPO_ROOT/$mfe" >&2
    exit 1
  fi
done

if [[ "$RUN_INSTALL" == "no" ]]; then
  for mfe in "${MFES[@]}"; do
    if [[ ! -d "$REPO_ROOT/$mfe/node_modules" ]]; then
      echo "WARNING: $mfe has no node_modules — 'npm start' may fail there." >&2
    fi
  done
fi

# ---------------------------------------------------------------------------
# 3. Spawn one VS Code integrated terminal per micro-frontend
# ---------------------------------------------------------------------------
# Bundle id of the IDE hosting this terminal (falls back to stock VS Code).
BUNDLE_ID="${__CFBundleIdentifier:-com.microsoft.VSCode}"

spawn_terminal() {
  local cmd="$1"
  osascript - "$BUNDLE_ID" "$cmd" "$SPAWN_DELAY" <<'OSA' 2>&1
on run argv
  set bid to item 1 of argv
  set shellCmd to item 2 of argv
  set spawnDelay to (item 3 of argv) as real
  tell application id bid to activate
  delay 0.3
  tell application "System Events"
    set procName to name of first application process whose bundle identifier is bid
    tell process procName
      set frontmost to true
      -- Ctrl+Shift+` : "Terminal: Create New Terminal" (default macOS keybinding)
      keystroke "`" using {control down, shift down}
      delay spawnDelay
      keystroke shellCmd
      delay 0.2
      keystroke return
    end tell
  end tell
end run
OSA
}

echo
if [[ "$RUN_INSTALL" == "yes" ]]; then
  echo "Opening one terminal per micro-frontend: npm install && npm start"
else
  echo "Opening one terminal per micro-frontend: npm start"
fi
echo "Don't touch the keyboard/mouse until all terminals are open."
echo

for mfe in "${MFES[@]}"; do
  if [[ "$RUN_INSTALL" == "yes" ]]; then
    cmd="cd '$REPO_ROOT/$mfe' && npm install && npm start"
  else
    cmd="cd '$REPO_ROOT/$mfe' && npm start"
  fi

  echo "  -> $mfe"
  output="$(spawn_terminal "$cmd")"
  if [[ $? -ne 0 ]]; then
    echo >&2
    echo "ERROR: could not open a terminal via AppleScript." >&2
    echo "Details: $output" >&2
    echo >&2
    echo "Most likely fix: grant Accessibility permission to your IDE:" >&2
    echo "  System Settings > Privacy & Security > Accessibility > enable 'Visual Studio Code'" >&2
    echo "then re-run this script." >&2
    exit 1
  fi
  # Small stagger so keystrokes never land in the wrong terminal.
  sleep 0.4
done

echo
echo "All ${#MFES[@]} micro-frontends launched."
