#!/bin/bash

# ANSI color codes for terminal output
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
RED="\033[0;31m"
PURPLE="\033[0;35m"
CYAN="\033[0;36m"
RESET="\033[0m"
BOLD="\033[1m"

clear
echo -e "\n${BOLD}${PURPLE}=============================================================================${RESET}"
echo -e "${BOLD}${PURPLE}                    TIER'D NUCLEAR DEPLOYMENT TOOLKIT                      ${RESET}"
echo -e "${BOLD}${PURPLE}=============================================================================\n${RESET}"

echo -e "${YELLOW}This toolkit provides guaranteed deployment solutions for the Tier'd application,${RESET}"
echo -e "${YELLOW}offering multiple deployment strategies from simple fixes to nuclear options.${RESET}\n"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed. Please install Node.js first.${RESET}"
    exit 1
fi

# Ensure all scripts are executable
echo -e "${BLUE}Ensuring scripts are executable...${RESET}"
chmod +x fix-css-build.js create-empty-app.js ultimate-deploy.js import-to-vercel.js create-deployment-package.js publish-to-github.sh 2>/dev/null
echo -e "${GREEN}✓ Done${RESET}\n"

# Menu function
show_menu() {
    echo -e "${BOLD}${CYAN}=== DEPLOYMENT OPTIONS ===${RESET}\n"
    echo -e "1.  ${BOLD}[Simple] CSS Fix Build${RESET}"
    echo -e "    Run a build that temporarily disables CSS processing"
    echo -e ""
    echo -e "2.  ${BOLD}[Static] Create Empty App${RESET}"
    echo -e "    Generate a minimal static site that guarantees deployment"
    echo -e ""
    echo -e "3.  ${BOLD}[Complete] Ultimate Deployment${RESET}"
    echo -e "    Create a comprehensive self-contained deployment package"
    echo -e ""
    echo -e "4.  ${BOLD}[Package] Create Importable Vercel Package${RESET}"
    echo -e "    Prepare detailed import instructions for Vercel deployment"
    echo -e ""
    echo -e "5.  ${BOLD}[All-in-One] Create Deployment Package${RESET}"
    echo -e "    Generate a complete package with all deployment scripts & documentation"
    echo -e ""
    echo -e "6.  ${BOLD}[GitHub] Publish to GitHub${RESET}"
    echo -e "    Push all deployment solutions to a new GitHub repository"
    echo -e ""
    echo -e "7.  ${BOLD}[Docs] View Deployment Documentation${RESET}"
    echo -e "    Display comprehensive documentation of all deployment fixes"
    echo -e ""
    echo -e "8.  ${BOLD}[Exit] Exit Toolkit${RESET}"
    echo -e ""
    echo -e "${BOLD}${CYAN}===========================${RESET}\n"
}

# Function to run with spinner
run_with_spinner() {
    local cmd="$1"
    local message="$2"
    
    echo -e "\n${YELLOW}$message${RESET}"
    
    # Start spinner in background
    local pid
    local spin="-\|/"
    local i=0
    eval "$cmd" &
    pid=$!
    
    # Display spinner while process is running
    while kill -0 $pid 2>/dev/null; do
        i=$(( (i+1) % 4 ))
        printf "\r${BOLD}[%c]${RESET} Working..." "${spin:$i:1}"
        sleep 0.1
    done
    
    # Clear spinner line
    printf "\r                           \r"
    
    wait $pid
    local exit_status=$?
    
    if [ $exit_status -eq 0 ]; then
        echo -e "${GREEN}✓ Operation completed successfully${RESET}"
    else
        echo -e "${RED}✗ Operation failed (exit code: $exit_status)${RESET}"
    fi
    
    return $exit_status
}

# Function to press any key to continue
press_any_key() {
    echo ""
    read -n 1 -s -r -p "Press any key to continue..."
    echo ""
}

