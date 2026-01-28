// CARV - LLM Agent Service
// AI-powered payment decision engine with function calling

import { PaymentIntentEnvelope, CARVEvent, CARVEventHandler } from './types';
import { getPathfinder, Pathfinder, PathfinderResult } from './pathfinder';

// ==================== TYPES ====================

export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'local' | 'mock';
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface PaymentRequest {
  task: string; // Natural language description of what to do
  context?: Record<string, any>; // Additional context (market data, balances, etc.)
  constraints?: {
    maxAmount?: number;
    allowedAssets?: string[];
    allowedRecipients?: string[];
    requireConfirmation?: boolean;
  };
}

export interface PaymentDecision {
  approved: boolean;
  reasoning: string;
  confidence: number; // 0-1
  suggestedPayment?: {
    payee: string;
    amount: number;
    asset: string;
    memo?: string;
  };
  warnings?: string[];
  alternativeActions?: string[];
}

export interface AgentThought {
  step: number;
  thought: string;
  action?: string;
  observation?: string;
  timestamp: string;
}

export interface AgentSession {
  sessionId: string;
  regimeSummary: string;
  thoughts: AgentThought[];
  decisions: PaymentDecision[];
  startedAt: string;
}

// ==================== FUNCTION DEFINITIONS ====================

const PAYMENT_FUNCTIONS = [
  {
    name: 'approve_payment',
    description: 'Approve a payment to be executed. Call this when the payment request is valid and should proceed.',
    parameters: {
      type: 'object',
      properties: {
        payee: {
          type: 'string',
          description: 'The recipient wallet address or payment pointer',
        },
        amount: {
          type: 'number',
          description: 'The amount to send',
        },
        asset: {
          type: 'string',
          description: 'The asset/currency code (e.g., XRP, USD)',
        },
        reasoning: {
          type: 'string',
          description: 'Explanation of why this payment is approved',
        },
        confidence: {
          type: 'number',
          description: 'Confidence level 0-1 in this decision',
        },
        memo: {
          type: 'string',
          description: 'Optional memo/note for the payment',
        },
      },
      required: ['payee', 'amount', 'asset', 'reasoning', 'confidence'],
    },
  },
  {
    name: 'reject_payment',
    description: 'Reject a payment request. Call this when the payment should NOT proceed.',
    parameters: {
      type: 'object',
      properties: {
        reasoning: {
          type: 'string',
          description: 'Explanation of why this payment is rejected',
        },
        warnings: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of concerns or warnings',
        },
        alternative_actions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Suggested alternative actions the user could take',
        },
      },
      required: ['reasoning'],
    },
  },
  {
    name: 'request_clarification',
    description: 'Request more information before making a decision',
    parameters: {
      type: 'object',
      properties: {
        questions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Questions that need to be answered',
        },
        partial_reasoning: {
          type: 'string',
          description: 'Current understanding and what is unclear',
        },
      },
      required: ['questions'],
    },
  },
];

// ==================== LLM AGENT CLASS ====================

export class LLMAgent {
  private config: LLMConfig;
  private eventHandlers: Set<CARVEventHandler> = new Set();
  private currentSession: AgentSession | null = null;
  private regimeSummary: string = '';

  constructor(config: LLMConfig = { provider: 'mock' }) {
    this.config = {
      provider: config.provider,
      model: config.model || this.getDefaultModel(config.provider),
      temperature: config.temperature ?? 0.3,
      maxTokens: config.maxTokens ?? 1000,
      apiKey: config.apiKey,
    };
  }

  // ==================== SESSION MANAGEMENT ====================

  /**
   * Start a new agent session
   */
  startSession(regimeSummary: string): AgentSession {
    this.regimeSummary = regimeSummary;
    this.currentSession = {
      sessionId: `session_${Date.now().toString(36)}`,
      regimeSummary,
      thoughts: [],
      decisions: [],
      startedAt: new Date().toISOString(),
    };
    return this.currentSession;
  }

  /**
   * Get current session
   */
  getSession(): AgentSession | null {
    return this.currentSession;
  }

  /**
   * Set regime summary (trading rules)
   */
  setRegime(summary: string): void {
    this.regimeSummary = summary;
    if (this.currentSession) {
      this.currentSession.regimeSummary = summary;
    }
  }

  // ==================== PAYMENT EVALUATION ====================

