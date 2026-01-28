// CARV - Pathfinder
// Smart routing to institutions, contacts, and payment endpoints
// "Pay my FPL bill" → Routes to FPL's payment address

import { VenueType } from './types';

// ==================== TYPES ====================

export interface Institution {
  id: string;
  name: string;
  aliases: string[];  // Alternative names: ["fpl", "florida power", "electric bill"]
  category: InstitutionCategory;
  paymentMethods: PaymentMethod[];
  defaultMethod: string;  // ID of preferred payment method
  logo?: string;
  website?: string;
  description?: string;
}

export type InstitutionCategory = 
  | 'utility'        // Electric, water, gas
  | 'telecom'        // Phone, internet, cable
  | 'financial'      // Banks, credit cards
  | 'subscription'   // Netflix, Spotify
  | 'government'     // Taxes, fees
  | 'healthcare'     // Insurance, medical
  | 'education'      // Tuition, loans
  | 'retail'         // Stores, merchants
  | 'personal'       // Friends, family
  | 'other';

export interface PaymentMethod {
  id: string;
  type: 'xrpl' | 'ilp' | 'ach' | 'wire' | 'card';
  address: string;        // XRPL address, payment pointer, account number
  name: string;           // "XRPL Direct", "Pay via ILP"
  fee?: number;           // Estimated fee
  processingTime?: string; // "Instant", "1-2 days"
  minAmount?: number;
  maxAmount?: number;
  currency?: string;      // Preferred currency
  memo?: string;          // Required memo/reference format
  instructions?: string;  // Special instructions
}

export interface Contact {
  id: string;
  name: string;
  aliases: string[];
  addresses: ContactAddress[];
  defaultAddress: string;
  notes?: string;
  lastUsed?: string;
  totalSent?: number;
}

export interface ContactAddress {
  id: string;
  type: 'xrpl' | 'ilp' | 'email';
  address: string;
  label?: string;  // "Personal", "Business"
  verified?: boolean;
}

export interface PathfinderResult {
  found: boolean;
  type: 'institution' | 'contact' | 'direct' | 'unknown';
  
  // Resolved entity
  institution?: Institution;
  contact?: Contact;
  
  // Resolved payment details
  paymentMethod?: PaymentMethod;
  address?: string;
  venue?: VenueType;
  
  // Suggestions if not found
  suggestions?: string[];
  didYouMean?: Array<{ name: string; score: number }>;
}

// ==================== INSTITUTION DIRECTORY ====================

