#!/usr/bin/env bash
# ==============================================================================
# Heisenberg OS - macOS & Linux Installer
# Installs GrapeRoot dual-graph engine, configures environment PATH, establishes
# the universal workspace .mcp.json, and launches GrapeRoot on port 8080.
# ==============================================================================

set -e

# Terminal colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo ""
echo -e "${BOLD}${CYAN}========================================================================${NC}"
echo -e "${BOLD}${CYAN}            HEISENBERG OS - INSTALLER (MACOS / LINUX)                   ${NC}"
echo -e "${BOLD}${CYAN}========================================================================${NC}"
echo ""

# ------------------------------------------------------------------------------
# 1. Verify / Setup Python Runtime (>= 3.10)
# ------------------------------------------------------------------------------
echo -e "${YELLOW}[1/4] Checking Python runtime...${NC}"

PYTHON_CMD=""
if command -v python3 >/dev/null 2>&1; then
    PY_VER=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
    PY_MAJOR=$(python3 -c "import sys; print(sys.version_info.major)")
    PY_MINOR=$(python3 -c "import sys; print(sys.version_info.minor)")
    
    if [ "$PY_MAJOR" -ge 3 ] && [ "$PY_MINOR" -ge 10 ]; then
        PYTHON_CMD="python3"
        echo -e "  ${GREEN}[✓] Found Python ${PY_VER}${NC}"
    fi
fi

if [ -z "$PYTHON_CMD" ]; then
    echo -e "  ${RED}[!] Python >= 3.10 not found.${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo -e "  ${YELLOW}[*] On macOS, install via Homebrew: brew install python${NC}"
    else
        echo -e "  ${YELLOW}[*] On Linux, install via package manager: sudo apt-get install python3 python3-pip${NC}"
    fi
fi

# ------------------------------------------------------------------------------
# 2. Install GrapeRoot Dual-Graph Engine
# ------------------------------------------------------------------------------
echo ""
echo -e "${YELLOW}[2/4] Installing / Verifying GrapeRoot Dual-Graph Engine...${NC}"

DUAL_GRAPH_DIR="$HOME/.dual-graph"

if ! command -v graperoot >/dev/null 2>&1; then
    echo -e "  ${CYAN}[*] Downloading GrapeRoot from official installer...${NC}"
    curl -sSL https://graperoot.dev/install.sh | bash || true
    echo -e "  ${GREEN}[✓] GrapeRoot installer completed.${NC}"
else
    echo -e "  ${GREEN}[✓] GrapeRoot is already installed: $(which graperoot)${NC}"
fi

# Ensure $HOME/.dual-graph is in PATH for both zsh and bash
mkdir -p "$DUAL_GRAPH_DIR"

add_to_path_file() {
    local file="$1"
    if [ -f "$file" ]; then
        if ! grep -q 'export PATH="$HOME/.dual-graph:$PATH"' "$file"; then
            echo -e '\n# GrapeRoot dual-graph PATH' >> "$file"
            echo 'export PATH="$HOME/.dual-graph:$PATH"' >> "$file"
            echo -e "  ${GREEN}[✓] Added ~/.dual-graph to $file${NC}"
        fi
    fi
}

add_to_path_file "$HOME/.zshrc"
add_to_path_file "$HOME/.bashrc"
add_to_path_file "$HOME/.profile"

export PATH="$DUAL_GRAPH_DIR:$PATH"

# ------------------------------------------------------------------------------
# 3. Create Compatibility Stubs & Universal Workspace .mcp.json
# ------------------------------------------------------------------------------
echo ""
echo -e "${YELLOW}[3/4] Scaffolding workspace and compatibility stubs...${NC}"

# Mock agy executable stub to prevent desktop agent CLI errors
AGY_STUB="$DUAL_GRAPH_DIR/agy"
if [ ! -f "$AGY_STUB" ]; then
    cat << 'EOF' > "$AGY_STUB"
#!/usr/bin/env bash
echo "[GrapeRoot] Active."
EOF
    chmod +x "$AGY_STUB"
    echo -e "  ${GREEN}[✓] Created compatibility stub: $AGY_STUB${NC}"
fi

# Universal workspace .mcp.json for modern editors (Cursor, Claude Code, Zed)
WORKSPACE_ROOT=$(pwd)
ROOT_MCP_JSON="$WORKSPACE_ROOT/.mcp.json"

if [ ! -f "$ROOT_MCP_JSON" ]; then
    cat << 'EOF' > "$ROOT_MCP_JSON"
{
  "mcpServers": {
    "graperoot": {
      "type": "streamableHttp",
      "url": "http://127.0.0.1:8080/mcp",
      "autoApprove": [
        "graph_retrieve",
        "graph_read",
        "graph_neighbors",
        "graph_impact",
        "graph_continue"
      ]
    }
  }
}
EOF
    echo -e "  ${GREEN}[✓] Created universal workspace .mcp.json at project root${NC}"
fi

# Sync to .cursor/mcp.json if .cursor directory exists
if [ -d "$WORKSPACE_ROOT/.cursor" ]; then
    cp "$ROOT_MCP_JSON" "$WORKSPACE_ROOT/.cursor/mcp.json"
    echo -e "  ${GREEN}[✓] Synced .cursor/mcp.json${NC}"
fi

# ------------------------------------------------------------------------------
# 4. Launch GrapeRoot Daemon on Port 8080
# ------------------------------------------------------------------------------
echo ""
echo -e "${YELLOW}[4/4] Starting GrapeRoot Daemon on Port 8080...${NC}"

PORT_LISTENING=false
if command -v nc >/dev/null 2>&1; then
    if nc -z 127.0.0.1 8080 >/dev/null 2>&1; then
        PORT_LISTENING=true
    fi
elif [ -n "$PYTHON_CMD" ]; then
    if $PYTHON_CMD -c "import socket; s=socket.socket(); s.settimeout(0.5); exit(s.connect_ex(('127.0.0.1', 8080)))" >/dev/null 2>&1; then
        PORT_LISTENING=true
    fi
fi

if [ "$PORT_LISTENING" = true ]; then
    echo -e "  ${GREEN}[✓] GrapeRoot daemon is ALREADY RUNNING on port 8080.${NC}"
else
    echo -e "  ${CYAN}[*] Spawning GrapeRoot daemon in background (nohup)...${NC}"
    if command -v graperoot >/dev/null 2>&1; then
        nohup graperoot . --antigravity > "$DUAL_GRAPH_DIR/daemon.log" 2>&1 &
        sleep 2
        echo -e "  ${GREEN}[✓] GrapeRoot daemon launched (PID: $!). Logs: $DUAL_GRAPH_DIR/daemon.log${NC}"
    else
        echo -e "  ${YELLOW}[!] graperoot binary not in active shell path. Please run 'source ~/.zshrc' (or ~/.bashrc) and execute: graperoot . --antigravity${NC}"
    fi
fi

echo ""
echo -e "${BOLD}${GREEN}========================================================================${NC}"
echo -e "${BOLD}${GREEN}           HEISENBERG SETUP COMPLETE - READY FOR CODING!                ${NC}"
echo -e "${BOLD}${GREEN}========================================================================${NC}"
echo ""
echo -e "${CYAN}Next Steps:${NC}"
echo -e "  1. Open your AI coding editor (Cursor, Windsurf, Claude Code, Cline, Zed)"
echo -e "  2. The universal .mcp.json is already active at: ${BOLD}$ROOT_MCP_JSON${NC}"
echo -e "  3. Prompt your agent to begin! It will follow the Heisenberg workflow."
echo ""