  /**
   * Evaluate a payment request
   */
  async evaluatePayment(request: PaymentRequest): Promise<PaymentDecision> {
    const thought: AgentThought = {
      step: (this.currentSession?.thoughts.length || 0) + 1,
      thought: `Evaluating payment request: "${request.task}"`,
      timestamp: new Date().toISOString(),
    };

    if (this.currentSession) {
      this.currentSession.thoughts.push(thought);
    }

    // Build the prompt
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(request);

    // Call LLM
    let decision: PaymentDecision;

    switch (this.config.provider) {
      case 'openai':
        decision = await this.callOpenAI(systemPrompt, userPrompt);
        break;
      case 'anthropic':
        decision = await this.callAnthropic(systemPrompt, userPrompt);
        break;
      case 'local':
        decision = await this.callLocalModel(systemPrompt, userPrompt);
        break;
      case 'mock':
      default:
        decision = await this.mockEvaluation(request);
    }

    // Update thought with result
    thought.action = decision.approved ? 'APPROVED' : 'REJECTED';
    thought.observation = decision.reasoning;

    if (this.currentSession) {
      this.currentSession.decisions.push(decision);
    }

    return decision;
  }

  /**
   * Generate reasoning hash for PIE
   */
  generateReasoningHash(decision: PaymentDecision): string {
    const content = JSON.stringify({
      reasoning: decision.reasoning,
      confidence: decision.confidence,
      timestamp: new Date().toISOString(),
      regime: this.regimeSummary,
    });

    return this.hashString(content);
  }

  // ==================== PROMPT BUILDING ====================

  private buildSystemPrompt(): string {
    return `You are an AI payment assistant operating under strict safety constraints.

REGIME CONTEXT (Your operating rules):
${this.regimeSummary || 'No specific regime defined. Use conservative defaults.'}

RESPONSIBILITIES:
1. Evaluate payment requests against the regime rules
2. Approve only payments that clearly align with the regime
3. Reject any suspicious, unclear, or rule-violating requests
4. Provide clear reasoning for all decisions
5. When in doubt, reject or request clarification

SAFETY PRINCIPLES:
- Never approve payments larger than what's reasonable for the task
- Be suspicious of urgency or pressure tactics
- Verify recipient legitimacy when possible
- Consider the user's stated intentions and risk tolerance
- Always explain your reasoning in detail

You must respond by calling one of the provided functions.`;
  }

  private buildUserPrompt(request: PaymentRequest): string {
    let prompt = `PAYMENT REQUEST:\n"${request.task}"\n\n`;

    if (request.context) {
      prompt += `CONTEXT:\n${JSON.stringify(request.context, null, 2)}\n\n`;
    }

    if (request.constraints) {
      prompt += `CONSTRAINTS:\n`;
      if (request.constraints.maxAmount) {
        prompt += `- Maximum amount: ${request.constraints.maxAmount}\n`;
      }
      if (request.constraints.allowedAssets) {
        prompt += `- Allowed assets: ${request.constraints.allowedAssets.join(', ')}\n`;
      }
      if (request.constraints.allowedRecipients) {
        prompt += `- Allowed recipients: ${request.constraints.allowedRecipients.join(', ')}\n`;
      }
      prompt += '\n';
    }

    prompt += 'Evaluate this request and call the appropriate function.';

    return prompt;
  }

  // ==================== LLM PROVIDERS ====================

