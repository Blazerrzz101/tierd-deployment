#!/bin/bash

# Set colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Verifying product links...${NC}"

# Make sure we're in the project root
cd "$(dirname "$0")/.." || { 
  echo -e "${RED}Failed to navigate to project root${NC}"
  exit 1
}

# Check if Next.js dev server is running and kill it
if lsof -ti:3000 &>/dev/null; then
  echo -e "${YELLOW}Stopping existing Next.js server on port 3000...${NC}"
  kill -9 $(lsof -ti:3000) &>/dev/null
  sleep 2
fi

# List of specialized product routes to verify
SPECIALIZED_ROUTES=(
  "hyperx-cloud-alpha"
  "ducky-one-3"
  "secretlab-titan-evo"
  "asus-pg279qm"
  "steelseries-arctis-7"
  "keychron-q1"
  "zowie-ec2"
  "logitech-g502"
  "razer-viper-v2"
  "finalmouse-starlight"
  "lg-27gp950"
  "glorious-model-o"
  "logitech-g-pro-superlight"
)

# List of dynamic route products to verify
DYNAMIC_ROUTES=(
  "beyerdynamic-mmx300"
  "corsair-k100"
  "acer-predator-x28"
)

echo -e "${YELLOW}Starting development server for testing...${NC}"
echo -e "${BLUE}Server will start in the background. Press Ctrl+C to stop it when done.${NC}"

# Start the Next.js server in the background
npm run dev &
server_pid=$!

# Wait for server to start
echo -e "${YELLOW}Waiting for server to start...${NC}"
sleep 10

# Function to check if a URL returns a valid response
check_url() {
  local url="$1"
  local description="$2"
  local max_retries=3
  local retry_count=0
  
  while [ $retry_count -lt $max_retries ]; do
    # Use curl to check the HTTP status code
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000${url}")
    
    if [ "$status_code" = "200" ]; then
      echo -e "${GREEN}✓${NC} $description: ${GREEN}OK${NC} (Status $status_code)"
      return 0
    else
      retry_count=$((retry_count + 1))
      if [ $retry_count -lt $max_retries ]; then
        echo -e "${YELLOW}⚠ Retrying $description ($retry_count of $max_retries)...${NC}"
        sleep 2
      else
        echo -e "${RED}✗${NC} $description: ${RED}FAILED${NC} (Status $status_code)"
        return 1
      fi
    fi
  done
}

# Check home page
check_url "/" "Home Page"

echo -e "\n${BLUE}Checking specialized product routes:${NC}"
for route in "${SPECIALIZED_ROUTES[@]}"; do
  check_url "/products/$route" "Specialized Route: $route"
done

echo -e "\n${BLUE}Checking dynamic product routes:${NC}"
for route in "${DYNAMIC_ROUTES[@]}"; do
  check_url "/products/$route" "Dynamic Route: $route"
done

echo -e "\n${GREEN}Verification complete!${NC}"
echo -e "${YELLOW}Press Enter to stop the server and exit...${NC}"
read -r

# Kill the server
if [ -n "$server_pid" ]; then
  kill -9 "$server_pid" &>/dev/null
fi

echo -e "${GREEN}Server stopped. All tests completed.${NC}" 