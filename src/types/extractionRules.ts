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
    search_zone: BoundingBox;
    instance: number;
}

export type Direction = 'top' | 'bottom' | 'left' | 'right';

export type PositionType = 'relative' | 'absolute';

export interface PositionConfig {
    type: PositionType;
    bounding_box: BoundingBox;
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
    rule_type: RuleType;
}

export interface AnchorRule extends ExtractionRule {
    rule_type: 'anchor';
    anchor_config: AnchorConfig;
    position_config: PositionConfig;
    parser_config: ParserConfig;
}

export interface RegexMatchRule extends ExtractionRule {
    rule_type: 'regex_match';
}

export interface AbsoluteRule extends ExtractionRule {
    rule_type: 'absolute';
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
    vendor_id?: string;
    version?: string;
    fields: Field[];
    created_at?: string;
    updated_at?: string;
}