  private async callOpenAI(systemPrompt: string, userPrompt: string): Promise<PaymentDecision> {
    if (!this.config.apiKey) {
      console.warn('[LLMAgent] No API key, falling back to mock');
      return this.mockEvaluation({ task: userPrompt });
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          functions: PAYMENT_FUNCTIONS,
          function_call: 'auto',
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const message = data.choices[0].message;

      if (message.function_call) {
        return this.parseFunctionCall(message.function_call);
      }

      // No function call, try to parse text response
      return {
        approved: false,
        reasoning: message.content || 'Unable to evaluate request',
        confidence: 0.5,
        warnings: ['LLM did not use structured response'],
      };
    } catch (error) {
      console.error('[LLMAgent] OpenAI error:', error);
      return {
        approved: false,
        reasoning: `API error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        confidence: 0,
        warnings: ['API call failed'],
      };
    }
  }

  private async callAnthropic(systemPrompt: string, userPrompt: string): Promise<PaymentDecision> {
    if (!this.config.apiKey) {
      console.warn('[LLMAgent] No API key, falling back to mock');
      return this.mockEvaluation({ task: userPrompt });
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2024-01-01',
        },
        body: JSON.stringify({
          model: this.config.model,
          max_tokens: this.config.maxTokens,
          system: systemPrompt,
          messages: [
            { role: 'user', content: userPrompt },
          ],
          tools: PAYMENT_FUNCTIONS.map(f => ({
            name: f.name,
            description: f.description,
            input_schema: f.parameters,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Find tool use in response
      const toolUse = data.content.find((c: any) => c.type === 'tool_use');
      
      if (toolUse) {
        return this.parseFunctionCall({
          name: toolUse.name,
          arguments: JSON.stringify(toolUse.input),
        });
      }

      // No tool use, parse text
      const textContent = data.content.find((c: any) => c.type === 'text');
      return {
        approved: false,
        reasoning: textContent?.text || 'Unable to evaluate request',
        confidence: 0.5,
        warnings: ['LLM did not use structured response'],
      };
    } catch (error) {
      console.error('[LLMAgent] Anthropic error:', error);
      return {
        approved: false,
        reasoning: `API error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        confidence: 0,
        warnings: ['API call failed'],
      };
    }
  }

  private async callLocalModel(systemPrompt: string, userPrompt: string): Promise<PaymentDecision> {
    // For local models (Ollama, LMStudio, etc.)
    // This would integrate with local inference
    console.log('[LLMAgent] Local model not configured, using mock');
    return this.mockEvaluation({ task: userPrompt });
  }

  // ==================== MOCK EVALUATION ====================

