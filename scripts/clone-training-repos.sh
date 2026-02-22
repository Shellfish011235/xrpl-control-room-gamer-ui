#!/bin/bash

# Create folder if it doesn't exist
mkdir -p training-repos
cd training-repos

# Tier 1
git clone https://github.com/AI4Finance-Foundation/FinRL.git
git clone https://github.com/OpenBB-finance/OpenBB.git
git clone https://github.com/google-deepmind/open_spiel.git
git clone https://github.com/langchain-ai/langchain.git

# Tier 2
git clone https://github.com/AI4Finance-Foundation/FinGPT.git
git clone https://github.com/microsoft/qlib.git
git clone https://github.com/HKUDS/AI-Trader.git
git clone https://github.com/LantaoYu/MARL-Papers.git

echo "Cloned Tier 1 + 2 repos into training-repos/. Add to docs/AGENT-HUB-REFERENCES.md as needed."
