import { COLOR_BFR_BLUE } from './constants';
import { ColorAndShapeEditRule, ColorEditRule, EditRule, InvEditRule, LabelEditRule, RuleType } from './model';

export class EditRuleCreator {
    private static readonly DEFAULT_COLOR = COLOR_BFR_BLUE;
    private static ID_COUNTER = 0;
    private static ID_PREFIX = 'R';

    private static createEditRule(ruleType: RuleType): EditRule {
        return {
            id: this.ID_PREFIX + this.ID_COUNTER++,
            name: '',
            disabled: false,
            complexFilterConditions: [],
            type: ruleType,
            isValid: false
        };
    }

    static createColorAndShapeEditRule(): ColorAndShapeEditRule {
        return {
            ...this.createEditRule(RuleType.COLOR_AND_SHAPE),
            showInLegend: true,
            color:  this.DEFAULT_COLOR,
            shape: null
        };
    }

    static createColorEditRule(): ColorEditRule {
        return {
            ...this.createEditRule(RuleType.COLOR),
            showInLegend: true,
            color:  this.DEFAULT_COLOR
        };
    }

    static createLabelEditRule(): LabelEditRule {
        return {
            ...this.createEditRule(RuleType.LABEL),
            labelProperty: null,
            showInLegend: false
        };
    }

    static createInvEditRule(): InvEditRule {
        return this.createEditRule(RuleType.INVISIBILITY);
    }

    static createNewEditRule(ruleType: RuleType): EditRule {
        switch (ruleType) {
            case RuleType.COLOR_AND_SHAPE:
                return this.createColorAndShapeEditRule();
            case RuleType.COLOR:
                return this.createColorEditRule();
            case RuleType.LABEL:
                return this.createLabelEditRule();
            case RuleType.INVISIBILITY:
                return this.createInvEditRule();
            default:
                throw new Error('RuleType is not supported.');
        }
    }
}
