import { HighlightingRule } from "../data.model";

const LETTER_ALPHABET_LENGTH = 26;
const LETTER_ALPHABET_START_CODE = 65;

export function isLabelHRule(hRule: HighlightingRule): boolean {
    return !!hRule.labelProperty || !!hRule.labelParts;
}

export function isAnonymizationRule(hRule: HighlightingRule): boolean {
    return !!hRule.labelParts;
}

function hasRuleLogicalConditions(rule: HighlightingRule): boolean {
    return (
        !!rule.logicalConditions &&
        (rule.logicalConditions.length > 1 ||
            (rule.logicalConditions.length === 1 &&
                rule.logicalConditions[0].length > 0))
    );
}

export function isSupportedRule(rule: HighlightingRule): boolean {
    return !rule.adjustThickness || !hasRuleLogicalConditions(rule);
}

export function isEditableRule(rule: HighlightingRule): boolean {
    return isSupportedRule(rule);
}

export function convertIndexToLetterCode(oneBasedIndex: number): string {
    let remainingIndex = oneBasedIndex;
    const codes = [(remainingIndex - 1) % LETTER_ALPHABET_LENGTH];
    remainingIndex = (remainingIndex - codes[0] - 1) / LETTER_ALPHABET_LENGTH;
    while (remainingIndex > 0) {
        codes.push((remainingIndex - 1) % LETTER_ALPHABET_LENGTH);
        remainingIndex =
            (remainingIndex - codes[codes.length - 1] - 1) /
            LETTER_ALPHABET_LENGTH;
    }
    return String.fromCharCode(
        ...codes.map((code) => code + LETTER_ALPHABET_START_CODE).reverse(),
    );
}
