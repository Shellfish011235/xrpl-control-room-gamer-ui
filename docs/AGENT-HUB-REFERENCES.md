# Agent Hub – External References for Building & Training Agents

Use these repos and resources when building or training the XRPL agent fleet (`@xrpl-trader`, `@path-optimizer`, `@nft-raider`, `@compliance-guard`, `@bridge-scout`, etc.).

---

## 1. Finance & Quant AI / Trading Agents

**Focus:** RL for trading, financial LLMs, data platforms, automated agents.

| Resource | URL | Use case |
|----------|-----|----------|
| **FinRL** | https://github.com/AI4Finance-Foundation/FinRL | Deep RL for stock trading, portfolio optimization; gold standard for quant agents. |
| **FinGPT** | https://github.com/AI4Finance-Foundation/FinGPT | Open-source financial LLM: sentiment, forecasting, analysis. |
| **OpenBB** | https://github.com/OpenBB-finance/OpenBB | Free investment research platform; data APIs for stocks/crypto — real-time agent integration (bridge scouting, XRPL paths). |
| **gs-quant** | https://github.com/goldmansachs/gs-quant | Goldman Sachs quant toolkit: risk, pricing, backtesting. |
| **awesome-ai-in-finance** | https://github.com/georgezouq/awesome-ai-in-finance | Curated list: LLMs, DL strategies, tools/datasets for finance AI. |
| **awesome-quant** | https://github.com/wilsonfreitas/awesome-quant | Massive curated list of quant libs (Python/R/Julia), numerical tools. |
| **qlib** | https://github.com/microsoft/qlib | AI-oriented quant investment platform: research + production backtesting. |
| **AI_Agent_Trader** | https://github.com/AloshkaD/AI_Agent_Trader | Multi-agent system for stock trend analysis via collaboration. |

---

## 2. Game Theory & Multi-Agent RL

**Focus:** MARL, equilibria, imperfect-info games — strategy for markets, NFTs, bridges.

| Resource | URL | Use case |
|----------|-----|----------|
| **awesome-game-ai** | https://github.com/datamllab/awesome-game-ai | Multi-agent RL in games (perfect/imperfect info). |
| **MARL-Papers** | https://github.com/LantaoYu/MARL-Papers | MARL + game theory paper list. |
| **open_spiel** | https://github.com/deepmind/open_spiel | RL/research in games (chess, poker, etc.); game-theoretic baselines. |
| **Multi-Agent-Reinforcement-Learning-papers** | https://github.com/TimeBreaker/Multi-Agent-Reinforcement-Learning-papers | Categorized MARL papers, game-theoretic approaches. |
| **awesome-multi-agent** | https://github.com/WeiChengTseng/awesome-multi-agent | Multi-agent learning papers/resources. |

---

## 3. Mathematics for ML / AI Agents

**Focus:** Linear algebra, calculus, probability, optimization — foundations for quant/path/game agents.

| Resource | URL | Use case |
|----------|-----|----------|
| **Mathematics-for-ML** | https://github.com/dair-ai/Mathematics-for-ML | Curated resources (books, videos, notes) for ML math. |
| **mml-book** | https://github.com/mml-book/mml-book.github.io | "Mathematics for Machine Learning" companion (notebooks + free PDF). |
| **Mathematics-for-ML-Data-Science-Specialization** | https://github.com/Ryota-Kawamura/Mathematics-for-Machine-Learning-and-Data-Science-Specialization | Beginner-friendly: calculus, linear algebra, stats/probability. |

---

## 4. Wolfram / Symbolic Computation + AI

**Focus:** Precise math/symbolic reasoning — compliance, optimization, hybrid agents.

| Resource | URL | Use case |
|----------|-----|----------|
| **Chatbook** | https://github.com/WolframResearch/Chatbook | Wolfram Notebooks + LLMs for interactive symbolic computation. |
| **Wolfram Research** | https://github.com/WolframResearch | GitLink, QuantumFramework, etc.; check official AI ecosystem docs for MCP/LLM hooks. |

---

## 5. General AI Agent Frameworks (2025–2026)

**Focus:** Multi-agent systems, tool use, memory — adapt for the agent fleet.