  private async mockEvaluation(request: PaymentRequest): Promise<PaymentDecision> {
    // Intelligent mock that simulates LLM behavior
    await this.delay(500 + Math.random() * 500); // Simulate latency

    const task = request.task.toLowerCase().trim();
    
    // ========== STEP 1: Is this even a payment request? ==========
    
    // Check if it's a question (not a payment)
    const isQuestion = task.includes('?') || 
      task.startsWith('how') || 
      task.startsWith('what') || 
      task.startsWith('why') ||
      task.startsWith('when') ||
      task.startsWith('where') ||
      task.startsWith('can i') ||
      task.startsWith('could') ||
      task.startsWith('would') ||
      task.includes('help me understand');

    if (isQuestion) {
      return {
        approved: false,
        reasoning: `This looks like a question, not a payment request. I can only process payment instructions like "Send 5 XRP to rABC123 for coffee".`,
        confidence: 0.95,
        alternativeActions: [
          'Try: "Send [amount] XRP to [address]"',
          'Example: "Pay 10 XRP to rN7n3473SaZBCG4dFL83w7a1RXtXtbk2D9 for dinner"',
          'Click "How does this work?" for help',
        ],
      };
    }

    // Check if it's too short or nonsensical
    const words = task.split(/\s+/).filter(w => w.length > 1);
    if (words.length < 3 || task.length < 10) {
      return {
        approved: false,
        reasoning: `I didn't understand that. Please tell me clearly what payment you want to make.`,
        confidence: 0.9,
        alternativeActions: [
          'Be specific: "Send 5 XRP to rABC123"',
          'Include: amount, recipient, and optionally what it\'s for',
        ],
      };
    }

    // Check for payment intent keywords
    const paymentKeywords = ['send', 'pay', 'transfer', 'give', 'wire', 'remit'];
    const hasPaymentIntent = paymentKeywords.some(kw => task.includes(kw));
    
    if (!hasPaymentIntent) {
      // Maybe it's a statement about needing to pay something
      const needsKeywords = ['need to pay', 'want to pay', 'have to pay', 'gotta pay', 'must pay'];
      const expressesNeed = needsKeywords.some(kw => task.includes(kw));
      
      if (expressesNeed) {
        return {
          approved: false,
          reasoning: `I understand you need to make a payment, but I need more details to help you.`,
          confidence: 0.85,
          alternativeActions: [
            'Who should I send the payment to? (wallet address or payment pointer)',
            'How much do you want to send?',
            'Example: "Send 50 XRP to rN7n3473SaZBCG4dFL83w7a1RXtXtbk2D9"',
          ],
        };
      }

      return {
        approved: false,
        reasoning: `I'm not sure what you want me to do. I can only help with payments.`,
        confidence: 0.8,
        alternativeActions: [
          'To make a payment, say: "Send [amount] XRP to [address]"',
          'Example: "Pay 5 XRP to $wallet.example.com for coffee"',
        ],
      };
    }

    // ========== STEP 2: Extract payment details using Pathfinder ==========
    
    const pathfinder = getPathfinder();
    const parsed = pathfinder.parsePaymentRequest(task);
    
    // Parse amounts from task
    const amountMatch = task.match(/(\d+\.?\d*)\s*(xrp|usd|eur)?/i);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : (parsed.amount || 0);
    
    // Use Pathfinder to resolve the recipient
    let payee = '';
    let resolvedName = '';
    let pathfinderResult: PathfinderResult | undefined;

    // First, check for direct addresses
    const xrplAddressMatch = task.match(/(r[a-zA-Z0-9]{24,34})/);
    const paymentPointerMatch = task.match(/(\$[a-zA-Z0-9._/-]+)/);
    
    if (xrplAddressMatch) {
      payee = xrplAddressMatch[1];
    } else if (paymentPointerMatch) {
      payee = paymentPointerMatch[1];
    } else if (parsed.resolved?.found) {
      // Pathfinder found an institution or contact!
      pathfinderResult = parsed.resolved;
      payee = parsed.resolved.address || '';
      
      if (parsed.resolved.institution) {
        resolvedName = parsed.resolved.institution.name;
      } else if (parsed.resolved.contact) {
        resolvedName = parsed.resolved.contact.name;
      }
    } else {
      // Try to resolve any mentioned entity
      const toMatch = task.match(/to\s+([a-zA-Z0-9$._\-/\s]+?)(?:\s+for|\s+\d|$)/i);
      if (toMatch) {
        const candidate = toMatch[1].trim();
        const resolved = pathfinder.resolve(candidate);
        if (resolved.found) {
          pathfinderResult = resolved;
          payee = resolved.address || '';
          if (resolved.institution) {
            resolvedName = resolved.institution.name;
          } else if (resolved.contact) {
            resolvedName = resolved.contact.name;
          }
        }
      }
    }

    // ========== STEP 3: Validate we have required info ==========
    
    const missingInfo: string[] = [];
    
    if (!amount || amount <= 0) {
      missingInfo.push('amount (e.g., "50 XRP", "150 USD")');
    }
    
    if (!payee) {
      // Check if Pathfinder found suggestions
      if (parsed.resolved && !parsed.resolved.found && parsed.resolved.didYouMean?.length) {
        const suggestions = parsed.resolved.didYouMean.slice(0, 3).map(s => s.name);
        return {
          approved: false,
          reasoning: `I couldn't find "${parsed.target}". Did you mean one of these?`,
          confidence: 0.8,
          alternativeActions: [
            ...suggestions.map(s => `Try: "Pay [amount] to ${s}"`),
            'Or use a direct address: "Send 50 XRP to rABC123..."',
          ],
        };
      }
      
      missingInfo.push('recipient (e.g., "FPL", "AT&T", or a wallet address)');
    }

    if (missingInfo.length > 0) {
      // Provide helpful context based on what we found
      const helpfulExamples = [
        `Please specify the ${missingInfo.join(' and ')}`,
      ];
      
      if (!payee) {
        helpfulExamples.push(
          'You can pay institutions: "Send 50 XRP to FPL"',
          'Or use addresses: "Send 5 XRP to rN7n3473..."',
          'Known institutions: FPL, AT&T, Verizon, Netflix, Spotify...'
        );
      }
      
      if (!amount) {
        helpfulExamples.push('Include an amount: "Pay 150 XRP to FPL for electric bill"');
      }

      return {
        approved: false,
        reasoning: `I need more information to complete this payment. Missing: ${missingInfo.join(' and ')}.`,
        confidence: 0.9,
        alternativeActions: helpfulExamples,
      };
    }

    // ========== STEP 4: Safety checks ==========
    
    const redFlags: string[] = [];
    
    if (task.includes('urgent') || task.includes('immediately') || task.includes('right now')) {
      redFlags.push('Urgency pressure detected - take your time to verify');
    }
    if (task.includes('secret') || task.includes('dont tell') || task.includes("don't tell")) {
      redFlags.push('Secrecy request is suspicious');
    }
    if (amount > 100) {
      redFlags.push(`Large amount (${amount}) - please double-check`);
    }

    // Check regime compliance
    const regimeChecks = this.checkRegimeCompliance(request);
    
    if (regimeChecks.length > 0) {
      return {
        approved: false,
        reasoning: `Payment blocked by your safety rules: ${regimeChecks.join('; ')}`,
        confidence: 0.95,
        warnings: regimeChecks,
        alternativeActions: [
          'Reduce the amount to stay within limits',
          'Change to a different regime in Settings',
        ],
      };
    }

    // ========== STEP 5: Approve with details ==========
    
    const asset = amountMatch?.[2]?.toUpperCase() || 'XRP';
    
    // Build approval message
    let recipientDisplay = payee;
    if (resolvedName) {
      recipientDisplay = `${resolvedName} (${payee.slice(0, 12)}...)`;
    } else if (payee.length > 20) {
      recipientDisplay = `${payee.slice(0, 12)}...${payee.slice(-6)}`;
    }

    let reasoning = `Payment approved: Sending ${amount} ${asset} to ${recipientDisplay}.`;
    
    if (pathfinderResult?.institution) {
      reasoning += ` Routed via ${pathfinderResult.institution.name}'s ${pathfinderResult.paymentMethod?.name || 'payment system'}.`;
    }
    
    reasoning += ` This is within your ${this.regimeSummary.includes('Conservative') ? 'conservative' : 'current'} regime limits.`;
    
    if (redFlags.length > 0) {
      reasoning += ` Note: ${redFlags.join('; ')}`;
    }

    return {
      approved: true,
      reasoning,
      confidence: redFlags.length > 0 ? 0.75 : 0.9,
      suggestedPayment: {
        payee,
        amount,
        asset,
        memo: resolvedName 
          ? `CARV: Payment to ${resolvedName}` 
          : `CARV: ${request.task.slice(0, 50)}`,
      },
      warnings: redFlags.length > 0 ? redFlags : undefined,
    };
  }

