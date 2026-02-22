# Repos to Grab for Training Your AI Agents

None of these are in the project yet. Clone the ones you need into a sibling folder (e.g. `../repos/`) or a dedicated `training-repos/` directory, then use them as reference or as part of a separate training pipeline (Python/backend).

---

## Tier 1 – Grab first (core for training)

| Repo | Clone | Why grab |
|------|--------|----------|
| **FinRL** | `git clone https://github.com/AI4Finance-Foundation/FinRL.git` | Deep RL for trading/portfolio; use for @xrpl-trader, quant agents. |
| **OpenBB** | `git clone https://github.com/OpenBB-finance/OpenBB.git` | Data APIs (stocks/crypto); feed @path-optimizer / @bridge-scout with real-time data. |
| **open_spiel** | `git clone https://github.com/deepmind/open_spiel.git` | Game-theoretic RL baselines; use for NFT raider / bidding / multi-agent strategy. |
| **LangChain** | `git clone https://github.com/langchain-ai/langchain.git` | Agent chains, tools, memory; reference for orchestrator and tool-calling agents. |

---

## Tier 2 – Grab for finance/quant and multi-agent

| Repo | Clone | Why grab |
|------|--------|----------|
| **FinGPT** | `git clone https://github.com/AI4Finance-Foundation/FinGPT.git` | Financial LLM (sentiment, forecasting); fine-tune or prompt for @compliance-guard / @xrpl-trader. |
| **qlib** | `git clone https://github.com/microsoft/qlib.git` | Quant research + backtesting; use for strategy backtesting and risk. |
| **AI_Agent_Trader** | `git clone https://github.com/AloshkaD/AI_Agent_Trader.git` | Multi-agent stock analysis; reference for collaborative agent design. |
| **MARL-Papers** | `git clone https://github.com/LantaoYu/MARL-Papers.git` | MARL + game theory papers; reading list for training design. |

---

## Tier 3 – Grab for reference (awesome lists, math, frameworks)

| Repo | Clone | Why grab |
|------|--------|----------|
| **awesome-ai-in-finance** | `git clone https://github.com/georgezouq/awesome-ai-in-finance.git` | Curated links; no code to run, use as index. |
| **awesome-quant** | `git clone https://github.com/wilsonfreitas/awesome-quant.git` | Quant libs index (Python/R/Julia). |
| **awesome-game-ai** | `git clone https://github.com/datamllab/awesome-game-ai.git` | Game AI / MARL resources. |
| **Mathematics-for-ML** | `git clone https://github.com/dair-ai/Mathematics-for-ML.git` | Math foundations (books, notes, links). |
| **500-AI-Agents-Projects** | `git clone https://github.com/ashishpatel26/500-AI-Agents-Projects.git` | Agent project ideas (finance section). |
| **Langflow** | `git clone https://github.com/langflow-ai/langflow.git` | Low-code agent builder; reference for workflows. |

---

## Tier 4 – Optional (when you need them)

| Repo | Clone | Why grab |
|------|--------|----------|
| **gs-quant** | `git clone https://github.com/goldmansachs/gs-quant.git` | Risk, pricing, backtesting (Python). |
| **Multi-Agent-Reinforcement-Learning-papers** | `git clone https://github.com/TimeBreaker/Multi-Agent-Reinforcement-Learning-papers.git` | MARL papers list. |
| **awesome-multi-agent** | `git clone https://github.com/WeiChengTseng/awesome-multi-agent.git` | Multi-agent learning resources. |
| **mml-book** | `git clone https://github.com/mml-book/mml-book.github.io.git` | Math for ML book (notebooks + PDF). |
| **Chatbook** | `git clone https://github.com/WolframResearch/Chatbook.git` | Wolfram + LLM; for symbolic/compliance agents. |
| **n8n** | `git clone https://github.com/n8n-io/n8n.git` | Workflow automation + AI nodes. |
| **awesome-ai-agent-papers** | `git clone https://github.com/VoltAgent/awesome-ai-agent-papers.git` | 2026 agent papers. |

---

## One-shot: clone Tier 1 + Tier 2

Run from your machine (parent of `xrpl-control-room-gamer-ui` or a folder you use for repos). Or run `./scripts/clone-training-repos.sh` from the project root (Git Bash/WSL on Windows).

```bash
mkdir -p training-repos && cd training-repos
git clone https://github.com/AI4Finance-Foundation/FinRL.git
git clone https://github.com/OpenBB-finance/OpenBB.git
git clone https://github.com/deepmind/open_spiel.git
git clone https://github.com/langchain-ai/langchain.git
git clone https://github.com/AI4Finance-Foundation/FinGPT.git
git clone https://github.com/microsoft/qlib.git
git clone https://github.com/AloshkaD/AI_Agent_Trader.git
git clone https://github.com/LantaoYu/MARL-Papers.git
```

---

## Summary

- **Still need to grab:** All of the repos above — none are in `xrpl-control-room-gamer-ui` yet.
- **Minimum to “train all your AI”:** Tier 1 (FinRL, OpenBB, open_spiel, LangChain) covers RL trading, data, game theory, and agent patterns.
- **Add Tier 2** for financial LLMs, backtesting, multi-agent examples, and MARL reading.
- **Tier 3–4** are optional reference / when you need symbolic math, more papers, or workflow tools.

After cloning, point your training scripts or Cursor at these paths when you use the [AGENT-HUB-REFERENCES.md](./AGENT-HUB-REFERENCES.md) prompt template.
