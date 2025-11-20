#!/bin/bash

# ProgressBrain Chatbot Verification Script
# Checks if all components are properly installed and configured

echo "======================================"
echo "ProgressBrain Chatbot Verification"
echo "======================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

CHECKS_PASSED=0
CHECKS_FAILED=0

# Function to check if file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} Found: $1"
        ((CHECKS_PASSED++))
    else
        echo -e "${RED}✗${NC} Missing: $1"
        ((CHECKS_FAILED++))
    fi
}

# Function to check if command exists
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✓${NC} Installed: $1"
        ((CHECKS_PASSED++))
    else
        echo -e "${RED}✗${NC} Not installed: $1"
        ((CHECKS_FAILED++))
    fi
}

# Function to check if port is available
check_port() {
    if netstat -an 2>/dev/null | grep -q ":$1 "; then
        echo -e "${YELLOW}!${NC} Port $1 is in use (service might be running)"
    else
        echo -e "${GREEN}✓${NC} Port $1 is available"
    fi
}

# Function to check environment variable
check_env() {
    if grep -q "^$1=" server/.env 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Environment variable set: $1"
        ((CHECKS_PASSED++))
    else
        echo -e "${RED}✗${NC} Environment variable missing: $1"
        ((CHECKS_FAILED++))
    fi
}

echo "1. Checking Required Files..."
echo "---"
check_file "server/chatbot/chatbot_context.py"
check_file "server/chatbot/chatbot_service.py"
check_file "server/chatbot/app.py"
check_file "server/chatbot/requirements.txt"
check_file "server/routes/chatbotRoutes.js"
check_file "client/src/components/ChatBot.jsx"
check_file "server/.env"
echo ""

echo "2. Checking Required Commands..."
echo "---"
check_command "python"
check_command "python3"
check_command "npm"
check_command "node"
echo ""

echo "3. Checking Python Packages..."
echo "---"
if python3 -c "import flask" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Flask installed"
    ((CHECKS_PASSED++))
else
    echo -e "${YELLOW}!${NC} Flask not installed (run: pip install -r server/chatbot/requirements.txt)"
    ((CHECKS_FAILED++))
fi

if python3 -c "import google.generativeai" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} google-generativeai installed"
    ((CHECKS_PASSED++))
else
    echo -e "${YELLOW}!${NC} google-generativeai not installed (run: pip install -r server/chatbot/requirements.txt)"
    ((CHECKS_FAILED++))
fi

if python3 -c "import flask_cors" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} flask-cors installed"
    ((CHECKS_PASSED++))
else
    echo -e "${YELLOW}!${NC} flask-cors not installed (run: pip install -r server/chatbot/requirements.txt)"
    ((CHECKS_FAILED++))
fi
echo ""

echo "4. Checking Node Packages..."
echo "---"
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} node_modules exists"
    ((CHECKS_PASSED++))
else
    echo -e "${YELLOW}!${NC} node_modules missing (run: npm install)"
    ((CHECKS_FAILED++))
fi

if [ -d "client/node_modules" ]; then
    echo -e "${GREEN}✓${NC} client/node_modules exists"
    ((CHECKS_PASSED++))
else
    echo -e "${YELLOW}!${NC} client/node_modules missing (run: cd client && npm install)"
    ((CHECKS_FAILED++))
fi
echo ""

echo "5. Checking Environment Configuration..."
echo "---"
check_env "PORT"
check_env "MONGO_URI"
check_env "JWT_SECRET"

if grep -q "^GEMINI_API_KEY=" server/.env; then
    if grep -q "GEMINI_API_KEY=your_gemini_api_key_here" server/.env; then
        echo -e "${RED}✗${NC} GEMINI_API_KEY not configured (needs your actual key)"
        ((CHECKS_FAILED++))
    else
        echo -e "${GREEN}✓${NC} GEMINI_API_KEY is configured"
        ((CHECKS_PASSED++))
    fi
else
    echo -e "${RED}✗${NC} GEMINI_API_KEY missing in .env"
    ((CHECKS_FAILED++))
fi
echo ""

echo "6. Checking Port Availability..."
echo "---"
check_port "5000"
check_port "5001"
check_port "5173"
echo ""

echo "7. Checking Configuration Files..."
echo "---"
if [ -f "server/server.js" ] && grep -q "chatbotRoutes" server/server.js; then
    echo -e "${GREEN}✓${NC} Chatbot routes imported in server.js"
    ((CHECKS_PASSED++))
else
    echo -e "${RED}✗${NC} Chatbot routes not imported in server.js"
    ((CHECKS_FAILED++))
fi

if [ -f "client/src/components/ChatBot.jsx" ] && grep -q "API.post" client/src/components/ChatBot.jsx; then
    echo -e "${GREEN}✓${NC} ChatBot component uses real API"
    ((CHECKS_PASSED++))
else
    echo -e "${YELLOW}!${NC} ChatBot component may not use real API"
    ((CHECKS_FAILED++))
fi
echo ""

echo "======================================"
echo "Verification Summary"
echo "======================================"
echo -e "${GREEN}Passed: $CHECKS_PASSED${NC}"
echo -e "${RED}Failed: $CHECKS_FAILED${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! You're ready to go.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Get Gemini API key from: https://aistudio.google.com/app/apikey"
    echo "2. Update GEMINI_API_KEY in server/.env"
    echo "3. Start the chatbot service: python server/chatbot/app.py"
    echo "4. Start the backend: npm start"
    echo "5. Start the frontend: cd client && npm run dev"
    echo "6. Visit: http://localhost:5173"
else
    echo -e "${RED}✗ Some checks failed. Please fix the issues above.${NC}"
    echo ""
    echo "Common fixes:"
    echo "- Install Python dependencies: pip install -r server/chatbot/requirements.txt"
    echo "- Install Node dependencies: npm install && cd client && npm install"
    echo "- Add GEMINI_API_KEY to server/.env"
    echo "- Check that ports 5000, 5001, 5173 are not in use"
fi
echo ""
