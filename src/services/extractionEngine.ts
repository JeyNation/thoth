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
    private documentBounds: { width: number; height: number };

    constructor(boundingBoxes: BoundingBox[], layoutMap: LayoutMap) {
        this.boundingBoxes = boundingBoxes;
        this.layoutMap = layoutMap;
        this.documentBounds = this.calculateDocumentBounds();
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
                    return result;
                }
            } catch (error) {
                console.error(`Error executing rule ${rule.id}:`, error);
            }
        }

        return null;
    }

    private executeAnchorRule(fieldId: string, rule: AnchorRule): FieldExtraction | null {
        const anchorResult = this.findAnchor(rule.anchorConfig);
        
        if (!anchorResult) {
            return null;
        }

        const { box: anchorBox, matchedAlias } = anchorResult;

        const extractionBoxes = this.findExtractionBox(anchorBox, rule.positionConfig, anchorBox.fieldId);
        
        if (!extractionBoxes || extractionBoxes.length === 0) {
            return null;
        }

        // Normalize text for each box; track which boxes are usable (non-empty text)
        const normalized = extractionBoxes
            .map(box => ({ box, text: box.fieldText.replace(/\s+/g, ' ').trim() }))
            .filter(item => item.text.length > 0);

        if (normalized.length === 0) {
            return null;
        }

        // Build combined text and segments grouped by visual rows
        const segments: FieldExtractionSegment[] = [];
        let combinedText: string;

        if (normalized.length === 1) {
            combinedText = normalized[0].text;
            segments.push({ text: normalized[0].text, sourceFieldIds: [normalized[0].box.fieldId] });
        } else {
            const lines: Array<{ text: string; sourceFieldIds: string[] }> = [];
            let currentLine: { texts: string[]; sourceFieldIds: string[] } = {
                texts: [normalized[0].text],
                sourceFieldIds: [normalized[0].box.fieldId]
            };

            for (let i = 1; i < normalized.length; i++) {
                const prevBounds = this.calculateBounds(normalized[i - 1].box.points);
                const currBounds = this.calculateBounds(normalized[i].box.points);
                const text = normalized[i].text;

                const verticalOverlap = Math.min(prevBounds.bottom, currBounds.bottom) - Math.max(prevBounds.top, currBounds.top);
                const avgHeight = ((prevBounds.bottom - prevBounds.top) + (currBounds.bottom - currBounds.top)) / 2;

                if (verticalOverlap > avgHeight * 0.5) {
                    currentLine.texts.push(text);
                    currentLine.sourceFieldIds.push(normalized[i].box.fieldId);
                } else {
                    lines.push({ text: currentLine.texts.join(' '), sourceFieldIds: currentLine.sourceFieldIds });
                    currentLine = { texts: [text], sourceFieldIds: [normalized[i].box.fieldId] };
                }
            }

            if (currentLine.texts.length > 0) {
                lines.push({ text: currentLine.texts.join(' '), sourceFieldIds: currentLine.sourceFieldIds });
            }

            combinedText = lines.map(l => l.text).join('\n');
            segments.push(...lines);
        }

        const parsed = this.parseText(combinedText, rule.parserConfig);
        if (!parsed) {
            return null;
        }

        return {
            extractionFieldId: fieldId,
            value: parsed,
            segments,
            ruleId: rule.id
        };
    }

    private findAnchor(config: AnchorRule['anchorConfig']): { box: BoundingBox; matchedAlias: string } | null {
        // Set defaults
        const matchMode = config.matchMode || 'exact';
        const ignoreCase = config.ignoreCase !== false; // Default true
        const normalizeWhitespace = config.normalizeWhitespace !== false; // Default true
        const pageScope = (config as any).pageScope || 'first';

        // Determine eligible pages based on scope
        let minPage = Infinity;
        let maxPage = -Infinity;
        for (const b of this.boundingBoxes) {
            if (b.page < minPage) minPage = b.page;
            if (b.page > maxPage) maxPage = b.page;
        }

        // Normalize the search zone from 0-1 coordinates to absolute pixel coordinates
        const absoluteSearchZone = this.normalizeSearchZone(config.searchZone);

        const candidateBoxes: Array<{ box: BoundingBox; matchedAlias: string }> = [];

        for (const box of this.boundingBoxes) {
            // Page filter
            if (pageScope === 'first' && box.page !== minPage) continue;
            if (pageScope === 'last' && box.page !== maxPage) continue;

            const boxBounds = this.calculateBounds(box.points);
            
            if (boxBounds.top < absoluteSearchZone.top) continue;
            if (boxBounds.left < absoluteSearchZone.left) continue;
            if (boxBounds.right > absoluteSearchZone.right) continue;
            if (boxBounds.bottom > absoluteSearchZone.bottom) continue;

            // Normalize the text from the bounding box
            let normalizedText = box.fieldText;
            if (normalizeWhitespace) {
                normalizedText = normalizedText.replace(/\s+/g, ' ').trim();
            }
            if (ignoreCase) {
                normalizedText = normalizedText.toLowerCase();
            }

            // Check if any alias matches using the specified match mode
            for (const alias of config.aliases) {
                let normalizedAlias = alias;
                if (normalizeWhitespace) {
                    normalizedAlias = normalizedAlias.replace(/\s+/g, ' ').trim();
                }
                if (ignoreCase) {
                    normalizedAlias = normalizedAlias.toLowerCase();
                }

                let isMatch = false;
                switch (matchMode) {
                    case 'exact':
                        isMatch = normalizedText === normalizedAlias;
                        break;
                    case 'startsWith':
                        isMatch = normalizedText.startsWith(normalizedAlias);
                        break;
                    case 'contains':
                        isMatch = normalizedText.includes(normalizedAlias);
                        break;
                    case 'endsWith':
                        isMatch = normalizedText.endsWith(normalizedAlias);
                        break;
                    default:
                        isMatch = normalizedText === normalizedAlias;
                }

                if (isMatch) {
                    candidateBoxes.push({ box, matchedAlias: alias });
                    break;
                }
            }
        }

        if (candidateBoxes.length === 0) {
            return null;
        }

        const from = (config as any).instanceFrom === 'end' ? 'end' : 'start';
        const instance = Math.max(1, config.instance || 1);
        let instanceIndex = from === 'start'
            ? instance - 1
            : candidateBoxes.length - instance;
            
        if (instanceIndex < 0 || instanceIndex >= candidateBoxes.length) {
            return null;
        }
        return candidateBoxes[instanceIndex] || null;
    }

    private findExtractionBox(anchorBox: BoundingBox, config: AnchorRule['positionConfig'], excludeFieldId?: string): BoundingBox[] {
        const anchorBounds = this.calculateBounds(anchorBox.points);
        const startingPosition = config.startingPosition || 'bottomLeft'; // Default fallback
        const baseTop = (startingPosition === 'topLeft' || startingPosition === 'topRight')
            ? anchorBounds.top
            : anchorBounds.bottom;
        const baseLeft = (startingPosition === 'topLeft' || startingPosition === 'bottomLeft')
            ? anchorBounds.left
            : anchorBounds.right;

        const searchArea = {
            top: baseTop + config.point.top,
            left: baseLeft + config.point.left,
            right: baseLeft + config.point.left + config.point.width,
            bottom: baseTop + config.point.top + config.point.height,
        };

        const candidateBoxes = this.boundingBoxes.filter(box => {
            if (box.page !== anchorBox.page) return false;

            const boxBounds = this.calculateBounds(box.points);
            const isOverlap = this.isOverlapping(boxBounds, searchArea);
            return isOverlap;
        });

        candidateBoxes.sort((a, b) => {
            const aBounds = this.calculateBounds(a.points);
            const bBounds = this.calculateBounds(b.points);

            const verticalOverlap = Math.min(aBounds.bottom, bBounds.bottom) - Math.max(aBounds.top, bBounds.top);
            const avgHeight = ((aBounds.bottom - aBounds.top) + (bBounds.bottom - bBounds.top)) / 2;

            if (verticalOverlap > avgHeight * 0.5) {
                if (aBounds.left !== bBounds.left) return aBounds.left - bBounds.left;
                return aBounds.top - bBounds.top;
            }

            if (aBounds.top !== bBounds.top) return aBounds.top - bBounds.top;
            return aBounds.left - bBounds.left;
        });

        return candidateBoxes;
    }

    private parseText(text: string, config: AnchorRule['parserConfig']): string | null {
        try {
            const fallbackToFullText = config?.fallbackToFullText !== false;
            
            let patternsToUse: Array<{ regex: string; priority: number }> = [];

            if (config.patterns && config.patterns.length > 0) {
                patternsToUse = [...config.patterns];
            }

            if (patternsToUse.length === 0) {
                return fallbackToFullText ? text : null;
            }

            patternsToUse.sort((a, b) => a.priority - b.priority);

            for (const pattern of patternsToUse) {
                try {
                    const regex = new RegExp(pattern.regex);
                    const match = text.match(regex);
                    
                    if (match) {
                        const result = match[1] !== undefined ? match[1] : match[0];
                        if (result && result.trim().length > 0) {
                            return result.trim();
                        }
                    }
                } catch (patternError) {
                    console.warn(`Pattern "${pattern.regex}" failed:`, patternError);
                    continue;
                }
            }

            if (fallbackToFullText) {
                return text;
            }

            return null;
        } catch (error) {
            console.error('Regex parsing error:', error);
            return config.fallbackToFullText !== false ? text : null;
        }
    }

    private calculateDocumentBounds(): { width: number; height: number } {
        if (this.boundingBoxes.length === 0) {
            return { width: 1700, height: 2200 };
        }

        let maxRight = 0;
        let maxBottom = 0;

        for (const box of this.boundingBoxes) {
            const bounds = this.calculateBounds(box.points);
            maxRight = Math.max(maxRight, bounds.right);
            maxBottom = Math.max(maxBottom, bounds.bottom);
        }

        return {
            width: maxRight || 1700,
            height: maxBottom || 2200
        };
    }

    private normalizeSearchZone(searchZone: { top: number; left: number; right: number; bottom: number }): { top: number; left: number; right: number; bottom: number } {
        if (searchZone.top > 1 || searchZone.left > 1 || searchZone.right > 1 || searchZone.bottom > 1) {
            return searchZone;
        }

        return {
            top: searchZone.top * this.documentBounds.height,
            left: searchZone.left * this.documentBounds.width,
            right: searchZone.right * this.documentBounds.width,
            bottom: searchZone.bottom * this.documentBounds.height
        };
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
