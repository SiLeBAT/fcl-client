import { HighlightingRule } from "../data.model";
import { getUpdatedArray } from "./non-ui-utils";

const LETTER_ALPHABET_LENGTH = 26;
const LETTER_ALPHABET_START_CODE = 65;

type AdujstThicknessRule = HighlightingRule & {
    [key in keyof Pick<HighlightingRule, "adjustThickness">]: true;
};

export function isLabelHRule(hRule: HighlightingRule): boolean {
    return !!hRule.labelProperty || !!hRule.labelParts;
}

export function isAnonymizationRule(hRule: HighlightingRule): boolean {
    return !!hRule.labelParts;
}

function isAdjustThicknessRule(
    rule: HighlightingRule | AdujstThicknessRule,
): rule is AdujstThicknessRule {
    return rule.adjustThickness === true;
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

function getToAutoDisableThicknessRules<T extends HighlightingRule>(
    rules: T[],
): T[] {
    const thicknessRules = rules.filter(isAdjustThicknessRule);
    const thicknessRulesWithLogConditions = thicknessRules.filter(
        hasRuleLogicalConditions,
    );
    return thicknessRulesWithLogConditions;
}

function getToAutoDisableLabelRules<T extends HighlightingRule>(
    rules: T[],
): T[] {
    const activeAnoRule = rules.find(
        (r) => isAnonymizationRule(r) && !r.userDisabled,
    );

    const autoDisableRules = activeAnoRule
        ? rules.filter((r) => r !== activeAnoRule && isLabelHRule(r))
        : [];
    return autoDisableRules;
}

function getToAutoDisableRules<T extends HighlightingRule>(rules: T[]): T[] {
    const rules2AutoDisable = [
        ...getToAutoDisableThicknessRules(rules),
        ...getToAutoDisableLabelRules(rules),
    ];
    return rules2AutoDisable;
}

function updateAutoDisabledFlag<T extends HighlightingRule>(rules: T[]): T[] {
    const autoDisableRules = new Set(getToAutoDisableRules(rules));

    const newRules = getUpdatedArray(
        rules,
        (r) => autoDisableRules.has(r) !== r.autoDisabled,
        (r) => ({ autoDisabled: autoDisableRules.has(r) }) as Partial<T>,
    );
    return newRules;
}

export function isEnabledAdjustThicknessRule(rule: HighlightingRule): boolean {
    return (
        isAdjustThicknessRule(rule) && !rule.userDisabled && !rule.autoDisabled
    );
}

export function updateDisabledFlags<T extends HighlightingRule>(
    rules: T[],
): T[] {
    const newRules = updateUserDisabledFlag(updateAutoDisabledFlag(rules));

    return newRules;
}

function updateUserDisabledFlag<T extends HighlightingRule>(rules: T[]): T[] {
    const enabledThicknessRules = rules.filter(isEnabledAdjustThicknessRule);
    if (enabledThicknessRules.length > 1) {
        const toDisableRules = new Set(enabledThicknessRules.slice(1));
        return getUpdatedArray(rules, (r) => toDisableRules.has(r), {
            userDisabled: true,
        } as Partial<T>);
    }
    return rules;
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
