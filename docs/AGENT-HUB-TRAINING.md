# How to Train / Improve the Agent Hub

The Agent Hub uses **skills** and **orchestration** rather than in-app ML training. You improve agents by configuring skills, assigning them to agents, and optionally connecting your own AI API (including a fine-tuned model).

---

## 1. What “training” means here

- **No on-device model training.** Agents are driven by:
  - **Skills** – name, keywords, description (and optional prompt) used to match tasks and build prompts.
  - **Agent definitions** – which skills each agent has (`skillIds`).
  - **Optional AI API** – `VITE_AI_API_URL` points to your LLM (e.g. OpenAI, Anthropic, or a **fine-tuned** model). That model can be trained elsewhere; the app just sends prompts and uses the response.

So “training” the hub = **configuring skills and agents** + **optionally using a trained/fine-tuned API**.

---

## 2. Improve task → skill matching (keywords & descriptions)

Skills are matched to user tasks by **keywords**. To make an agent better at certain topics:

1. **Edit the skill registry**  
   File: `src/agents/skills/registry.ts`

   For each skill you’ll see:
   - `keywords` – phrases that, when present in the task, pull in this skill.
   - `description` – short text used when building the prompt.

   **Example:** To make path-finding trigger more often for “swap” or “convert”, add those to `xrpl-path-optimizer`:

   ```ts
   'xrpl-path-optimizer': {
     name: 'xrpl-path-optimizer',
     keywords: ['path', 'route', 'ripple_path_find', 'amm_info', 'bridge', 'cost', 'risk', 'xrp', 'usd', 'ilp', 'swap', 'convert'],
     description: 'Find best XRPL route for amount from source to dest, score risk/cost/speed',
   },
   ```

2. **Add a new skill**  
   - In `src/agents/skills/types.ts`, add the new name to the `SkillName` union.
   - In `src/agents/skills/registry.ts`, add an entry to `SKILLS` with `name`, `keywords`, `description`.
   - Optionally add a `src/skills/<name>.skill.ts` with a richer `prompt` and `tools` and export it from `src/skills/index.ts` if the orchestrator uses it.

---

## 3. Assign skills to agents

Agents are defined in `src/store/agentStore.ts` in `DEFAULT_AGENTS`. Each agent has:

- `id`, `name`
- **`skillIds`** – array of skill names (e.g. `['xrpl-path-optimizer', 'xrpl-expert']`).

To “train” an agent for a certain kind of work, give it the right skills:

```ts
// Example: make @path-optimizer also use bridge-query
{ id: 'path-optimizer', name: '@path-optimizer', skillIds: ['xrpl-path-optimizer', 'bridge-query'], status: 'idle', ... },
```

State is persisted (e.g. in localStorage), so after changing `DEFAULT_AGENTS` you may need to clear that storage or re-initialize so new users get the updated list.

---

## 4. Connect your own AI API (including a fine-tuned model)

The orchestrator (`src/agents/Orchestrator.ts`) builds a **system + user prompt** from the task, context, and matched skills, then calls an external API when configured.

1. **Set env vars** (e.g. in `.env`):
   ```env
   VITE_AI_API_URL=https://api.openai.com/v1/chat/completions
   VITE_AI_API_KEY=sk-...
   ```
   Or point to your own proxy / fine-tuned endpoint (e.g. OpenAI fine-tune, or another provider).

2. **API contract**  
   - **Request:** POST, JSON body with at least `prompt` (or `messages`).  
   - **Response:** JSON with `analysis`, `codeSuggestions`, `uiUpdates`, and optionally `neonImpactScore`.  
   If your API returns OpenAI-style `choices[].message.content`, the orchestrator can parse that content as JSON.

3. **Using a fine-tuned model**  
   - Train/fine-tune your model elsewhere (e.g. OpenAI fine-tuning, or your own backend).  
   - Expose an HTTP endpoint that accepts the same request format and returns the same response shape.  
   - Set `VITE_AI_API_URL` (and key if needed) to that endpoint.  
   The app does not train the model; it only sends prompts and uses the response. So “training” the brain of the agents = training the external model and then pointing the hub at it.

---

## 5. Tune the orchestrator prompt

The prompt template is in `src/agents/Orchestrator.ts`, in **`buildPrompt()`**. It currently:

- Injects matched skill names (e.g. `@xrpl-expert`, `@xrpl-path-optimizer`).
- Sets a system instruction and asks for JSON output with `analysis`, `codeSuggestions`, `uiUpdates`, and optionally `neonImpactScore`.

To “train” or steer behavior:

- Change the system text (tone, focus, constraints).
- Add few-shot examples in the template.
- Include more context from `context` in the user message.

After editing, rebuild and (if using an external API) ensure your model is fine-tuned or prompted to follow the new format.

---

## 6. Optional: richer skill prompts (.skill.ts)

Skills can have a full **prompt** and **tools** in `src/skills/*.skill.ts` (e.g. `xrpl-path-optimizer.skill.ts`). The orchestrator or other code can use these when building the final prompt. Editing the `prompt` string in a `.skill.ts` file is another way to “train” how that skill is applied when its keywords match.

---

## Summary

| Goal | Where to do it |
|------|----------------|
| Make tasks match the right skills | `src/agents/skills/registry.ts` (keywords, description) |
| Give an agent new capabilities | `src/store/agentStore.ts` (skillIds per agent) |
| Use a custom or fine-tuned LLM | `.env`: `VITE_AI_API_URL` (+ `VITE_AI_API_KEY`) |
| Change how the orchestrator prompts the AI | `src/agents/Orchestrator.ts` (`buildPrompt`) |
| Change how a skill is described to the AI | `src/skills/<name>.skill.ts` (prompt, tools) |

There is no in-app “train a model” button; training the Agent Hub = **configuring skills and agents** + **optionally pointing at a trained/fine-tuned API**.

---

## External references (FinRL, OpenBB, MARL, Langflow, etc.)

When designing or training agents, use the curated repos and prompt template in **[AGENT-HUB-REFERENCES.md](./AGENT-HUB-REFERENCES.md)** — Finance/Quant (FinRL, FinGPT, OpenBB), Game Theory/MARL (open_spiel, awesome-game-ai), Math for ML, Wolfram/symbolic, and agent frameworks (LangChain, Langflow). Copy-paste the prompt template into Cursor when asking for agent code or training loops.
