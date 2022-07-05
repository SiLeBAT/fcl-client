import { Component, Input, ViewEncapsulation, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';

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
export class PropertySelectorViewComponent {

    @Input() label: string | null = null;
    @Input() disabled = false;
    @Input() value: string;
    @Input() availableProperties: Property[];
    @Input() favoriteColumnsLength: number;

    get favoriteProperties(): Property[] {
        return this.availableProperties.slice(0, this.favoriteColumnsLength);
    }

    get additionalProperties(): Property[] {
        return this.availableProperties.slice(this.favoriteColumnsLength);
    }

    @Output() valueChange = new EventEmitter<string>();

    onValueChange(value: string): void {
        this.valueChange.emit(value);
    }
}
