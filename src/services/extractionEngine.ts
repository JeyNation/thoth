import type { LayoutMap, Field, AnchorRule, RegexMatchRule, AbsoluteRule } from '@/types/extractionRules';

export interface BoundingBox {
    generatedId: string;
    text: string;
    page: number;
    points: Array<{ x: number; y: number }>;
    confidence?: number;
}

export interface FieldExtraction {
    fieldId: string;
    value: string;
    boundingBoxIds: string[];
    ruleId: string;
    confidence?: number;
}

export interface ExtractionEngineResult {
    extractions: FieldExtraction[];
    matchedRules: string[];
    unmatchedRules: string[];
    errors: string[];
}

export class ExtractionEngine {
    private boundingBoxes: BoundingBox[];
    private layoutMap: LayoutMap;

    constructor(boundingBoxes: BoundingBox[], layoutMap: LayoutMap) {
        this.boundingBoxes = boundingBoxes;
        this.layoutMap = layoutMap;
    }

    public extract(): ExtractionEngineResult {
        const extractions: FieldExtraction[] = [];
        const matchedRules: string[] = [];
        const unmatchedRules: string[] = [];
        const errors: string[] = [];

        for (const field of this.layoutMap.fields) {
            const fieldResult = this.extractField(field);
            
            if (fieldResult) {
                extractions.push(fieldResult);
                matchedRules.push(fieldResult.ruleId);
            } else {
                const ruleIds = field.rules.map(rule => rule.id);
                unmatchedRules.push(...ruleIds);
            }
        }

        return {
            extractions,
            matchedRules,
            unmatchedRules,
            errors
        };
    }

    private extractField(field: Field): FieldExtraction | null {
        const sortedRules = [...field.rules].sort((a, b) => a.priority - b.priority);

        for (const rule of sortedRules) {
            try {
                let result: FieldExtraction | null = null;

                switch (rule.rule_type) {
                    case 'anchor':
                        result = this.executeAnchorRule(field.id, rule);
                        break;
                    case 'regex_match':
                        result = this.executeRegexMatchRule(field.id, rule);
                        break;
                    case 'absolute':
                        result = this.executeAbsoluteRule(field.id, rule);
                        break;
                }

                if (result) {
                    return result;
                }
            } catch (error) {
                console.error(`Error executing rule ${rule.id}:`, error);
            }
        }

        return null;
    }

    private executeAnchorRule(fieldId: string, rule: AnchorRule): FieldExtraction | null {
        return null;
    }

    private executeRegexMatchRule(fieldId: string, rule: RegexMatchRule): FieldExtraction | null {
        return null;
    }

    private executeAbsoluteRule(fieldId: string, rule: AbsoluteRule): FieldExtraction | null {
        return null;
    }
}
