import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
    selector: 'fcl-add-highlighting-condition-button-view',
    templateUrl: './add-highlighting-condition-button-view.component.html',
    styleUrls: ['./add-highlighting-condition-button-view.component.scss']
})
export class AddHighlightingConditionButtonViewComponent implements OnInit {
    @Input() buttonDisabled: boolean = false;
    @Output() addHighlighting = new EventEmitter();

    constructor() { }

    ngOnInit() {
    }

    addHighlightingRule() {
        this.addHighlighting.emit();
    }

}
