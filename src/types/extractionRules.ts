export interface BoundingBox {
    top: number;
    left: number;
    right: number;
    bottom: number;
}

// ============================================================================
// Rule Configuration
// ============================================================================

export interface AnchorConfig {
    aliases: string[];
    searchZone: BoundingBox;
    instance: number;
}

export type Direction = 'top' | 'bottom' | 'left' | 'right';

export type PositionType = 'relative' | 'absolute';

export interface PositionConfig {
    type: PositionType;
    boundingBox: BoundingBox;
    direction?: Direction;
}

export interface ParserConfig {
    regex: string;
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
