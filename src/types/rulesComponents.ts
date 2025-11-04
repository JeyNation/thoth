import { AnchorMatchMode, AnchorRule, RegexMatchRule, AbsoluteRule, ExtractionRule } from './extractionRules';

export type FieldRule = AnchorRule | RegexMatchRule | AbsoluteRule;

export interface RuleHeaderProps {
    label: string;
    onAddRule: () => void;
    editingRuleId: string | null;
}

export interface ViewRuleProps {
    rule: FieldRule;
    index: number;
    onEdit: () => void;
    onDelete: () => void;
    onDragStart: () => void;
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    onDrop: () => void;
    isDragged: boolean;
}

export interface EditRuleProps {
    rule: FieldRule;
    index: number;
    onDone: () => void;
    onUpdateField: (updates: Partial<FieldRule>) => void;
}

export interface RuleTypeSelectProps {
    value: ExtractionRule['ruleType'];
    onChange: (value: ExtractionRule['ruleType']) => void;
}

export interface SearchZoneProps {
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
    onChange: (field: string, value: string) => void;
    disabled?: boolean;
}

export interface RegexPatternsProps {
    patterns: Array<{ regex: string; priority: number }>;
    onAdd: (pattern: string) => void;
    onDelete: (index: number) => void;
    onDragStart: (index: number) => void;
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    onDrop: (index: number) => void;
    isDragged: (index: number) => boolean;
}

export interface AnchorConfigProps {
    // Full anchor rule to edit
    rule: AnchorRule;
    // Updater to bubble anchor-specific field updates
    onUpdateField: (updates: Partial<AnchorRule>) => void;

    // Aliases (anchor text) controls
    anchors: string[];
    onAdd: (anchor: string) => void;
    onDelete: (index: number) => void;
    onEdit: (index: number) => void;
    onUpdate: (anchor: string) => void;
    onCancel: () => void;
    editingIndex: number | null;
    inputValue: string;
    onInputChange: (value: string) => void;
}