| Resource | URL | Use case |
|----------|-----|----------|
| **LangChain** | https://github.com/langchain-ai/langchain | Agent chains, tools (core reference). |
| **Langflow** | https://github.com/langflow-ai/langflow | Visual/low-code builder for AI agents and workflows. |
| **n8n** | https://github.com/n8n-io/n8n | Workflow automation with native AI/agent capabilities. |
| **500-AI-Agents-Projects** | https://github.com/ashishpatel26/500-AI-Agents-Projects | 500+ agent project ideas (finance section included). |
| **awesome-ai-agent-papers** | https://github.com/VoltAgent/awesome-ai-agent-papers | 2026 AI agent research: engineering, memory, evaluation. |

---

## Quick prompt template (for Cursor / AI assistants)

Paste this when asking to build or train agents:

```
You are helping build/train a fleet of AI agents for XRPL/crypto/finance tasks
(@xrpl-trader, @path-optimizer, @nft-raider, @compliance-guard, @bridge-scout, etc.).

Use these top GitHub repos as primary references:

Finance/Quant:
- https://github.com/AI4Finance-Foundation/FinRL
- https://github.com/OpenBB-finance/OpenBB
- https://github.com/georgezouq/awesome-ai-in-finance
- https://github.com/wilsonfreitas/awesome-quant

Game Theory/MARL:
- https://github.com/datamllab/awesome-game-ai
- https://github.com/deepmind/open_spiel
- https://github.com/LantaoYu/MARL-Papers

Math/ML Foundations:
- https://github.com/dair-ai/Mathematics-for-ML

Wolfram/Symbolic:
- https://github.com/WolframResearch/Chatbook

Agent Frameworks:
- https://github.com/langflow-ai/langflow
- https://github.com/ashishpatel26/500-AI-Agents-Projects

Now, [your specific task, e.g. "integrate OpenBB data into @xrpl-trader for real-time path optimization"
or "design a MARL training loop inspired by OpenSpiel for NFT bidding game theory"].
```

---

## Grid bots prompt template (range / volatility strategies)

Use when building or training agents for grid-like strategies on XRPL, bridges, NFTs, or sideways markets:

```
You are helping build/train a fleet of crypto AI agents (@xrpl-trader, @path-optimizer, @nft-raider, etc.) using grid-like strategies for range/volatility capture on XRPL, bridges, NFTs, or sideways markets.

Top open-source grid trading bots to study, fork, or integrate (Python-focused, active 2025–2026):

1. https://github.com/Drakkar-Software/OctoBot
   - Built-in Grid Trading Mode (math-based, customizable for sideways profits)
   - Docs: https://www.octobot.cloud/en/guides/octobot-trading-modes/grid-trading-mode
   - Modular, backtesting, multi-exchange (Binance, Hyperliquid, etc.)

2. https://github.com/freqtrade/freqtrade
   - Custom strategy grid possible (hyperopt/ML optimization)
   - Backtesting + live trading excellence
   - Strategies examples: https://github.com/freqtrade/freqtrade-strategies

3. https://github.com/jordantete/grid_trading_bot
   - Pure grid implementation with backtesting
   - Recent updates (Feb 2026), CCXT support

4. https://github.com/Open-Trader/opentrader
   - Built-in GRID + DCA, UI, paper trading, 100+ exchanges via CCXT

5. https://github.com/btschwertfeger/infinity-grid
   - Infinity grid (unbounded), multi-position for drops

Now, [insert your specific task here, e.g.:
- "Write a basic Python grid strategy class inspired by jordantete/grid_trading_bot but adapted for XRPL using a CCXT-like API and volatility-based interval sizing."
- "Generate backtesting code for a grid bot on historical XRP data, with params for grid levels, fees, and profit targets."
- "Design a multi-agent setup: one agent scouts price ranges/volatility, another executes grid trades, inspired by OctoBot's modular modes."]
```

---

## In-repo agent config

- **Skills & task matching:** `src/agents/skills/registry.ts`
- **Agent definitions:** `src/store/agentStore.ts`
- **Orchestrator & prompt:** `src/agents/Orchestrator.ts`
- **Training/customization guide:** [AGENT-HUB-TRAINING.md](./AGENT-HUB-TRAINING.md)
