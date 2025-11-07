import { AnchorRule, RegexMatchRule, AbsoluteRule, RuleType } from '../types/extractionRules';
import { numberToWords } from './strings';

type FieldRule = AnchorRule | RegexMatchRule | AbsoluteRule;

export function generatePseudoRule(rule: FieldRule): string[] {
    const lines: string[] = [];
    
    const ordinal = (n: number) => {
        const s = ["th", "st", "nd", "rd"], v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    const formatPercentage = (value: number) => Math.round(value * 100);

    // Add rule type and ID as header
    const englishPriority = numberToWords(rule.priority as number).toUpperCase();
    lines.push(`TACTIC ${englishPriority} - ${rule.ruleType.toUpperCase()}`);

    if (rule.ruleType === 'anchor') {
        const anchorRule = rule as AnchorRule;
        
        // ANCHOR SECTION
        if (anchorRule.anchorConfig.aliases?.length) {
            const aliases = anchorRule.anchorConfig.aliases;
            const matchMode = anchorRule.anchorConfig.matchMode || 'exact';
            const instanceFrom = anchorRule.anchorConfig.instanceFrom || 'start';
            const instance = anchorRule.anchorConfig.instance || 1;
            
            let anchorDescription = '<strong>Anchor Text:</strong> search for ';
            
            // Instance description
            if (instanceFrom === 'end') {
                anchorDescription += instance === 1 ? '<code>last</code> ' : `<code>${ordinal(instance)} last</code> `;
            } else {
                anchorDescription += instance === 1 ? '<code>first</code> ' : `<code>${ordinal(instance)}</code> `;
            }
            
            // Match mode description
            switch (matchMode) {
                case 'startsWith':
                    anchorDescription += 'field <code>starting with</code> ';
                    break;
                case 'endsWith':
                    anchorDescription += 'field <code>ending with</code> ';
                    break;
                case 'contains':
                    anchorDescription += 'field <code>containing</code> ';
                    break;
                default:
                    anchorDescription += 'field <code>exactly matching</code> ';
            }
            
            // Aliases
            if (aliases.length === 1) {
                anchorDescription += `<code>${aliases[0]}</code>`;
            } else if (aliases.length === 2) {
                anchorDescription += `<code>${aliases[0]}</code> or <code>${aliases[1]}</code>`;
            } else {
                // For more than 2 aliases, show only the first one and indicate there are more
                anchorDescription += `<code>${aliases[0]}</code>`;
                const additionalCount = aliases.length - 1;
                anchorDescription += ` or <code>${additionalCount} other</code> keyword${additionalCount > 1 ? 's' : ''}`;
            }
            
            lines.push(anchorDescription);
        }

        // SEARCH ZONE SECTION
        const zone = anchorRule.anchorConfig.searchZone;
        if (zone && (zone.top !== 0 || zone.left !== 0 || zone.right !== 1 || zone.bottom !== 1)) {
            let zoneDescription = '<strong>Search Zone:</strong> search ';
            
            // Determine zone description
            const topPercent = formatPercentage(zone.top);
            const bottomPercent = formatPercentage(zone.bottom);
            const leftPercent = formatPercentage(zone.left);
            const rightPercent = formatPercentage(zone.right);
            
            // Vertical zones
            if (zone.top === 0 && zone.bottom === 0.5) {
                zoneDescription += '<code>top half</code> ';
            } else if (zone.top === 0.5 && zone.bottom === 1) {
                zoneDescription += '<code>bottom half</code> ';
            } else if (zone.top === 0 && zone.bottom < 1) {
                zoneDescription += `<code>top ${bottomPercent}%</code> `;
            } else if (zone.top > 0 && zone.bottom === 1) {
                zoneDescription += `<code>bottom ${100 - topPercent}%</code> `;
            } else if (zone.top > 0 || zone.bottom < 1) {
                zoneDescription += `<code>middle section (${topPercent}%-${bottomPercent}%)</code> `;
            } else {
                zoneDescription += '<code>entire height</code> ';
            }
            
            zoneDescription += 'of ';
            
            // Horizontal zones  
            if (zone.left === 0 && zone.right === 0.5) {
                zoneDescription += '<code>left half</code> ';
            } else if (zone.left === 0.5 && zone.right === 1) {
                zoneDescription += '<code>right half</code> ';
            } else if (zone.left === 0 && zone.right < 1) {
                zoneDescription += `<code>left ${rightPercent}%</code> `;
            } else if (zone.left > 0 && zone.right === 1) {
                zoneDescription += `<code>right ${100 - leftPercent}%</code> `;
            } else if (zone.left > 0 || zone.right < 1) {
                zoneDescription += `<code>middle section (${leftPercent}%-${rightPercent}%)</code> `;
            } else {
                zoneDescription += '<code>entire width</code> ';
            }
            
            const pageScope = anchorRule.anchorConfig.pageScope || 'first';
            if (pageScope === 'any') {
                zoneDescription += 'on <code>any</code> page';
            } else if (pageScope === 'last') {
                zoneDescription += 'on <code>last</code> page';
            } else {
                zoneDescription += 'on <code>first</code> page';
            }
            
            lines.push(zoneDescription);
        }

        // POSITION SECTION
        const position = anchorRule.positionConfig;
        if (position) {
            let positionDescription = '<strong>Position:</strong> select text from ';
            
            // Dimensions
            if (position.point.width > 0 || position.point.height > 0) {
                positionDescription += `<code>${Math.round(position.point.width)}px</code> by <code>${Math.round(position.point.height)}px</code> `;
            } else {
                positionDescription += '<code>auto-sized area</code> ';
            }
            
            // Offset
            if (position.point.top !== 0 || position.point.left !== 0) {
                const offsetParts: string[] = [];
                if (position.point.top !== 0) {
                    offsetParts.push(`<code>${Math.round(position.point.top)}px</code> ${position.point.top > 0 ? 'down' : 'up'}`);
                }
                if (position.point.left !== 0) {
                    offsetParts.push(`<code>${Math.round(position.point.left)}px</code> ${position.point.left > 0 ? 'right' : 'left'}`);
                }
                if (offsetParts.length > 0) {
                    positionDescription += ` area with ${offsetParts.join(', ')} `;
                }
            }
            
            // Starting position
            if (position.startingPosition) {
                const cornerMap = {
                    'topLeft': 'top-left',
                    'topRight': 'top-right', 
                    'bottomLeft': 'bottom-left',
                    'bottomRight': 'bottom-right'
                };
                positionDescription += ` from <code>${cornerMap[position.startingPosition]}</code> corner of anchor`;
            }
            
            lines.push(positionDescription);
        }

        // PARSER SECTION (if patterns exist)
        if (anchorRule.parserConfig.patterns?.length) {
            const pattern = anchorRule.parserConfig.patterns[0]; // Show first/highest priority pattern
            const label = (pattern as any).label as string | undefined;
            if (label) {
                lines.push(`<strong>Parser:</strong> extract <code>${label}</code>`);
            } else {
                lines.push(`<strong>Parser:</strong> extract text matching pattern <code>${pattern.regex}</code>`);
            }
        }

    } else if (rule.ruleType === 'regex_match') {
        lines.push('Regex Match: extract text matching regular expression patterns');
        lines.push('(Configuration pending)');
        
    } else if (rule.ruleType === 'absolute') {
        lines.push('Absolute Position: extract text from fixed document coordinates');
        lines.push('(Configuration pending)');
    }

    return lines;
}

/**
 * Creates a new default anchor rule for a given field
 */
export const createDefaultAnchorRule = (fieldId: string): AnchorRule => ({
    id: `${fieldId}_rule_${Date.now()}`,
    priority: 1,
    ruleType: 'anchor',
    anchorConfig: {
        aliases: [],
        searchZone: { top: 0, left: 0, right: 1, bottom: 1 },
        instance: 1,
        instanceFrom: 'start',
        matchMode: 'exact',
        ignoreCase: true,
        normalizeWhitespace: true,
        pageScope: 'first'
    },
    positionConfig: {
        point: { top: 0, left: 0, width: 0, height: 0 },
        startingPosition: 'topRight'
    },
    parserConfig: {
        patterns: [],
        fallbackToFullText: false
    }
});

/**
 * Creates a new rule based on the specified rule type
 */
export const createRuleByType = (ruleId: string, ruleType: RuleType): FieldRule => {
    if (ruleType === 'anchor') {
        return {
            id: ruleId,
            priority: 1,
            ruleType: 'anchor',
            anchorConfig: {
                aliases: [],
                searchZone: { top: 0, left: 0, right: 1, bottom: 1 },
                instance: 1,
                instanceFrom: 'start',
                matchMode: 'exact',
                ignoreCase: true,
                normalizeWhitespace: true,
                pageScope: 'first'
            },
            positionConfig: {
                point: { top: 0, left: 0, width: 0, height: 0 },
                startingPosition: 'topRight'
            },
            parserConfig: {
                patterns: [],
                fallbackToFullText: false
            }
        };
    } else if (ruleType === 'regex_match') {
        return {
            id: ruleId,
            priority: 1,
            ruleType: 'regex_match'
        };
    } else {
        return {
            id: ruleId,
            priority: 1,
            ruleType: 'absolute'
        };
    }
};

/**
 * Adds a new rule to a field's rule collection
 */
export const addRuleToField = (
    fieldRules: Record<string, FieldRule[]>,
    fieldId: string,
    newRule: FieldRule
): Record<string, FieldRule[]> => ({
    ...fieldRules,
    [fieldId]: [...(fieldRules[fieldId] || []), newRule]
});

/**
 * Deletes a rule from a field's rule collection
 */
export const deleteRuleFromField = (
    fieldRules: Record<string, FieldRule[]>,
    fieldId: string,
    ruleId: string
): Record<string, FieldRule[]> => ({
    ...fieldRules,
    [fieldId]: (fieldRules[fieldId] || []).filter(rule => rule.id !== ruleId)
});

/**
 * Changes the type of an existing rule
 */
export const changeRuleType = (
    fieldRules: Record<string, FieldRule[]>,
    fieldId: string,
    ruleId: string,
    newRuleType: RuleType
): Record<string, FieldRule[]> => {
    const updatedRules = [...(fieldRules[fieldId] || [])];
    const ruleIndex = updatedRules.findIndex(r => r.id === ruleId);
    
    if (ruleIndex === -1) return fieldRules;

    updatedRules[ruleIndex] = createRuleByType(ruleId, newRuleType);
    
    return {
        ...fieldRules,
        [fieldId]: updatedRules
    };
};

/**
 * Updates specific fields of a rule while maintaining type safety
 */
export const updateRule = (
    fieldRules: Record<string, FieldRule[]>,
    fieldId: string,
    ruleId: string,
    updates: Partial<AnchorRule | RegexMatchRule | AbsoluteRule>
): Record<string, FieldRule[]> => {
    const updatedRules = [...(fieldRules[fieldId] || [])];
    const ruleIndex = updatedRules.findIndex(r => r.id === ruleId);
    
    if (ruleIndex === -1) return fieldRules;
    
    const currentRule = updatedRules[ruleIndex];
    
    // Deep merge for nested config objects
    const mergeConfigs = (current: any, update: any) => {
        if (!update) return current;
        if (!current) return update;
        
        const merged = { ...current };
        for (const key in update) {
            if (update[key] && typeof update[key] === 'object' && !Array.isArray(update[key])) {
                merged[key] = mergeConfigs(current[key], update[key]);
            } else {
                merged[key] = update[key];
            }
        }
        return merged;
    };
    
    // Ensure we maintain type safety by merging updates based on rule type
    if (currentRule.ruleType === 'anchor') {
        const anchorUpdate = updates as Partial<AnchorRule>;
        updatedRules[ruleIndex] = {
            ...currentRule,
            ...anchorUpdate,
            anchorConfig: anchorUpdate.anchorConfig 
                ? mergeConfigs(currentRule.anchorConfig, anchorUpdate.anchorConfig)
                : currentRule.anchorConfig,
            positionConfig: anchorUpdate.positionConfig
                ? mergeConfigs(currentRule.positionConfig, anchorUpdate.positionConfig)
                : currentRule.positionConfig,
            parserConfig: anchorUpdate.parserConfig
                ? mergeConfigs(currentRule.parserConfig, anchorUpdate.parserConfig)
                : currentRule.parserConfig
        } as AnchorRule;
    } else if (currentRule.ruleType === 'regex_match') {
        updatedRules[ruleIndex] = {
            ...currentRule,
            ...updates as Partial<RegexMatchRule>
        } as RegexMatchRule;
    } else if (currentRule.ruleType === 'absolute') {
        updatedRules[ruleIndex] = {
            ...currentRule,
            ...updates as Partial<AbsoluteRule>
        } as AbsoluteRule;
    }
    
    return {
        ...fieldRules,
        [fieldId]: updatedRules
    };
};

/**
 * Adds an anchor alias to a rule
 */
export const addAnchorToRule = (
    fieldRules: Record<string, FieldRule[]>,
    ruleId: string,
    anchorText: string
): Record<string, FieldRule[]> => {
    const newRules = { ...fieldRules };
    
    for (const fieldId in newRules) {
        newRules[fieldId] = newRules[fieldId].map(rule => {
            if (rule.id === ruleId && rule.ruleType === 'anchor') {
                return {
                    ...rule,
                    anchorConfig: {
                        ...rule.anchorConfig,
                        aliases: [...(rule.anchorConfig.aliases || []), anchorText]
                    }
                };
            }
            return rule;
        });
    }
    
    return newRules;
};

/**
 * Deletes an anchor alias from a rule by index
 */
export const deleteAnchorFromRule = (
    fieldRules: Record<string, FieldRule[]>,
    ruleId: string,
    index: number
): Record<string, FieldRule[]> => {
    const newRules = { ...fieldRules };
    
    for (const fieldId in newRules) {
        newRules[fieldId] = newRules[fieldId].map(rule => {
            if (rule.id === ruleId && rule.ruleType === 'anchor') {
                return {
                    ...rule,
                    anchorConfig: {
                        ...rule.anchorConfig,
                        aliases: (rule.anchorConfig.aliases || []).filter((_, i) => i !== index)
                    }
                };
            }
            return rule;
        });
    }
    
    return newRules;
};

/**
 * Updates an anchor alias at a specific index
 */
export const updateAnchorInRule = (
    fieldRules: Record<string, FieldRule[]>,
    ruleId: string,
    index: number,
    anchorText: string
): Record<string, FieldRule[]> => {
    const newRules = { ...fieldRules };
    
    for (const fieldId in newRules) {
        newRules[fieldId] = newRules[fieldId].map(rule => {
            if (rule.id === ruleId && rule.ruleType === 'anchor') {
                const newAliases = [...(rule.anchorConfig.aliases || [])];
                newAliases[index] = anchorText;
                return {
                    ...rule,
                    anchorConfig: {
                        ...rule.anchorConfig,
                        aliases: newAliases
                    }
                };
            }
            return rule;
        });
    }
    
    return newRules;
};

/**
 * Adds a regex pattern to a rule's parser config
 */
export const addPatternToRule = (
    fieldRules: Record<string, FieldRule[]>,
    ruleId: string,
    patternText: string
): Record<string, FieldRule[]> => {
    const newRules = { ...fieldRules };
    
    for (const fieldId in newRules) {
        newRules[fieldId] = newRules[fieldId].map(rule => {
            if (rule.id === ruleId && rule.ruleType === 'anchor') {
                const currentPatterns = rule.parserConfig.patterns || [];
                const nextPriority = currentPatterns.length;
                
                return {
                    ...rule,
                    parserConfig: {
                        ...rule.parserConfig,
                        patterns: [...currentPatterns, { regex: patternText, priority: nextPriority }]
                    }
                };
            }
            return rule;
        });
    }
    
    return newRules;
};

/**
 * Deletes a regex pattern from a rule by index
 */
export const deletePatternFromRule = (
    fieldRules: Record<string, FieldRule[]>,
    ruleId: string,
    index: number
): Record<string, FieldRule[]> => {
    const newRules = { ...fieldRules };
    
    for (const fieldId in newRules) {
        newRules[fieldId] = newRules[fieldId].map(rule => {
            if (rule.id === ruleId && rule.ruleType === 'anchor') {
                const patterns = rule.parserConfig.patterns || [];
                return {
                    ...rule,
                    parserConfig: {
                        ...rule.parserConfig,
                        patterns: patterns.filter((_, i) => i !== index)
                    }
                };
            }
            return rule;
        });
    }
    
    return newRules;
};

/**
 * Reorders rules within a field by moving a rule from one index to another
 */
export const reorderRules = (
    fieldRules: Record<string, FieldRule[]>,
    fieldId: string,
    fromIndex: number,
    toIndex: number
): Record<string, FieldRule[]> => {
    const rules = [...(fieldRules[fieldId] || [])];
    const [draggedRule] = rules.splice(fromIndex, 1);
    rules.splice(toIndex, 0, draggedRule);
    
    return {
        ...fieldRules,
        [fieldId]: rules
    };
};

/**
 * Reorders regex patterns within a rule's parser config
 */
export const reorderPatterns = (
    fieldRules: Record<string, FieldRule[]>,
    ruleId: string,
    fromIndex: number,
    toIndex: number
): Record<string, FieldRule[]> => {
    const newRules = { ...fieldRules };
    
    for (const fieldId in newRules) {
        newRules[fieldId] = newRules[fieldId].map(rule => {
            if (rule.id === ruleId && rule.ruleType === 'anchor') {
                const patterns = [...(rule.parserConfig.patterns || [])];
                const [draggedPattern] = patterns.splice(fromIndex, 1);
                patterns.splice(toIndex, 0, draggedPattern);
                
                // Update priorities to match new order
                const updatedPatterns = patterns.map((pattern, idx) => ({
                    ...pattern,
                    priority: idx + 1
                }));
                
                return {
                    ...rule,
                    parserConfig: {
                        ...rule.parserConfig,
                        patterns: updatedPatterns
                    }
                };
            }
            return rule;
        });
    }
    
    return newRules;
};

/**
 * Finds a rule by ID across all fields
 */
export const findRuleById = (
    fieldRules: Record<string, FieldRule[]>,
    ruleId: string
): FieldRule | undefined => {
    return Object.values(fieldRules)
        .flat()
        .find(r => r.id === ruleId);
};