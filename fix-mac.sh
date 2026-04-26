#!/bin/bash
# Mac-compatible color fix — run from project root

echo "Fixing hub accent (Study Hub purple icons)..."
sed -i '' 's/--hub-accent: #7c6df0/--hub-accent: #DC5F14/g' src/index.css
sed -i '' 's/rgba(124, 109, 240, 0.3)/rgba(220, 95, 20, 0.3)/g' src/index.css

echo "Fixing remaining purple in pages..."
sed -i '' 's/border-t-violet-500/border-t-orange-500/g' src/pages/Success.jsx
sed -i '' 's/border-l-violet-500/border-l-orange-500/g' src/pages/Profile.jsx
sed -i '' 's/shadow-purple-900/shadow-orange-900/g' src/pages/LandingPage.jsx
sed -i '' 's/via-purple-900/via-orange-900/g' src/pages/ReferralPage.jsx
sed -i '' 's/via-purple-600/via-orange-700/g' src/pages/Shop.jsx
sed -i '' 's/via-purple-900/via-orange-800/g' src/pages/Pricing.jsx
sed -i '' 's/via-indigo-500/via-orange-700/g' src/pages/Schools.jsx
sed -i '' 's/from-blue-600/from-orange-800/g' src/pages/Schools.jsx

echo "✅ Done! Run: npm start"