const INSTITUTIONS: Institution[] = [
  // ===== UTILITIES =====
  {
    id: 'fpl',
    name: 'Florida Power & Light',
    aliases: ['fpl', 'florida power', 'florida power and light', 'electric bill', 'power bill', 'electricity'],
    category: 'utility',
    description: 'Florida\'s largest electric utility',
    website: 'https://www.fpl.com',
    paymentMethods: [
      {
        id: 'fpl-xrpl',
        type: 'xrpl',
        address: 'rFPLPayments1234567890ABCDEFGHIJ',
        name: 'XRPL Direct Pay',
        fee: 0,
        processingTime: 'Instant',
        currency: 'XRP',
        memo: 'FPL-ACCOUNT-{accountNumber}',
      },
      {
        id: 'fpl-ilp',
        type: 'ilp',
        address: '$fpl.payments.example.com/bills',
        name: 'Interledger Pay',
        fee: 0.001,
        processingTime: 'Instant',
        currency: 'USD',
      },
    ],
    defaultMethod: 'fpl-xrpl',
  },
  {
    id: 'duke-energy',
    name: 'Duke Energy',
    aliases: ['duke', 'duke energy', 'duke power'],
    category: 'utility',
    paymentMethods: [
      {
        id: 'duke-xrpl',
        type: 'xrpl',
        address: 'rDukeEnergy123456789ABCDEFGHIJK',
        name: 'XRPL Direct',
        processingTime: 'Instant',
      },
    ],
    defaultMethod: 'duke-xrpl',
  },
  {
    id: 'water-utility',
    name: 'City Water Utility',
    aliases: ['water bill', 'water', 'city water', 'water utility'],
    category: 'utility',
    paymentMethods: [
      {
        id: 'water-xrpl',
        type: 'xrpl',
        address: 'rWaterUtility123456789ABCDEFGHI',
        name: 'XRPL Pay',
        processingTime: 'Instant',
      },
    ],
    defaultMethod: 'water-xrpl',
  },

  // ===== TELECOM =====
  {
    id: 'att',
    name: 'AT&T',
    aliases: ['att', 'at&t', 'at and t', 'phone bill', 'mobile bill', 'cell phone'],
    category: 'telecom',
    website: 'https://www.att.com',
    paymentMethods: [
      {
        id: 'att-xrpl',
        type: 'xrpl',
        address: 'rATTPayments123456789ABCDEFGHIJ',
        name: 'XRPL Express',
        processingTime: 'Instant',
      },
      {
        id: 'att-ilp',
        type: 'ilp',
        address: '$att.payments.com/bills',
        name: 'ILP Pay',
        processingTime: 'Instant',
      },
    ],
    defaultMethod: 'att-xrpl',
  },
  {
    id: 'verizon',
    name: 'Verizon',
    aliases: ['verizon', 'vzw', 'verizon wireless'],
    category: 'telecom',
    paymentMethods: [
      {
        id: 'verizon-xrpl',
        type: 'xrpl',
        address: 'rVerizonPay123456789ABCDEFGHIJK',
        name: 'XRPL Pay',
        processingTime: 'Instant',
      },
    ],
    defaultMethod: 'verizon-xrpl',
  },
  {
    id: 'tmobile',
    name: 'T-Mobile',
    aliases: ['tmobile', 't-mobile', 't mobile'],
    category: 'telecom',
    paymentMethods: [
      {
        id: 'tmobile-xrpl',
        type: 'xrpl',
        address: 'rTMobilePayments123456789ABCDEFG',
        name: 'XRPL Pay',
        processingTime: 'Instant',
      },
    ],
    defaultMethod: 'tmobile-xrpl',
  },
  {
    id: 'comcast',
    name: 'Comcast / Xfinity',
    aliases: ['comcast', 'xfinity', 'internet bill', 'cable bill', 'wifi bill'],
    category: 'telecom',
    paymentMethods: [
      {
        id: 'comcast-xrpl',
        type: 'xrpl',
        address: 'rComcastPay123456789ABCDEFGHIJK',
        name: 'XRPL Direct',
        processingTime: 'Instant',
      },
    ],
    defaultMethod: 'comcast-xrpl',
  },

  // ===== SUBSCRIPTIONS =====
  {
    id: 'netflix',
    name: 'Netflix',
    aliases: ['netflix', 'streaming'],
    category: 'subscription',
    website: 'https://www.netflix.com',
    paymentMethods: [
      {
        id: 'netflix-ilp',
        type: 'ilp',
        address: '$netflix.com/payments',
        name: 'Web Monetization',
        processingTime: 'Instant',
        currency: 'USD',
      },
    ],
    defaultMethod: 'netflix-ilp',
  },
  {
    id: 'spotify',
    name: 'Spotify',
    aliases: ['spotify', 'music subscription'],
    category: 'subscription',
    paymentMethods: [
      {
        id: 'spotify-ilp',
        type: 'ilp',
        address: '$spotify.com/premium',
        name: 'ILP Pay',
        processingTime: 'Instant',
      },
    ],
    defaultMethod: 'spotify-ilp',
  },

  // ===== FINANCIAL =====
  {
    id: 'chase',
    name: 'Chase Bank',
    aliases: ['chase', 'chase bank', 'jpmorgan', 'credit card bill'],
    category: 'financial',
    paymentMethods: [
      {
        id: 'chase-xrpl',
        type: 'xrpl',
        address: 'rChaseBank123456789ABCDEFGHIJKL',
        name: 'XRPL Transfer',
        processingTime: '1-2 business days',
        memo: 'CHASE-ACCT-{accountNumber}',
      },
    ],
    defaultMethod: 'chase-xrpl',
  },

  // ===== GOVERNMENT =====
  {
    id: 'irs',
    name: 'Internal Revenue Service',
    aliases: ['irs', 'taxes', 'federal taxes', 'tax payment'],
    category: 'government',
    paymentMethods: [
      {
        id: 'irs-xrpl',
        type: 'xrpl',
        address: 'rIRSPayments123456789ABCDEFGHIJ',
        name: 'XRPL Tax Payment',
        processingTime: 'Instant',
        memo: 'TAX-{taxYear}-{ssn}',
        instructions: 'Include tax year and last 4 of SSN in memo',
      },
    ],
    defaultMethod: 'irs-xrpl',
  },
];

// ==================== PATHFINDER CLASS ====================

export class Pathfinder {
  private institutions: Institution[] = INSTITUTIONS;
  private contacts: Contact[] = [];
  private userPreferences: Map<string, string> = new Map(); // category -> institution ID