# Main loop
while true; do
    show_menu
    read -p "Enter your choice (1-8): " choice
    
    case $choice in
        1)
            echo -e "\n${BOLD}${CYAN}=== RUNNING CSS FIX BUILD ===${RESET}\n"
            if [ -f "fix-css-build.js" ]; then
                echo -e "${YELLOW}Running build with CSS files temporarily removed...${RESET}\n"
                node fix-css-build.js
                echo -e "\n${GREEN}✓ CSS Fix build process complete${RESET}"
            else
                echo -e "${RED}Error: fix-css-build.js not found${RESET}"
            fi
            press_any_key
            ;;
        2)
            echo -e "\n${BOLD}${CYAN}=== CREATING EMPTY APP ===${RESET}\n"
            if [ -f "create-empty-app.js" ]; then
                echo -e "${YELLOW}Generating minimal static site...${RESET}\n"
                node create-empty-app.js
                echo -e "\n${GREEN}✓ Empty app creation complete${RESET}"
            else
                echo -e "${RED}Error: create-empty-app.js not found${RESET}"
            fi
            press_any_key
            ;;
        3)
            echo -e "\n${BOLD}${CYAN}=== CREATING ULTIMATE DEPLOYMENT ===${RESET}\n"
            if [ -f "ultimate-deploy.js" ]; then
                echo -e "${YELLOW}Creating self-contained deployment package...${RESET}\n"
                node ultimate-deploy.js
                echo -e "\n${GREEN}✓ Ultimate deployment package created${RESET}"
            else
                echo -e "${RED}Error: ultimate-deploy.js not found${RESET}"
            fi
            press_any_key
            ;;
        4)
            echo -e "\n${BOLD}${CYAN}=== CREATING IMPORTABLE VERCEL PACKAGE ===${RESET}\n"
            if [ -f "import-to-vercel.js" ]; then
                echo -e "${YELLOW}Preparing Vercel import instructions...${RESET}\n"
                node import-to-vercel.js
                echo -e "\n${GREEN}✓ Vercel import package created${RESET}"
            else
                echo -e "${RED}Error: import-to-vercel.js not found${RESET}"
            fi
            press_any_key
            ;;
        5)
            echo -e "\n${BOLD}${CYAN}=== CREATING COMPREHENSIVE DEPLOYMENT PACKAGE ===${RESET}\n"
            if [ -f "create-deployment-package.js" ]; then
                echo -e "${YELLOW}Generating complete deployment package...${RESET}\n"
                node create-deployment-package.js
                echo -e "\n${GREEN}✓ Complete deployment package created${RESET}"
            else
                echo -e "${RED}Error: create-deployment-package.js not found${RESET}"
            fi
            press_any_key
            ;;
        6)
            echo -e "\n${BOLD}${CYAN}=== PUBLISHING TO GITHUB ===${RESET}\n"
            if [ -f "publish-to-github.sh" ]; then
                echo -e "${YELLOW}Publishing to GitHub...${RESET}\n"
                ./publish-to-github.sh
                echo -e "\n${GREEN}✓ GitHub publishing complete${RESET}"
            else
                echo -e "${RED}Error: publish-to-github.sh not found${RESET}"
            fi
            press_any_key
            ;;
        7)
            echo -e "\n${BOLD}${CYAN}=== DEPLOYMENT DOCUMENTATION ===${RESET}\n"
            if [ -f "DEPLOYMENT-FIXES.md" ]; then
                echo -e "${YELLOW}Displaying documentation...${RESET}\n"
                cat DEPLOYMENT-FIXES.md | more
            else
                echo -e "${RED}Error: DEPLOYMENT-FIXES.md not found${RESET}"
            fi
            press_any_key
            ;;
        8)
            echo -e "\n${GREEN}Exiting Tier'd Nuclear Deployment Toolkit. Goodbye!${RESET}\n"
            exit 0
            ;;
        *)
            echo -e "\n${RED}Invalid option. Please enter a number between 1 and 8.${RESET}\n"
            press_any_key
            ;;
    esac
    
    clear
done 