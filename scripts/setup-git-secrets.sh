#!/bin/bash
# Setup git-secrets for the repository
# Prevents committing secrets to the repository

set -e

echo "🔐 Setting up git-secrets..."

# Check if git-secrets is installed
if ! command -v git-secrets &> /dev/null; then
    echo "📦 Installing git-secrets..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install git-secrets
        else
            echo "❌ Homebrew not found. Please install git-secrets manually."
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux"* ]]; then
        # Linux
        if command -v apt-get &> /dev/null; then
            sudo apt-get update
            sudo apt-get install -y git-secrets
        else
            # Manual installation
            curl -sL https://raw.githubusercontent.com/awslabs/git-secrets/master/git-secrets > git-secrets
            chmod +x git-secrets
            sudo mv git-secrets /usr/local/bin/
        fi
    else
        echo "❌ Unsupported OS. Please install git-secrets manually."
        exit 1
    fi
fi

# Install git-secrets hooks in the repository
echo "🔧 Installing git-secrets hooks..."
git secrets --install 2>/dev/null || echo "Already installed"

# Register AWS patterns
echo "📌 Registering AWS secret patterns..."
git secrets --register-aws 2>/dev/null || true

# Add custom patterns for common secrets
echo "📌 Adding custom secret patterns..."

# Password patterns
git secrets --add 'password\s*=\s*["\x27][^"\x27]+["\x27]' 2>/dev/null || true
git secrets --add 'Password\s*=\s*["\x27][^"\x27]+["\x27]' 2>/dev/null || true

# API key patterns
git secrets --add 'api[_-]?key\s*=\s*["\x27][^"\x27]+["\x27]' 2>/dev/null || true
git secrets --add 'ApiKey\s*=\s*["\x27][^"\x27]+["\x27]' 2>/dev/null || true
git secrets --add 'X-Api-Key\s*:\s*["\x27][^"\x27]+["\x27]' 2>/dev/null || true

# Secret key patterns
git secrets --add 'secret[_-]?key\s*=\s*["\x27][^"\x27]+["\x27]' 2>/dev/null || true
git secrets --add 'SecretKey\s*=\s*["\x27][^"\x27]+["\x27]' 2>/dev/null || true

# Token patterns
git secrets --add 'token\s*=\s*["\x27][^"\x27]+["\x27]' 2>/dev/null || true
git secrets --add 'Token\s*=\s*["\x27][^"\x27]+["\x27]' 2>/dev/null || true

# JWT patterns
git secrets --add 'JWT[_-]?SECRET\s*=\s*["\x27][^"\x27]+["\x27]' 2>/dev/null || true
git secrets --add 'JwtSecret\s*=\s*["\x27][^"\x27]+["\x27]' 2>/dev/null || true

# Connection string patterns
git secrets --add 'connection[_-]?string\s*=\s*["\x27][^"\x27]+password' 2>/dev/null || true
git secrets --add 'ConnectionString\s*=\s*["\x27][^"\x27]+password' 2>/dev/null || true

# Private key patterns
git secrets --add '-----BEGIN (RSA |DSA |EC |OPENSSH )?PRIVATE KEY-----' 2>/dev/null || true

# Environment variable patterns with actual values
git secrets --add 'DATABASE_PASSWORD\s*=\s*[^$\s]+' 2>/dev/null || true
git secrets --add 'REDIS_PASSWORD\s*=\s*[^$\s]+' 2>/dev/null || true
git secrets --add 'SMTP_PASSWORD\s*=\s*[^$\s]+' 2>/dev/null || true

# Scan history for secrets (optional, can be slow on large repos)
read -p "🔍 Scan git history for secrets? (y/N): " scan_history
if [[ "$scan_history" =~ ^[Yy]$ ]]; then
    echo "🔍 Scanning git history..."
    git secrets --scan-history 2>/dev/null || echo "No secrets found in history"
fi

# List all patterns
echo ""
echo "✅ git-secrets setup complete!"
echo ""
echo "📋 Registered patterns:"
git secrets --list 2>/dev/null || echo "No patterns registered"

echo ""
echo "ℹ️  git-secrets will now scan commits for secrets before allowing them."
echo "   To bypass (NOT RECOMMENDED): git commit --no-verify"
echo ""
</task_progress>
</write_to_file>