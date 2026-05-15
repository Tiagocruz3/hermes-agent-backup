#!/bin/bash
set -e

HERMES_USER="${HERMES_USER:-$USER}"
HERMES_HOME="/home/$HERMES_USER/.hermes"
BACKUP_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     HERMES AGENT - COMPLETE HARDWARE INSTALLATION           ║"
echo "╚══════════════════════════════════════════════════════════════╝"

if [ "$EUID" -eq 0 ]; then
   echo "❌ Don't run as root. Run as regular user with sudo access."
   exit 1
fi

echo "📦 Step 1/12: System dependencies..."
sudo apt-get update
sudo apt-get install -y git curl wget python3 python3-pip python3-venv \
    nodejs npm build-essential pkg-config libssl-dev zlib1g-dev \
    libbz2-dev libreadline-dev libsqlite3-dev llvm libncurses-dev \
    xz-utils tk-dev libffi-dev liblzma-dev \
    python3-openssl ffmpeg chromium-browser fonts-liberation \
    libnss3 libatk-bridge2.0-0t64 libxss1 libgtk-3-0t64 libasound2t64 \
    libxtst6 libappindicator3-1 systemd dbus-user-session || true

echo "📦 Step 1b: Installing pnpm..."
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
npm install -g pnpm

# Add to bashrc for future sessions
if ! grep -q ".npm-global/bin" ~/.bashrc; then
    echo 'export PATH="$HOME/.npm-global/bin:$PATH"' >> ~/.bashrc
fi

echo "🐍 Step 2/12: Python tools..."
python3 -m pip install --user --upgrade pip uv --break-system-packages 2>/dev/null || python3 -m pip install --user --upgrade pip uv

echo "📁 Step 3/12: Restoring Hermes configuration..."
if [ -d "$HERMES_HOME" ]; then
    mv "$HERMES_HOME" "$HERMES_HOME.backup.$(date +%s)"
fi
mkdir -p "$HERMES_HOME"
cp -r "$BACKUP_DIR/config/"* "$HERMES_HOME/"
cp -r "$BACKUP_DIR/memories" "$HERMES_HOME/"
mkdir -p "$HERMES_HOME/skills"
cp -r "$BACKUP_DIR/skills/"* "$HERMES_HOME/skills/"

echo "🔧 Step 4/12: Installing Hermes Agent from source..."
cd "$HERMES_HOME"
git clone https://github.com/nousresearch/hermes-agent.git hermes-agent 2>/dev/null || {
    echo "⚠️  Using backup source..."
    cp -r "$BACKUP_DIR/hermes-agent" . 2>/dev/null || true
}

cd hermes-agent
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -e .

echo "🔗 Step 5/12: CLI setup..."
mkdir -p "/home/$HERMES_USER/.local/bin"
ln -sf "$HERMES_HOME/hermes-agent/venv/bin/hermes" "/home/$HERMES_USER/.local/bin/hermes"
if ! grep -q ".local/bin" "/home/$HERMES_USER/.bashrc"; then
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> "/home/$HERMES_USER/.bashrc"
fi

echo "🎓 Step 6/12: Installing global tools..."
# Node tools
npm install -g vercel serve typescript tsx @anthropic-ai/claude-code @openai/codex

# Python tools
pip install --user \
    openai anthropic google-generativeai \
    requests beautifulsoup4 playwright \
    pandas numpy matplotlib pillow

# Claude Code
if ! command -v claude >/dev/null 2>&1; then
    npm install -g @anthropic-ai/claude-code
fi

echo "🧠 Step 7/12: Installing skills..."
cd "$HERMES_HOME/skills"
for skill in */; do
    if [ -f "$skill/requirements.txt" ]; then
        echo "  Installing $skill requirements..."
        pip install -r "$skill/requirements.txt" 2>/dev/null || true
    fi
    if [ -f "$skill/package.json" ]; then
        echo "  Installing $skill node deps..."
        cd "$skill" && npm install 2>/dev/null || true
        cd "$HERMES_HOME/skills"
    fi
done

echo "⚙️  Step 8/12: Systemd service..."
mkdir -p "/home/$HERMES_USER/.config/systemd/user"
cp "$BACKUP_DIR/systemd/hermes-gateway.service" "/home/$HERMES_USER/.config/systemd/user/"
sed -i "s|/home/ace/|/home/$HERMES_USER/|g" "/home/$HERMES_USER/.config/systemd/user/hermes-gateway.service"

sudo loginctl enable-linger "$HERMES_USER"
systemctl --user mask sleep.target suspend.target hibernate.target hybrid-sleep.target 2>/dev/null || true

echo "🔑 Step 9/12: API keys check..."
if [ -f "$BACKUP_DIR/config/.env" ]; then
    echo "✅ API keys found"
    cp "$BACKUP_DIR/config/.env" "$HERMES_HOME/.env"
else
    echo "⚠️  No API keys found. Edit ~/.hermes/.env manually."
fi

echo "🚀 Step 10/12: Starting gateway..."
systemctl --user daemon-reload
systemctl --user enable hermes-gateway
systemctl --user start hermes-gateway
sleep 3

echo "📊 Step 11/12: Verification..."
if systemctl --user is-active hermes-gateway >/dev/null 2>&1; then
    echo "✅ Gateway running"
else
    echo "❌ Gateway failed. Check: journalctl --user -u hermes-gateway -n 50"
fi

echo "🎨 Step 12/12: Installing Iron Me UI..."
if [ -d "$BACKUP_DIR/iron-me" ]; then
    cp -r "$BACKUP_DIR/iron-me" "$HERMES_HOME/../projects/" 2>/dev/null || true
    echo "✅ Iron Me UI copied"
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║              ✅ INSTALLATION COMPLETE                        ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║  Gateway:     $(systemctl --user is-active hermes-gateway 2>/dev/null || echo 'unknown')"
echo "║  Hermes:      $HERMES_HOME"
echo "║  CLI:         hermes --help"
echo "║  Logs:        journalctl --user -u hermes-gateway -f"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "📝 Post-install:"
echo "   1. Edit ~/.hermes/.env with real API keys"
echo "   2. hermes auth login  # For OAuth providers"
echo "   3. hermes chat 'hello'"
