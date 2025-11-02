import type { LayoutMap, Field, AnchorRule, RegexMatchRule, AbsoluteRule } from '@/types/extractionRules';
import type { BoundingBox } from '@/types/boundingBox';

export interface FieldExtractionSegment {
    text: string;
    sourceFieldIds: string[];
}

export interface FieldExtraction {
    extractionFieldId: string;
    value: string;
    segments: FieldExtractionSegment[];
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

                switch (rule.ruleType) {
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
                    console.log('result', result);
                    return result;
                }
            } catch (error) {
                console.error(`Error executing rule ${rule.id}:`, error);
            }
        }

        return null;
    }

    private executeAnchorRule(fieldId: string, rule: AnchorRule): FieldExtraction | null {
        const anchorBox = this.findAnchor(rule.anchorConfig);
        
        console.log('Anchor box found:', anchorBox);
        if (!anchorBox) {
            return null;
        }

        const extractionBoxes = this.findExtractionBox(anchorBox, rule.positionConfig);
        
        console.log('Extraction boxes found:', extractionBoxes);
        if (!extractionBoxes || extractionBoxes.length === 0) {
            return null;
        }

        // Filter boxes and normalize text, but keep track of which boxes are valid
        const validBoxes = extractionBoxes.filter(box => {
            const text = box.fieldText.replace(/\s+/g, ' ').trim();
            const parsed = this.parseText(text, rule.parserConfig);
            return parsed !== null && text.length > 0;
        });

        if (validBoxes.length === 0) {
            return null;
        }

        // Build segments with source field IDs
        const segments: FieldExtractionSegment[] = [];
        let extractedText: string;
        
        if (validBoxes.length === 1) {
            const text = validBoxes[0].fieldText.replace(/\s+/g, ' ').trim();
            extractedText = text;
            segments.push({
                text: text,
                sourceFieldIds: [validBoxes[0].fieldId]
            });
        } else {
            // Build the combined text by checking vertical positions
            const lines: Array<{ text: string; sourceFieldIds: string[] }> = [];
            let currentLine: { texts: string[]; sourceFieldIds: string[] } = {
                texts: [validBoxes[0].fieldText.replace(/\s+/g, ' ').trim()],
                sourceFieldIds: [validBoxes[0].fieldId]
            };
            
            for (let i = 1; i < validBoxes.length; i++) {
                const prevBounds = this.calculateBounds(validBoxes[i - 1].points);
                const currBounds = this.calculateBounds(validBoxes[i].points);
                const text = validBoxes[i].fieldText.replace(/\s+/g, ' ').trim();
                
                // Check if boxes are on roughly the same horizontal line
                const verticalOverlap = Math.min(prevBounds.bottom, currBounds.bottom) - Math.max(prevBounds.top, currBounds.top);
                const avgHeight = ((prevBounds.bottom - prevBounds.top) + (currBounds.bottom - currBounds.top)) / 2;
                
                // If vertical overlap is significant (> 50% of average height), they're on same line
                if (verticalOverlap > avgHeight * 0.5) {
                    currentLine.texts.push(text);
                    currentLine.sourceFieldIds.push(validBoxes[i].fieldId);
                } else {
                    // Different line - flush current line and start new one
                    lines.push({
                        text: currentLine.texts.join(' '),
                        sourceFieldIds: currentLine.sourceFieldIds
                    });
                    currentLine = {
                        texts: [text],
                        sourceFieldIds: [validBoxes[i].fieldId]
                    };
                }
            }
            
            // Add the last line
            if (currentLine.texts.length > 0) {
                lines.push({
                    text: currentLine.texts.join(' '),
                    sourceFieldIds: currentLine.sourceFieldIds
                });
            }
            
            extractedText = lines.map(l => l.text).join('\n');
            segments.push(...lines);
        }

        return {
            extractionFieldId: fieldId,
            value: extractedText,
            segments,
            ruleId: rule.id
        };
    }

    private findAnchor(config: AnchorRule['anchorConfig']): BoundingBox | null {
        const candidateBoxes = this.boundingBoxes.filter(box => {

            const boxBounds = this.calculateBounds(box.points);
            
            if (boxBounds.top < config.searchZone.top) return false;
            if (boxBounds.left < config.searchZone.left) return false;
            if (boxBounds.right > config.searchZone.right) return false;
            if (boxBounds.bottom > config.searchZone.bottom) return false;

            const normalizedText = box.fieldText.trim();
            return config.aliases.some(alias => 
                normalizedText.toLowerCase() === alias.toLowerCase()
            );
        });

        if (candidateBoxes.length === 0) {
            return null;
        }

        const instanceIndex = config.instance - 1;
        return candidateBoxes[instanceIndex] || null;
    }

    private findExtractionBox(anchorBox: BoundingBox, config: AnchorRule['positionConfig']): BoundingBox[] {
        const anchorBounds = this.calculateBounds(anchorBox.points);
        
        let searchArea: { top: number; left: number; right: number; bottom: number };

        if (config.type === 'relative') {
            const direction = config.direction || 'bottom';
            
            switch (direction) {
                case 'bottom':
                    searchArea = {
                        top: anchorBounds.bottom + config.boundingBox.top,
                        left: anchorBounds.left + config.boundingBox.left,
                        right: anchorBounds.right + config.boundingBox.right,
                        bottom: anchorBounds.bottom + config.boundingBox.bottom,
                    };
                    break;
                case 'top':
                    searchArea = {
                        top: anchorBounds.top + config.boundingBox.top,
                        left: anchorBounds.left + config.boundingBox.left,
                        right: anchorBounds.right + config.boundingBox.right,
                        bottom: anchorBounds.top + config.boundingBox.bottom,
                    };
                    break;
                case 'right':
                    searchArea = {
                        top: anchorBounds.top + config.boundingBox.top,
                        left: anchorBounds.right + config.boundingBox.left,
                        right: anchorBounds.right + config.boundingBox.right,
                        bottom: anchorBounds.bottom + config.boundingBox.bottom,
                    };
                    break;
                case 'left':
                    searchArea = {
                        top: anchorBounds.top + config.boundingBox.top,
                        left: anchorBounds.left + config.boundingBox.left,
                        right: anchorBounds.left + config.boundingBox.right,
                        bottom: anchorBounds.bottom + config.boundingBox.bottom,
                    };
                    break;
            }
        } else {
            searchArea = config.boundingBox;
        }

        const candidateBoxes = this.boundingBoxes.filter(box => {
            const boxBounds = this.calculateBounds(box.points);
            const isOverlap = this.isOverlapping(boxBounds, searchArea);
            
            if (isOverlap) {
                console.log('Found overlapping box:', box.fieldText, boxBounds);
            }
            
            return isOverlap;
        });

        candidateBoxes.sort((a, b) => {
            const aBounds = this.calculateBounds(a.points);
            const bBounds = this.calculateBounds(b.points);
            return aBounds.top - bBounds.top;
        });

        return candidateBoxes;
    }

    private parseText(text: string, config: AnchorRule['parserConfig']): string | null {
        try {
            const regex = new RegExp(config.regex);
            const match = text.match(regex);
            
            if (!match) {
                return null;
            }

            return match[1] || match[0];
        } catch (error) {
            console.error('Regex parsing error:', error);
            return null;
        }
    }

    private calculateBounds(points: Array<{ x: number; y: number }>): { top: number; left: number; right: number; bottom: number } {
        const xs = points.map(p => p.x);
        const ys = points.map(p => p.y);
        return {
            left: Math.min(...xs),
            top: Math.min(...ys),
            right: Math.max(...xs),
            bottom: Math.max(...ys)
        };
    }

    private isOverlapping(box: { top: number; left: number; right: number; bottom: number }, area: { top: number; left: number; right: number; bottom: number }): boolean {
        return !(
            box.right < area.left ||
            box.left > area.right ||
            box.bottom < area.top ||
            box.top > area.bottom
        );
    }

    private executeRegexMatchRule(fieldId: string, rule: RegexMatchRule): FieldExtraction | null {
        return null;
    }

    private executeAbsoluteRule(fieldId: string, rule: AbsoluteRule): FieldExtraction | null {
        return null;
    }
}
