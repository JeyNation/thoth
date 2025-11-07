export interface BoundingBox {
    top: number;
    left: number;
    right: number;
    bottom: number;
}

export interface PositionPoint {
    width: number;
    height: number;
    top: number;
    left: number;
}

// ============================================================================
// Rule Configuration
// ============================================================================

export type AnchorMatchMode = 'exact' | 'startsWith' | 'contains' | 'endsWith';

export interface AnchorConfig {
    aliases: string[];
    searchZone: BoundingBox;
    instance: number;
    instanceFrom?: 'start' | 'end';
    matchMode?: AnchorMatchMode;  // Default: 'exact'
    ignoreCase?: boolean;          // Default: true
    normalizeWhitespace?: boolean; // Default: true
    pageScope?: 'first' | 'last' | 'any'; // Default: 'first'
}

// UI hint for where X/Y offsets originate from relative to the anchor box
export type StartingPositionCorner = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

export type PositionType = 'relative' | 'absolute';

export interface PositionConfig {
    point: PositionPoint;
    startingPosition?: StartingPositionCorner;
}

export interface ParserPattern {
    regex: string;
    priority: number; // Lower number = higher priority (try first)
    label?: string;   // Optional human-readable label (e.g., preset name)
}

export interface ParserConfig {
    patterns?: ParserPattern[];  // List of patterns to try in priority order
    regex?: string;              // Legacy: single regex (converted to patterns internally)
    fallbackToFullText?: boolean; // If all patterns fail, return the full text anyway (default: false)
}

// ============================================================================
// Extraction Rules
// ============================================================================

export type RuleType = 'anchor' | 'regex_match' | 'absolute';

export interface ExtractionRule {
    id: string;
    priority: number;
    ruleType: RuleType;
}

export interface AnchorRule extends ExtractionRule {
    ruleType: 'anchor';
    anchorConfig: AnchorConfig;
    positionConfig: PositionConfig;
    parserConfig: ParserConfig;
}

export interface RegexMatchRule extends ExtractionRule {
    ruleType: 'regex_match';
}

export interface AbsoluteRule extends ExtractionRule {
    ruleType: 'absolute';
}

// ============================================================================
// Layout Map
// ============================================================================

export interface Field {
    id: string;
    rules: (AnchorRule | RegexMatchRule | AbsoluteRule)[];
}

export interface LayoutMap {
    id: string;
    name?: string;
    vendorId?: string;
    version?: string;
    fields: Field[];
    createdAt?: string;
    updatedAt?: string;
}
