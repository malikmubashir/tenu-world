#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Install Governance Sync System
# 1. Runs reconfigure-option-c.sh (agents → gpt-oss:20b)
# 2. Copies governance-sync.py to ~/.paperclip/
# 3. Installs LaunchAgent (runs every 30 min)
# 4. Does first sync + Telegram report
# ═══════════════════════════════════════════════════════════════

SCRIPTS="$HOME/Documents/Claude/Projects/Tenu.World/scripts"

echo "================================================"
echo "  TENU GOVERNANCE SYSTEM INSTALLER"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "================================================"

# Step 1: Reconfigure Paperclip agents
echo ""
echo "--- Step 1: Reconfiguring Paperclip agents ---"
bash "$SCRIPTS/reconfigure-option-c.sh"

# Step 2: Load gpt-oss:20b into VRAM
echo ""
echo "--- Step 2: Loading gpt-oss:20b into Ollama ---"
ollama stop gemma4:e4b 2>/dev/null
echo "Warming up gpt-oss:20b (first load may take 30s)..."
OLLAMA_RESP=$(ollama run gpt-oss:20b "Reply with only: OK" 2>&1)
echo "Ollama response: $OLLAMA_RESP"

# Step 3: Install governance-sync.py
echo ""
echo "--- Step 3: Installing governance-sync.py ---"
cp "$SCRIPTS/governance-sync.py" "$HOME/.paperclip/governance-sync.py"
echo "Installed to ~/.paperclip/governance-sync.py"

# Step 4: Install LaunchAgent
echo ""
echo "--- Step 4: Installing LaunchAgent ---"
PLIST_SRC="$SCRIPTS/com.globalapex.governance-sync.plist"
PLIST_DST="$HOME/Library/LaunchAgents/com.globalapex.governance-sync.plist"

# Unload if already loaded
launchctl unload "$PLIST_DST" 2>/dev/null
cp "$PLIST_SRC" "$PLIST_DST"
launchctl load "$PLIST_DST"
echo "LaunchAgent installed and loaded."

# Step 5: First sync
echo ""
echo "--- Step 5: Running first governance sync ---"
/opt/homebrew/bin/python3 "$HOME/.paperclip/governance-sync.py" --report

echo ""
echo "================================================"
echo "  INSTALLATION COMPLETE"
echo ""
echo "  Governance sync runs every 30 minutes."
echo "  Telegram report included with each sync."
echo "  Excel tracker auto-updated at:"
echo "    ~/Documents/Claude/Projects/Tenu.World/Tenu-Reste-a-Faire.xlsx"
echo ""
echo "  Logs: /tmp/governance-sync.log"
echo "  Manual run: python3 ~/.paperclip/governance-sync.py --report"
echo "================================================"
