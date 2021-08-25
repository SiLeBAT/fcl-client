import { HighlightingRule, StationHighlightingRule } from '../data.model';
import { Utils } from '../util/non-ui-utils';
import { ColorAndShapeEditRule, EditRule, InvEditRule, LabelEditRule, RuleType, StationEditRule } from './model';
import { ComplexFilterUtils } from './shared/complex-filter-utils';

function convertEditRuleToHRule(editRule: EditRule): HighlightingRule {
    return {
        id: editRule.id,
        name: editRule.name,
        disabled: editRule.disabled,
        logicalConditions: ComplexFilterUtils.complexFilterConditionsToLogicalConditions(editRule.complexFilterConditions),
        labelProperty: null,
        showInLegend: false,
        color: null,
        adjustThickness: false,
        valueCondition: null,
        invisible: false
    };
}

function convertLabelEditRuleToHRule(editRule: LabelEditRule): HighlightingRule {
    return {
        ...convertEditRuleToHRule(editRule),
        showInLegend: editRule.showInLegend,
        labelProperty: editRule.labelProperty
    };
}

function convertHRuleToStatHRule(rule: HighlightingRule): StationHighlightingRule {
    return {
        ...rule,
        shape: null
    };
}

function convertLabelEditRuleToStatHRule(editRule: LabelEditRule): StationHighlightingRule {
    return convertHRuleToStatHRule(convertLabelEditRuleToHRule(editRule));
}

function convertInvEditRuleToHRule(editRule: InvEditRule): HighlightingRule {
    return {
        ...convertEditRuleToHRule(editRule),
        invisible: true
    };
}

function convertInvEditRuleToStatHRule(editRule: InvEditRule): StationHighlightingRule {
    return convertHRuleToStatHRule(convertInvEditRuleToHRule(editRule));
}

function convertCSEditRuleToStatHRule(editRule: ColorAndShapeEditRule): StationHighlightingRule {
    return {
        ...convertEditRuleToHRule(editRule),
        color: Utils.colorToRGBArray(editRule.color),
        shape: editRule.shape,
        showInLegend: editRule.showInLegend
    };
}

export function convertStatEditRuleToStatHRule(editRule: StationEditRule): StationHighlightingRule {
    switch (editRule.type) {
        case RuleType.COLOR_AND_SHAPE:
            return convertCSEditRuleToStatHRule(editRule as ColorAndShapeEditRule);
        case RuleType.LABEL:
            return convertLabelEditRuleToStatHRule(editRule as LabelEditRule);
        case RuleType.INVISIBILITY:
            return convertInvEditRuleToStatHRule(editRule as InvEditRule);
        default:
            throw new Error('Rule not convertable.');
    }
}

function convertHRuleToEditRule(rule: HighlightingRule, ruleType: RuleType): EditRule {
    return {
        id: rule.id,
        name: rule.name,
        disabled: rule.disabled,
        complexFilterConditions: ComplexFilterUtils.logicalConditionsToComplexFilterConditions(rule.logicalConditions),
        type: ruleType,
        isValid: true
    };
}

export function convertStatHRuleToCSEditRule(rule: StationHighlightingRule): ColorAndShapeEditRule {
    return {
        ...convertHRuleToEditRule(rule, RuleType.COLOR_AND_SHAPE),
        color: rule.color === null ? null : Utils.rgbArrayToColor(rule.color),
        shape: rule.shape,
        showInLegend: rule.showInLegend
    };
}

export function convertHRuleToLabelEditRule(rule: HighlightingRule): LabelEditRule {
    return {
        ...convertHRuleToEditRule(rule, RuleType.LABEL),
        labelProperty: rule.labelProperty,
        showInLegend: rule.showInLegend
    };
}

function convertHRuleToInvEditRule(rule: HighlightingRule): InvEditRule {
    return this.convertHRuleToEditRule(rule);
}

export function convertStatHRuleToEditRule(rule: StationHighlightingRule): StationEditRule {
    if (rule.color || rule.shape) {
        return convertStatHRuleToCSEditRule(rule);
    } else if (rule.labelProperty) {
        return convertHRuleToLabelEditRule(rule);
    } else if (rule.invisible) {
        return convertHRuleToInvEditRule(rule);
    } else {
        throw new Error('Station Highlighting Rule cannot be converted to EditRule.');
    }
}