  // ==================== RESOLUTION ====================

  /**
   * Resolve a payment target from natural language
   * Examples: "fpl", "my electric bill", "rABC123...", "$wallet.example.com"
   */
  resolve(target: string): PathfinderResult {
    const normalized = target.toLowerCase().trim();

    // 1. Check if it's a direct address (XRPL or payment pointer)
    if (this.isXRPLAddress(target)) {
      return {
        found: true,
        type: 'direct',
        address: target,
        venue: 'xrpl',
      };
    }

    if (this.isPaymentPointer(target)) {
      return {
        found: true,
        type: 'direct',
        address: target,
        venue: 'ilp',
      };
    }

    // 2. Check contacts first (personal takes priority)
    const contact = this.findContact(normalized);
    if (contact) {
      const defaultAddr = contact.addresses.find(a => a.id === contact.defaultAddress);
      return {
        found: true,
        type: 'contact',
        contact,
        address: defaultAddr?.address,
        venue: this.addressToVenue(defaultAddr?.type),
      };
    }

    // 3. Check institutions
    const institution = this.findInstitution(normalized);
    if (institution) {
      const method = institution.paymentMethods.find(m => m.id === institution.defaultMethod);
      return {
        found: true,
        type: 'institution',
        institution,
        paymentMethod: method,
        address: method?.address,
        venue: this.methodToVenue(method?.type),
      };
    }

    // 4. Check category shortcuts ("electric bill" → user's preferred electric provider)
    const categoryResult = this.resolveByCategory(normalized);
    if (categoryResult) {
      return categoryResult;
    }

    // 5. Not found - provide suggestions
    return {
      found: false,
      type: 'unknown',
      suggestions: this.getSuggestions(normalized),
      didYouMean: this.fuzzyMatch(normalized),
    };
  }

  /**
   * Parse a full payment request and resolve the target
   * "pay 50 to fpl" → { target: "fpl", amount: 50, resolved: Institution }
   */
  parsePaymentRequest(text: string): {
    target?: string;
    amount?: number;
    asset?: string;
    resolved?: PathfinderResult;
  } {
    const normalized = text.toLowerCase();

    // Extract amount
    const amountMatch = normalized.match(/(\d+\.?\d*)\s*(xrp|usd|eur)?/i);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : undefined;
    const asset = amountMatch?.[2]?.toUpperCase() || 'XRP';

    // Extract target - look for "to [target]" or "pay [target]"
    let target: string | undefined;

    // Pattern: "to [target]"
    const toMatch = normalized.match(/to\s+([a-zA-Z0-9$._\-/]+(?:\s+[a-zA-Z]+)?)/i);
    if (toMatch) {
      target = toMatch[1].trim();
    }

    // Pattern: "pay [target]" (if no "to")
    if (!target) {
      const payMatch = normalized.match(/pay\s+(?:my\s+)?([a-zA-Z0-9$._\-/]+(?:\s+bill)?)/i);
      if (payMatch) {
        target = payMatch[1].trim();
      }
    }

    // Check for institution names directly in the text
    if (!target) {
      for (const inst of this.institutions) {
        for (const alias of inst.aliases) {
          if (normalized.includes(alias)) {
            target = alias;
            break;
          }
        }
        if (target) break;
      }
    }

    // Resolve the target
    const resolved = target ? this.resolve(target) : undefined;

    return { target, amount, asset, resolved };
  }

  // ==================== SEARCH ====================

  private findInstitution(query: string): Institution | undefined {
    // Exact match on ID
    const byId = this.institutions.find(i => i.id === query);
    if (byId) return byId;

    // Match on name
    const byName = this.institutions.find(i => 
      i.name.toLowerCase() === query
    );
    if (byName) return byName;

    // Match on aliases
    return this.institutions.find(i =>
      i.aliases.some(alias => 
        alias === query || 
        query.includes(alias) || 
        alias.includes(query)
      )
    );
  }

  private findContact(query: string): Contact | undefined {
    return this.contacts.find(c =>
      c.name.toLowerCase() === query ||
      c.aliases.some(a => a.toLowerCase() === query)
    );
  }

