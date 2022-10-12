import { Component, Input, ViewEncapsulation, Output, EventEmitter, ChangeDetectionStrategy, OnChanges, SimpleChanges } from '@angular/core';

interface Property {
    id: string;
    name: string;
}

@Component({
    selector: 'fcl-property-selector-view',
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './property-selector-view.component.html',
    encapsulation: ViewEncapsulation.None
})
export class PropertySelectorViewComponent implements OnChanges {

    @Input() label: string | null = null;
    @Input() disabled = false;
    @Input() value: string | null = null;
    @Input() favouriteProperties: Property[];
    @Input() otherProperties: Property[];

    @Output() valueChange = new EventEmitter<string>();

    isPropNotListed = false;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.value !== undefined) {
            this.isPropNotListed = this.value !== null &&
                ![this.favouriteProperties, this.otherProperties].some(pA => pA.some(p => p.id === this.value));
        }
    }

    onValueChange(value: string): void {
        this.valueChange.emit(value);
    }
}
