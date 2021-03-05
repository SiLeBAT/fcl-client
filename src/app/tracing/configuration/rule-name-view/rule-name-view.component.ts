import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'fcl-rule-name-view',
    templateUrl: './rule-name-view.component.html',

    encapsulation: ViewEncapsulation.None
})
export class RuleNameViewComponent {
    @Input() ruleName: string = '';
    @Output() ruleNameChange = new EventEmitter<string>();

    constructor() { }

    onRuleNameChange(ruleName: string): void {
        this.ruleName = ruleName;
        this.ruleNameChange.emit(ruleName);
    }
}
