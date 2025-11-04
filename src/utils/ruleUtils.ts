import { AnchorRule, RegexMatchRule, AbsoluteRule, RuleType } from '../types/extractionRules';

type FieldRule = AnchorRule | RegexMatchRule | AbsoluteRule;

export function generatePseudoRule(rule: FieldRule): string[] {
    const lines: string[] = [];
    
    // Add rule ID and type
    lines.push(`ID: ${rule.id}`);
    lines.push(`Type: ${rule.ruleType}`);

    // Add anchor-specific details
    if (rule.ruleType === 'anchor') {
        if (rule.anchorConfig.aliases?.length) {
            lines.push(`Anchors: ${rule.anchorConfig.aliases.join(', ')}`);
        }
        if (rule.anchorConfig.matchMode) {
            lines.push(`Match Mode: ${rule.anchorConfig.matchMode}`);
        }
        if (rule.anchorConfig.ignoreCase !== undefined) {
            lines.push(`Ignore Case: ${rule.anchorConfig.ignoreCase}`);
        }
        if (rule.anchorConfig.normalizeWhitespace !== undefined) {
            lines.push(`Normalize Whitespace: ${rule.anchorConfig.normalizeWhitespace}`);
        }
        if (rule.positionConfig.direction) {
            lines.push(`Direction: ${rule.positionConfig.direction}`);
        }
    }

    // Add search zone if defined
    if (rule.ruleType === 'anchor' || rule.ruleType === 'regex_match') {
        const zone = rule.ruleType === 'anchor' ? rule.anchorConfig.searchZone : undefined;
        if (zone) {
            lines.push('Search Zone:');
            if (zone.top) lines.push(`  Top: ${zone.top}`);
            if (zone.left) lines.push(`  Left: ${zone.left}`);
            if (zone.right) lines.push(`  Right: ${zone.right}`);
            if (zone.bottom) lines.push(`  Bottom: ${zone.bottom}`);
        }
    }

    // Add parser patterns if they exist
    if (rule.ruleType === 'anchor' && rule.parserConfig.patterns?.length) {
        lines.push('Regex Patterns:');
        rule.parserConfig.patterns.forEach(pattern => {
            lines.push(`  ${pattern.regex} (priority: ${pattern.priority})`);
        });
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
        matchMode: 'exact',
        ignoreCase: true,
        normalizeWhitespace: true
    },
    positionConfig: {
        type: 'relative',
        boundingBox: { top: 0, left: 0, right: 0, bottom: 0 },
        direction: 'right'
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
                matchMode: 'exact',
                ignoreCase: true,
                normalizeWhitespace: true
            },
            positionConfig: {
                type: 'relative',
                boundingBox: { top: 0, left: 0, right: 0, bottom: 0 },
                direction: 'right'
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