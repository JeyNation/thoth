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
        
        // Calculate document dimensions from all bounding boxes
        this.documentBounds = this.calculateDocumentBounds();
    }

    public extract(): ExtractionEngineResult {
        const extractions: FieldExtraction[] = [];
        const matchedRules: string[] = [];
        const unmatchedRules: string[] = [];
        const errors: string[] = [];

        for (const field of this.layoutMap.fields) {

            console.log('Extracting field:', field.id);

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
        const anchorResult = this.findAnchor(rule.anchorConfig);
        
        console.log('Anchor result for field', fieldId, ':', anchorResult);

        if (!anchorResult) {
            return null;
        }

        const { box: anchorBox, matchedAlias } = anchorResult;

        // Try to extract from the same box first (for cases like "PO: 123456" in one field)
        const sameBoxExtraction = this.tryExtractFromAnchorBox(anchorBox, matchedAlias, rule);
        if (sameBoxExtraction) {
            return {
                extractionFieldId: fieldId,
                value: sameBoxExtraction.value,
                segments: sameBoxExtraction.segments,
                ruleId: rule.id
            };
        }

        // Fall back to looking for separate boxes in the relative position
        const extractionBoxes = this.findExtractionBox(anchorBox, rule.positionConfig, anchorBox.fieldId);
        
        console.log('Extraction boxes for field', fieldId, ':', extractionBoxes);

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

    private findAnchor(config: AnchorRule['anchorConfig']): { box: BoundingBox; matchedAlias: string } | null {
        // Set defaults
        const matchMode = config.matchMode || 'exact';
        const ignoreCase = config.ignoreCase !== false; // Default true
        const normalizeWhitespace = config.normalizeWhitespace !== false; // Default true

        // Normalize the search zone from 0-1 coordinates to absolute pixel coordinates
        const absoluteSearchZone = this.normalizeSearchZone(config.searchZone);

        const candidateBoxes: Array<{ box: BoundingBox; matchedAlias: string }> = [];

        for (const box of this.boundingBoxes) {
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
                    break; // Stop checking other aliases for this box
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

    private tryExtractFromAnchorBox(
        anchorBox: BoundingBox, 
        matchedAlias: string, 
        rule: AnchorRule
    ): { value: string; segments: FieldExtractionSegment[] } | null {
        // Only try to extract from the same box if we're looking to the right
        // (This handles cases like "PO: 123456" in a single field)
        if (rule.positionConfig.direction !== 'right') {
            return null;
        }

        const fullText = anchorBox.fieldText;
        const matchMode = rule.anchorConfig.matchMode || 'exact';
        const ignoreCase = rule.anchorConfig.ignoreCase !== false;
        const normalizeWhitespace = rule.anchorConfig.normalizeWhitespace !== false;

        // Normalize the full text
        let normalizedText = fullText;
        if (normalizeWhitespace) {
            normalizedText = normalizedText.replace(/\s+/g, ' ').trim();
        }

        // Find where the alias appears in the text
        let aliasToFind = matchedAlias;
        if (normalizeWhitespace) {
            aliasToFind = aliasToFind.replace(/\s+/g, ' ').trim();
        }

        let searchText = normalizedText;
        let searchAlias = aliasToFind;
        
        if (ignoreCase) {
            searchText = searchText.toLowerCase();
            searchAlias = searchAlias.toLowerCase();
        }

        let valueStartIndex = -1;

        switch (matchMode) {
            case 'exact':
                // For exact match, the entire field is the anchor, no value to extract
                return null;
            case 'startsWith':
                if (searchText.startsWith(searchAlias)) {
                    valueStartIndex = aliasToFind.length;
                }
                break;
            case 'contains':
                const containsIndex = searchText.indexOf(searchAlias);
                if (containsIndex !== -1) {
                    valueStartIndex = containsIndex + aliasToFind.length;
                }
                break;
            case 'endsWith':
                // If it ends with the alias, there's no value after it
                return null;
        }

        if (valueStartIndex === -1) {
            return null;
        }

        // Extract the value part (everything after the alias)
        const valuePart = normalizedText.substring(valueStartIndex).trim();
        
        if (!valuePart) {
            return null;
        }

        // Parse using the same patterns - they work for both same-box and separate-box
        const parsed = this.parseText(valuePart, rule.parserConfig);
        if (!parsed) {
            return null;
        }

        return {
            value: parsed, // Use the parsed value, not the raw valuePart
            segments: [{
                text: parsed,
                sourceFieldIds: [anchorBox.fieldId]
            }]
        };
    }

    private findExtractionBox(anchorBox: BoundingBox, config: AnchorRule['positionConfig'], excludeFieldId?: string): BoundingBox[] {
        const anchorBounds = this.calculateBounds(anchorBox.points);
        
        let searchArea: { top: number; left: number; right: number; bottom: number };

        console.log('bounds', config.point);

        if (config.type === 'relative') {
            if (config.startingPosition) {
                // New: derive baseline from explicit starting corner
                const baseTop = (config.startingPosition === 'topLeft' || config.startingPosition === 'topRight')
                    ? anchorBounds.top
                    : anchorBounds.bottom;
                const baseLeft = (config.startingPosition === 'topLeft' || config.startingPosition === 'bottomLeft')
                    ? anchorBounds.left
                    : anchorBounds.right;

                searchArea = {
                    top: baseTop + config.point.top,
                    left: baseLeft + config.point.left,
                    right: baseLeft + config.point.left + config.point.width,
                    bottom: baseTop + config.point.top + config.point.height,
                };
            } else {
                const direction = config.direction || 'bottom';
                switch (direction) {
                    case 'right':
                        // Start from right-top corner of anchor
                        searchArea = {
                            top: anchorBounds.top + config.point.top,
                            left: anchorBounds.right + config.point.left,
                            right: anchorBounds.right + config.point.left + config.point.width,
                            bottom: anchorBounds.top + config.point.top + config.point.height,
                        };
                        break;
                    case 'bottom':
                    default:
                        // Default to bottom if direction is unknown
                        searchArea = {
                            top: anchorBounds.bottom + config.point.top,
                            left: anchorBounds.left + config.point.left,
                            right: anchorBounds.left + config.point.left + config.point.width,
                            bottom: anchorBounds.bottom + config.point.top + config.point.height,
                        };
                        break;
                }
            }
        } else {
            searchArea = anchorBounds;
        }

        console.log('Searching extraction boxes in area:', searchArea);

        const candidateBoxes = this.boundingBoxes.filter(box => {
            // Exclude the anchor box itself
            if (excludeFieldId && box.fieldId === excludeFieldId) {
                return false;
            }

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
            // Default fallbackToFullText to true if not explicitly set
            const fallbackToFullText = config?.fallbackToFullText !== false;
            
            // Determine which patterns to use
            let patternsToUse: Array<{ regex: string; priority: number }> = [];

            if (config.patterns && config.patterns.length > 0) {
                patternsToUse = [...config.patterns];
            } else if (config.regex) {
                // Legacy support: convert single regex to pattern
                patternsToUse = [{ regex: config.regex, priority: 1 }];
            }

            if (patternsToUse.length === 0) {
                // No patterns defined, return the text as-is if fallback is enabled
                return fallbackToFullText ? text : null;
            }

            // Sort by priority (lower number = higher priority)
            patternsToUse.sort((a, b) => a.priority - b.priority);

            // Try each pattern in order
            for (const pattern of patternsToUse) {
                try {
                    const regex = new RegExp(pattern.regex);
                    const match = text.match(regex);
                    
                    if (match) {
                        // Return first capture group if available, otherwise the whole match
                        const result = match[1] !== undefined ? match[1] : match[0];
                        if (result && result.trim().length > 0) {
                            return result.trim();
                        }
                    }
                } catch (patternError) {
                    console.warn(`Pattern "${pattern.regex}" failed:`, patternError);
                    continue; // Try next pattern
                }
            }

            // All patterns failed
            if (fallbackToFullText) {
                return text;
            }

            return null;
        } catch (error) {
            console.error('Regex parsing error:', error);
            // Default fallbackToFullText to true if not explicitly set
            return config.fallbackToFullText !== false ? text : null;
        }
    }

    private calculateDocumentBounds(): { width: number; height: number } {
        if (this.boundingBoxes.length === 0) {
            // Default to standard page size if no boxes
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
        // If values are already in absolute coordinates (> 1), return as-is for backwards compatibility
        if (searchZone.top > 1 || searchZone.left > 1 || searchZone.right > 1 || searchZone.bottom > 1) {
            return searchZone;
        }

        // Convert normalized coordinates (0-1) to absolute pixel coordinates
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