  private checkRegimeCompliance(request: PaymentRequest): string[] {
    const issues: string[] = [];
    const regime = this.regimeSummary.toLowerCase();

    // Check for conservative regime violations
    if (regime.includes('conservative')) {
      const amountMatch = request.task.match(/(\d+\.?\d*)/);
      const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
      
      if (amount > 10) {
        issues.push('Amount exceeds conservative regime limits');
      }
    }

    // Check for restricted activities
    if (regime.includes('no trading') && request.task.toLowerCase().includes('trade')) {
      issues.push('Trading activity not permitted under current regime');
    }

    if (regime.includes('no gambling') && 
        (request.task.toLowerCase().includes('bet') || request.task.toLowerCase().includes('gambl'))) {
      issues.push('Gambling activity not permitted under current regime');
    }

    return issues;
  }

  // ==================== HELPERS ====================

  private parseFunctionCall(functionCall: { name: string; arguments: string }): PaymentDecision {
    const args = JSON.parse(functionCall.arguments);

    switch (functionCall.name) {
      case 'approve_payment':
        return {
          approved: true,
          reasoning: args.reasoning,
          confidence: args.confidence,
          suggestedPayment: {
            payee: args.payee,
            amount: args.amount,
            asset: args.asset,
            memo: args.memo,
          },
        };

      case 'reject_payment':
        return {
          approved: false,
          reasoning: args.reasoning,
          confidence: 0.9,
          warnings: args.warnings,
          alternativeActions: args.alternative_actions,
        };

      case 'request_clarification':
        return {
          approved: false,
          reasoning: args.partial_reasoning || 'Need more information',
          confidence: 0.5,
          alternativeActions: args.questions,
        };

      default:
        return {
          approved: false,
          reasoning: 'Unknown function call',
          confidence: 0,
        };
    }
  }

  private getDefaultModel(provider: string): string {
    switch (provider) {
      case 'openai': return 'gpt-4-turbo-preview';
      case 'anthropic': return 'claude-3-sonnet-20240229';
      case 'local': return 'llama2';
      default: return 'mock';
    }
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(16, '0');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==================== EVENTS ====================

  subscribe(handler: CARVEventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }
}

// ==================== SINGLETON ====================

let llmAgent: LLMAgent | null = null;

export function getLLMAgent(config?: LLMConfig): LLMAgent {
  if (!llmAgent) {
    llmAgent = new LLMAgent(config);
  }
  return llmAgent;
}

export function resetLLMAgent(): void {
  llmAgent = null;
}

export default LLMAgent;
