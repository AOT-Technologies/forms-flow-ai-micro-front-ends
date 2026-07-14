#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# bump-release-version-mac.command
# Updates the release version in:
#   • VERSION           — global replace, all occurrences
#   • **/package.json   — replace within first 11 lines only (skips node_modules)
#   • **/package-lock.json — same
# ---------------------------------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

VERSION_FILE="$REPO_ROOT/VERSION"

# ---------------------------------------------------------------------------
# Read current version
# ---------------------------------------------------------------------------
if [ ! -f "$VERSION_FILE" ]; then
    echo "ERROR: VERSION file not found at $REPO_ROOT/VERSION"
    read -rp "Press any key to close..." _; exit 1
fi

CURRENT_RAW="$(tr -d '[:space:]' < "$VERSION_FILE")"
CURRENT_VERSION="${CURRENT_RAW#v}"

echo "Repo root      : $REPO_ROOT"
echo "Current version: $CURRENT_VERSION"
echo ""

# ---------------------------------------------------------------------------
# Prompt for new version (GUI dialog; fall back to terminal if unavailable)
# ---------------------------------------------------------------------------
NEW_VERSION=""

if command -v osascript &>/dev/null; then
    NEW_VERSION="$(osascript 2>/dev/null <<APPLESCRIPT
tell application "System Events"
    set dlg to display dialog "This tool updates the release version across all module package.json, package-lock.json, and the root VERSION file in this repository." & return & return & "Current version: $CURRENT_VERSION" & return & "Enter new release version:" ¬
        default answer "$CURRENT_VERSION" ¬
        with title "Version Bump" ¬
        buttons {"Cancel", "OK"} default button "OK"
    return text returned of dlg
end tell
APPLESCRIPT
    )"
    OSACODE=$?
    if [ $OSACODE -ne 0 ]; then
        echo "Cancelled."
        read -rp "Press any key to close..." _; exit 0
    fi
else
    read -rp "Enter new version [$CURRENT_VERSION]: " NEW_VERSION
    NEW_VERSION="${NEW_VERSION:-$CURRENT_VERSION}"
fi

# Strip leading v and whitespace
NEW_VERSION="$(echo "$NEW_VERSION" | tr -d '[:space:]')"
NEW_VERSION="${NEW_VERSION#v}"

if [ -z "$NEW_VERSION" ]; then
    echo "Cancelled (empty input)."
    read -rp "Press any key to close..." _; exit 0
fi

# ---------------------------------------------------------------------------
# Validate: X.Y.Z or X.Y.Z-<alphanumeric>
# ---------------------------------------------------------------------------
if ! echo "$NEW_VERSION" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9]+)?$'; then
    echo "ERROR: Invalid version '$NEW_VERSION'."
    echo "       Must match X.Y.Z or X.Y.Z-<alphanumeric suffix> (e.g. 8.4.0, 8.4.0-rc)."
    read -rp "Press any key to close..." _; exit 1
fi

if [ "$NEW_VERSION" = "$CURRENT_VERSION" ]; then
    echo "No change needed — version is already $CURRENT_VERSION."
    read -rp "Press any key to close..." _; exit 0
fi

echo "Bumping: $CURRENT_VERSION  →  $NEW_VERSION"
echo ""

export OLD_VER="$CURRENT_VERSION"
export NEW_VER="$NEW_VERSION"

UPDATED=0; SKIPPED=0; FAILED=0

# ---------------------------------------------------------------------------
# Discover all package.json and package-lock.json (exclude node_modules)
# mapfile is bash 4+ only; use while-read loop for macOS bash 3.2 compatibility
# ---------------------------------------------------------------------------
PKG_JSON_FILES=()
while IFS= read -r f; do
    PKG_JSON_FILES+=("$f")
done < <(find "$REPO_ROOT" -name "package.json" -not -path "*/node_modules/*" | sort)

PKG_LOCK_FILES=()
while IFS= read -r f; do
    PKG_LOCK_FILES+=("$f")
done < <(find "$REPO_ROOT" -name "package-lock.json" -not -path "*/node_modules/*" | sort)

TOTAL=$(( 1 + ${#PKG_JSON_FILES[@]} + ${#PKG_LOCK_FILES[@]} ))

# ---------------------------------------------------------------------------
# Helper — global replace (all lines), for VERSION
# ---------------------------------------------------------------------------
replace_global() {
    local file="$1"
    local label="$2"
    if ! grep -qF "$OLD_VER" "$file"; then
        printf "  [SKIPPED] %s (version string not found)\n" "$label"
        SKIPPED=$((SKIPPED + 1)); return
    fi
    if perl -i -pe 's/\Q$ENV{OLD_VER}\E/$ENV{NEW_VER}/g' "$file" 2>/dev/null; then
        printf "  [UPDATED] %s\n" "$label"
        UPDATED=$((UPDATED + 1))
    else
        printf "  [FAILED]  %s\n" "$label"
        FAILED=$((FAILED + 1))
    fi
}

# ---------------------------------------------------------------------------
# Helper — replace within first 11 lines only, for JSON manifests
# ---------------------------------------------------------------------------
replace_top11() {
    local file="$1"
    local label="$2"
    if ! head -11 "$file" | grep -qF "$OLD_VER"; then
        printf "  [SKIPPED] %s (version string not found in first 11 lines)\n" "$label"
        SKIPPED=$((SKIPPED + 1)); return
    fi
    if perl -i -pe 'if ($. <= 11) { s/\Q$ENV{OLD_VER}\E/$ENV{NEW_VER}/g }' "$file" 2>/dev/null; then
        printf "  [UPDATED] %s\n" "$label"
        UPDATED=$((UPDATED + 1))
    else
        printf "  [FAILED]  %s\n" "$label"
        FAILED=$((FAILED + 1))
    fi
}

# ---------------------------------------------------------------------------
# Run updates
# ---------------------------------------------------------------------------
echo "── VERSION ──────────────────────────────────────"
replace_global "$VERSION_FILE" "VERSION"

echo ""
echo "── package.json ($( echo "${#PKG_JSON_FILES[@]}" ) files found) ──────────────────────"
for f in "${PKG_JSON_FILES[@]}"; do
    rel="${f#$REPO_ROOT/}"
    replace_top11 "$f" "$rel"
done

echo ""
echo "── package-lock.json ($( echo "${#PKG_LOCK_FILES[@]}" ) files found) ───────────────────"
for f in "${PKG_LOCK_FILES[@]}"; do
    rel="${f#$REPO_ROOT/}"
    replace_top11 "$f" "$rel"
done

echo ""
echo "Summary: $UPDATED / $TOTAL file(s) updated ($SKIPPED skipped)"
echo ""
read -rp "Press any key to close..." _
