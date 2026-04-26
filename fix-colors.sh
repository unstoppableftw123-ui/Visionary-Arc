#!/bin/bash
# Run from your project root: bash fix-colors.sh
# Replaces all purple/violet/indigo Tailwind classes with orange brand palette
# Skips: rank colors, competitions/, teacher/, track-content color

SRC="./src"

# Files to SKIP (rank system, track colors, competitions, teacher phase 2)
SKIP_PATTERN="rewardsProgram|ranks\.js|competitions/|teacher/|node_modules|\.git"

echo "🎨 Starting color purge..."

find "$SRC" \( -name "*.jsx" -o -name "*.tsx" -o -name "*.js" -o -name "*.ts" -o -name "*.css" \) | \
grep -vE "$SKIP_PATTERN" | \
while read file; do

  # Skip binary files
  file "$file" | grep -q "text" || continue

  sed -i.bak \
    `# ── Solid backgrounds ──────────────────────────────` \
    -e 's/bg-violet-600/bg-orange-600/g' \
    -e 's/bg-violet-700/bg-orange-700/g' \
    -e 's/bg-violet-500/bg-orange-600/g' \
    -e 's/bg-purple-600/bg-orange-600/g' \
    -e 's/bg-purple-700/bg-orange-700/g' \
    -e 's/bg-purple-500/bg-orange-600/g' \
    -e 's/bg-indigo-600/bg-orange-600/g' \
    -e 's/bg-indigo-700/bg-orange-700/g' \
    -e 's/bg-indigo-500/bg-orange-600/g' \
    `# ── Light tint backgrounds ─────────────────────────` \
    -e 's/bg-violet-[0-9]*\/[0-9]*/bg-orange-600\/10/g' \
    -e 's/bg-purple-[0-9]*\/[0-9]*/bg-orange-600\/10/g' \
    -e 's/bg-indigo-[0-9]*\/[0-9]*/bg-orange-600\/10/g' \
    -e 's/dark:bg-violet-[0-9]*\/[0-9]*/dark:bg-orange-600\/10/g' \
    -e 's/dark:bg-purple-[0-9]*\/[0-9]*/dark:bg-orange-600\/10/g' \
    -e 's/dark:bg-indigo-[0-9]*\/[0-9]*/dark:bg-orange-600\/10/g' \
    -e 's/bg-violet-[0-9]*/bg-orange-600\/10/g' \
    -e 's/bg-purple-[0-9]*/bg-orange-600\/10/g' \
    -e 's/bg-indigo-[0-9]*/bg-orange-600\/10/g' \
    `# ── Text colors ────────────────────────────────────` \
    -e 's/text-violet-[0-9]*/text-orange-400/g' \
    -e 's/text-purple-[0-9]*/text-orange-400/g' \
    -e 's/text-indigo-[0-9]*/text-orange-400/g' \
    -e 's/dark:text-violet-[0-9]*/dark:text-orange-400/g' \
    -e 's/dark:text-purple-[0-9]*/dark:text-orange-400/g' \
    -e 's/dark:text-indigo-[0-9]*/dark:text-orange-400/g' \
    `# ── Border colors ──────────────────────────────────` \
    -e 's/border-violet-[0-9]*\/[0-9]*/border-orange-500\/30/g' \
    -e 's/border-purple-[0-9]*\/[0-9]*/border-orange-500\/30/g' \
    -e 's/border-indigo-[0-9]*\/[0-9]*/border-orange-500\/30/g' \
    -e 's/dark:border-violet-[0-9]*/dark:border-orange-500\/30/g' \
    -e 's/dark:border-purple-[0-9]*/dark:border-orange-500\/30/g' \
    -e 's/dark:border-indigo-[0-9]*/dark:border-orange-500\/30/g' \
    -e 's/border-violet-[0-9]*/border-orange-500\/30/g' \
    -e 's/border-purple-[0-9]*/border-orange-500\/30/g' \
    -e 's/border-indigo-[0-9]*/border-orange-500\/30/g' \
    `# ── Gradient from ──────────────────────────────────` \
    -e 's/from-violet-[0-9]*\/[0-9]*/from-orange-900\/30/g' \
    -e 's/from-purple-[0-9]*\/[0-9]*/from-orange-900\/30/g' \
    -e 's/from-indigo-[0-9]*\/[0-9]*/from-orange-900\/30/g' \
    -e 's/dark:from-violet-[0-9]*\/[0-9]*/dark:from-orange-900\/20/g' \
    -e 's/dark:from-purple-[0-9]*\/[0-9]*/dark:from-orange-900\/20/g' \
    -e 's/dark:from-indigo-[0-9]*\/[0-9]*/dark:from-orange-900\/20/g' \
    -e 's/from-violet-[0-9]*/from-orange-700/g' \
    -e 's/from-purple-[0-9]*/from-orange-700/g' \
    -e 's/from-indigo-[0-9]*/from-orange-700/g' \
    `# ── Gradient to ────────────────────────────────────` \
    -e 's/to-violet-[0-9]*\/[0-9]*/to-orange-950\/20/g' \
    -e 's/to-purple-[0-9]*\/[0-9]*/to-orange-950\/20/g' \
    -e 's/to-indigo-[0-9]*\/[0-9]*/to-orange-950\/20/g' \
    -e 's/dark:to-violet-[0-9]*/dark:to-orange-950\/20/g' \
    -e 's/dark:to-purple-[0-9]*/dark:to-orange-950\/20/g' \
    -e 's/dark:to-indigo-[0-9]*/dark:to-orange-950\/20/g' \
    -e 's/to-violet-[0-9]*/to-orange-600/g' \
    -e 's/to-purple-[0-9]*/to-orange-600/g' \
    -e 's/to-indigo-[0-9]*/to-orange-600/g' \
    `# ── Hover states ───────────────────────────────────` \
    -e 's/hover:bg-violet-[0-9]*/hover:bg-orange-700/g' \
    -e 's/hover:bg-purple-[0-9]*/hover:bg-orange-700/g' \
    -e 's/hover:bg-indigo-[0-9]*/hover:bg-orange-700/g' \
    -e 's/hover:from-violet-[0-9]*/hover:from-orange-600/g' \
    -e 's/hover:from-purple-[0-9]*/hover:from-orange-600/g' \
    -e 's/hover:from-indigo-[0-9]*/hover:from-orange-600/g' \
    -e 's/hover:to-violet-[0-9]*/hover:to-orange-700/g' \
    -e 's/hover:to-purple-[0-9]*/hover:to-orange-700/g' \
    -e 's/hover:to-indigo-[0-9]*/hover:to-orange-700/g' \
    -e 's/hover:text-violet-[0-9]*/hover:text-orange-300/g' \
    -e 's/hover:text-purple-[0-9]*/hover:text-orange-300/g' \
    -e 's/hover:text-indigo-[0-9]*/hover:text-orange-300/g' \
    `# ── Ring/shadow ────────────────────────────────────` \
    -e 's/ring-violet-[0-9]*/ring-orange-500/g' \
    -e 's/ring-purple-[0-9]*/ring-orange-500/g' \
    -e 's/ring-indigo-[0-9]*/ring-orange-500/g' \
    `# ── Hex colors ─────────────────────────────────────` \
    -e 's/#8B5CF6/var(--accent)/g' \
    -e 's/#7C3D12/var(--accent)/g' \
    -e 's/rgba(139,92,246/rgba(220,95,20/g' \
    -e 's/rgba(139, 92, 246/rgba(220, 95, 20/g' \
    "$file"

  # Remove backup if file was changed
  if ! diff -q "$file" "$file.bak" > /dev/null 2>&1; then
    echo "  ✓ Fixed: $file"
    rm "$file.bak"
  else
    rm "$file.bak"
  fi
done

# Restore rank-b color that got caught (--rank-b should stay #A855F7)
echo ""
echo "🔧 Restoring rank colors..."
find "$SRC" -name "design-system.css" | while read f; do
  sed -i 's/--rank-b: var(--accent)/--rank-b: #A855F7/g' "$f"
done

echo ""
echo "✅ Done! Restart your dev server: npm start"
