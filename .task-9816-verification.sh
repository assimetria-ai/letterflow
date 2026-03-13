#!/bin/bash
# Task #9816 - Auth System Verification Script

echo "=================================="
echo "Auth System Verification - Task #9816"
echo "=================================="
echo ""

# Check backend auth routes
echo "✓ Checking Backend Auth Routes..."
echo ""

# Check sessions (login)
if grep -q "POST /api/sessions" server/src/api/@system/sessions/index.js; then
  echo "  ✅ Login endpoint exists (POST /api/sessions)"
else
  echo "  ❌ Login endpoint missing"
fi

# Check user registration
if grep -q "POST /api/users" server/src/api/@system/user/index.js; then
  echo "  ✅ Register endpoint exists (POST /api/users)"
else
  echo "  ❌ Register endpoint missing"
fi

# Check password reset request
if grep -q "POST /api/users/password/request" server/src/api/@system/user/index.js; then
  echo "  ✅ Password reset request endpoint exists"
else
  echo "  ❌ Password reset request endpoint missing"
fi

# Check password reset completion
if grep -q "POST /api/users/password/reset" server/src/api/@system/user/index.js; then
  echo "  ✅ Password reset completion endpoint exists"
else
  echo "  ❌ Password reset completion endpoint missing"
fi

# Check OAuth routes
if grep -q "GET /api/auth/google" server/src/api/@system/oauth/index.js; then
  echo "  ✅ OAuth Google endpoint exists"
else
  echo "  ❌ OAuth Google endpoint missing"
fi

if grep -q "GET /api/auth/github" server/src/api/@system/oauth/index.js; then
  echo "  ✅ OAuth GitHub endpoint exists"
else
  echo "  ❌ OAuth GitHub endpoint missing"
fi

echo ""
echo "✓ Checking Frontend Auth Pages..."
echo ""

# Check frontend pages
if [ -f "client/src/app/pages/static/@system/LoginPage.jsx" ]; then
  echo "  ✅ LoginPage.jsx exists"
else
  echo "  ❌ LoginPage.jsx missing"
fi

if [ -f "client/src/app/pages/static/@system/RegisterPage.jsx" ]; then
  echo "  ✅ RegisterPage.jsx exists"
else
  echo "  ❌ RegisterPage.jsx missing"
fi

if [ -f "client/src/app/pages/static/@system/ForgotPasswordPage.jsx" ]; then
  echo "  ✅ ForgotPasswordPage.jsx exists"
else
  echo "  ❌ ForgotPasswordPage.jsx missing"
fi

if [ -f "client/src/app/pages/static/@system/ResetPasswordPage.jsx" ]; then
  echo "  ✅ ResetPasswordPage.jsx exists"
else
  echo "  ❌ ResetPasswordPage.jsx missing"
fi

if [ -f "client/src/app/components/@system/OAuthButtons/OAuthButtons.jsx" ]; then
  echo "  ✅ OAuthButtons.jsx component exists"
else
  echo "  ❌ OAuthButtons.jsx component missing"
fi

echo ""
echo "✓ Checking Route Configuration..."
echo ""

# Check routes
if grep -q "path=\"/login\"" client/src/app/routes/@system/AppRoutes.jsx; then
  echo "  ✅ /login route configured"
else
  echo "  ❌ /login route missing"
fi

if grep -q "path=\"/register\"" client/src/app/routes/@system/AppRoutes.jsx; then
  echo "  ✅ /register route configured"
else
  echo "  ❌ /register route missing"
fi

if grep -q "path=\"/forgot-password\"" client/src/app/routes/@system/AppRoutes.jsx; then
  echo "  ✅ /forgot-password route configured"
else
  echo "  ❌ /forgot-password route missing"
fi

if grep -q "path=\"/reset-password\"" client/src/app/routes/@system/AppRoutes.jsx; then
  echo "  ✅ /reset-password route configured"
else
  echo "  ❌ /reset-password route missing"
fi

echo ""
echo "✓ Checking Component Implementations..."
echo ""

# Check if pages have actual implementation (not just imports)
if grep -q "function LoginPage" client/src/app/pages/static/@system/LoginPage.jsx; then
  echo "  ✅ LoginPage is implemented"
else
  echo "  ❌ LoginPage is not implemented"
fi

if grep -q "function RegisterPage" client/src/app/pages/static/@system/RegisterPage.jsx; then
  echo "  ✅ RegisterPage is implemented"
else
  echo "  ❌ RegisterPage is not implemented"
fi

if grep -q "function ForgotPasswordPage" client/src/app/pages/static/@system/ForgotPasswordPage.jsx; then
  echo "  ✅ ForgotPasswordPage is implemented"
else
  echo "  ❌ ForgotPasswordPage is not implemented"
fi

if grep -q "function ResetPasswordPage" client/src/app/pages/static/@system/ResetPasswordPage.jsx; then
  echo "  ✅ ResetPasswordPage is implemented"
else
  echo "  ❌ ResetPasswordPage is not implemented"
fi

if grep -q "function OAuthButtons" client/src/app/components/@system/OAuthButtons/OAuthButtons.jsx; then
  echo "  ✅ OAuthButtons is implemented"
else
  echo "  ❌ OAuthButtons is not implemented"
fi

echo ""
echo "=================================="
echo "VERIFICATION COMPLETE"
echo "=================================="
echo ""