  private resolveByCategory(query: string): PathfinderResult | undefined {
    // Map common phrases to categories
    const categoryMap: Record<string, InstitutionCategory> = {
      'electric bill': 'utility',
      'power bill': 'utility',
      'electricity': 'utility',
      'water bill': 'utility',
      'gas bill': 'utility',
      'phone bill': 'telecom',
      'mobile bill': 'telecom',
      'internet bill': 'telecom',
      'cable bill': 'telecom',
    };

    for (const [phrase, category] of Object.entries(categoryMap)) {
      if (query.includes(phrase)) {
        // Check user preference for this category
        const preferredId = this.userPreferences.get(category);
        if (preferredId) {
          const institution = this.institutions.find(i => i.id === preferredId);
          if (institution) {
            const method = institution.paymentMethods.find(m => m.id === institution.defaultMethod);
            return {
              found: true,
              type: 'institution',
              institution,
              paymentMethod: method,
              address: method?.address,
              venue: this.methodToVenue(method?.type),
            };
          }
        }

        // Return first institution in category
        const institution = this.institutions.find(i => i.category === category);
        if (institution) {
          const method = institution.paymentMethods.find(m => m.id === institution.defaultMethod);
          return {
            found: true,
            type: 'institution',
            institution,
            paymentMethod: method,
            address: method?.address,
            venue: this.methodToVenue(method?.type),
          };
        }
      }
    }

    return undefined;
  }

  // ==================== FUZZY MATCHING ====================

  private fuzzyMatch(query: string): Array<{ name: string; score: number }> {
    const results: Array<{ name: string; score: number }> = [];

    for (const institution of this.institutions) {
      // Check name similarity
      const nameScore = this.similarity(query, institution.name.toLowerCase());
      if (nameScore > 0.3) {
        results.push({ name: institution.name, score: nameScore });
        continue;
      }

      // Check alias similarity
      for (const alias of institution.aliases) {
        const aliasScore = this.similarity(query, alias);
        if (aliasScore > 0.3) {
          results.push({ name: institution.name, score: aliasScore });
          break;
        }
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, 5);
  }

  private similarity(a: string, b: string): number {
    // Simple Levenshtein-based similarity
    if (a === b) return 1;
    if (a.length === 0 || b.length === 0) return 0;

    const matrix: number[][] = [];

    for (let i = 0; i <= a.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= b.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    const maxLen = Math.max(a.length, b.length);
    return 1 - matrix[a.length][b.length] / maxLen;
  }

  private getSuggestions(query: string): string[] {
    return [
      'Try using the full institution name (e.g., "Florida Power & Light")',
      'Or use a direct address: "rABC123..." or "$wallet.example.com"',
      'You can also add contacts in Settings',
    ];
  }

  // ==================== CONTACTS MANAGEMENT ====================

  addContact(contact: Contact): void {
    const existing = this.contacts.findIndex(c => c.id === contact.id);
    if (existing >= 0) {
      this.contacts[existing] = contact;
    } else {
      this.contacts.push(contact);
    }
  }

  removeContact(contactId: string): void {
    this.contacts = this.contacts.filter(c => c.id !== contactId);
  }

  getContacts(): Contact[] {
    return [...this.contacts];
  }

  // ==================== USER PREFERENCES ====================

  setPreferredProvider(category: InstitutionCategory, institutionId: string): void {
    this.userPreferences.set(category, institutionId);
  }

  getPreferredProvider(category: InstitutionCategory): string | undefined {
    return this.userPreferences.get(category);
  }

  // ==================== DIRECTORY ACCESS ====================

  getInstitutions(): Institution[] {
    return [...this.institutions];
  }

  getInstitutionsByCategory(category: InstitutionCategory): Institution[] {
    return this.institutions.filter(i => i.category === category);
  }

  getInstitution(id: string): Institution | undefined {
    return this.institutions.find(i => i.id === id);
  }

  // ==================== HELPERS ====================

  private isXRPLAddress(str: string): boolean {
    return /^r[a-zA-Z0-9]{24,34}$/.test(str);
  }

  private isPaymentPointer(str: string): boolean {
    return str.startsWith('$') && str.includes('.');
  }

  private methodToVenue(type?: string): VenueType {
    switch (type) {
      case 'xrpl': return 'xrpl';
      case 'ilp': return 'ilp';
      default: return 'simulation';
    }
  }

  private addressToVenue(type?: string): VenueType {
    switch (type) {
      case 'xrpl': return 'xrpl';
      case 'ilp': return 'ilp';
      default: return 'simulation';
    }
  }
}

// ==================== SINGLETON ====================

let pathfinder: Pathfinder | null = null;

export function getPathfinder(): Pathfinder {
  if (!pathfinder) {
    pathfinder = new Pathfinder();
  }
  return pathfinder;
}

export function resetPathfinder(): void {
  pathfinder = null;
}

export default Pathfinder;
