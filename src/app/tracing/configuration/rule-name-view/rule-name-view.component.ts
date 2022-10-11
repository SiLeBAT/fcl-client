import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'fcl-rule-name-view',
    templateUrl: './rule-name-view.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RuleNameViewComponent {

    @Input() ruleName: string = '';
    @Output() ruleNameChange = new EventEmitter<string>();

    onRuleNameChange(ruleName: string): void {
        this.ruleName = ruleName;
        this.ruleNameChange.emit(ruleName);
    }
}
