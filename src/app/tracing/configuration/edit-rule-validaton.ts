import { ComplexFilterCondition } from './configuration.model';
import { ColorAndShapeEditRule, EditRule, InvEditRule, LabelEditRule, RuleType } from './model';

function isConditionComplete(condition: ComplexFilterCondition): boolean {
    return (
        condition.propertyName !== null &&
        condition.operationType !== null &&
        condition.value.length > 0
    );
}

function isConditionEmpty(condition: ComplexFilterCondition): boolean {
    return (
        condition.propertyName === null &&
        condition.value.length === 0
    );
}

function getCompleteConditionsCount(conditions: ComplexFilterCondition[]): number {
    return conditions.filter(c => isConditionComplete(c)).length;
}

function getNonEmptyConditionCount(conditions: ComplexFilterCondition[]): number {
    return conditions.filter(c => !isConditionEmpty(c)).length;
}

function isGenericEditRuleValid(editRule: EditRule): boolean {
    return (
        editRule.name.length > 0 &&
        getCompleteConditionsCount(editRule.complexFilterConditions) === getNonEmptyConditionCount(editRule.complexFilterConditions)
    );
}

function isColorAndShapeEditRuleValid(editRule: ColorAndShapeEditRule): boolean {
    return (
        isGenericEditRuleValid(editRule) &&
        (editRule.color !== null || editRule.shape !== null) &&
        getCompleteConditionsCount(editRule.complexFilterConditions) >= 1
    );
}

function isLabelEditRuleValid(editRule: LabelEditRule): boolean {
    return (
        isGenericEditRuleValid(editRule) &&
        editRule.labelProperty !== null
    );
}

function isInvEditRuleValid(editRule: InvEditRule): boolean {
    return isGenericEditRuleValid(editRule);
}

export function isEditRuleValid(editRule: EditRule): boolean {
    switch (editRule.type) {
        case RuleType.COLOR_AND_SHAPE:
            return isColorAndShapeEditRuleValid(editRule as ColorAndShapeEditRule);
        case RuleType.LABEL:
            return isLabelEditRuleValid(editRule as LabelEditRule);
        case RuleType.INVISIBILITY:
            return isInvEditRuleValid(editRule as InvEditRule);
        default:
            return false;
    }
}

export function validateEditRule<T extends EditRule>(editRule: T): T {
    editRule.isValid = isEditRuleValid(editRule);
    return editRule;
}
