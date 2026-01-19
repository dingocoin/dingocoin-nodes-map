#!/bin/bash
# Quick test script for local verification

echo "╔════════════════════════════════════════════╗"
echo "║   Local Verification Binary Test          ║"
echo "╚════════════════════════════════════════════╝"
echo ""

echo "📦 Checking local binaries..."
if [ -f "apps/web/public/verify/verify-linux-amd64" ]; then
    echo "✓ Binary exists: apps/web/public/verify/verify-linux-amd64"
    ls -lh apps/web/public/verify/ | grep verify-
else
    echo "✗ Binaries not found. Run: cd tools/verify && ./build.sh"
    exit 1
fi

echo ""
echo "🔍 Testing binary configuration..."
./apps/web/public/verify/verify-linux-amd64 2>&1 | head -15

echo ""
echo "🌐 To test with Docker:"
echo "  1. make docker-dev"
echo "  2. curl http://localhost:4000/verify/verify-linux-amd64 -o test-verify"
echo "  3. chmod +x test-verify && ./test-verify"
echo ""
echo "✅ Local binaries are ready!"
echo "   When you push to GitHub, they'll be built automatically in CI/CD."
