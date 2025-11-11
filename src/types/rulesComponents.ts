import {
  AnchorMatchMode,
  AnchorRule,
  RegexMatchRule,
  AbsoluteRule,
  ExtractionRule,
  PositionConfig,
  StartingPositionCorner,
} from './extractionRules';

export type FieldRule = AnchorRule | RegexMatchRule | AbsoluteRule;

export interface RuleEditorProps {}

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
  // show preset and split controls (if the caller wants them shown inside the SearchZone)
  showPreset?: boolean;
  showSplit?: boolean;
  // show page scope selector and current value
  showPages?: boolean;
  pageScope?: 'first' | 'last' | 'any';
}

export interface RegexPatternsProps {
  patterns: Array<{ regex: string; priority: number; label?: string }>;
  onAdd: (pattern: string | { regex: string; label?: string }) => void;
  onUpdate: (index: number, pattern: string | { regex: string; label?: string }) => void;
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

export interface PositionProps {
  positionConfig?: PositionConfig;
  onChangePosition: (updates: Partial<PositionConfig>) => void;
  disabled?: boolean;
}

export interface ValueMatchProps {
  rule: RegexMatchRule;
  onUpdateField: (updates: Partial<RegexMatchRule>) => void;
  disabled?: boolean;
}
