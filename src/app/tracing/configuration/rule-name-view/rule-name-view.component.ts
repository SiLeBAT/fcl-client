import { Component, EventEmitter, Output, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'fcl-rule-name-view',
    templateUrl: './rule-name-view.component.html',

    encapsulation: ViewEncapsulation.None
})
export class RuleNameViewComponent {
    @Output() ruleNameChange = new EventEmitter<string>();

    ruleName: string = '';

    constructor() { }

    onRuleNameChange(ruleName: string): void {
        this.ruleName = ruleName;
        this.ruleNameChange.emit(ruleName);
    }
}
