import { Component, Input, ViewEncapsulation, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';

type ValueType = string | number | boolean;

function valueToStr(value: ValueType): string {
    return typeof value === 'string' ? value : value.toString();
}

interface InputData {
    availableValues: ValueType[];
    value: ValueType;
}

@Component({
    selector: 'fcl-value-editor-view',
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './value-editor-view.component.html',
    encapsulation: ViewEncapsulation.None
})
export class ValueEditorViewComponent {

    private static readonly MAX_AUTOCOMPLETE_PROPOSALS = 20;

    @Input() disabled = false;
    @Input() value: string | number | boolean;
    @Input() availableValues: ValueType[];

    @Output() valueChange = new EventEmitter<ValueType>();

    private autocompleteValues_: string[] = [];
    private availableStrValues_: string[] = [];
    private processedInput: InputData;

    get autoCompleteValues(): string[] {
        this.processInputIfNecessary();
        return this.autocompleteValues_;
    }

    private processInputIfNecessary(): void {
        if (!this.processedInput || this.processedInput.availableValues !== this.availableValues) {
            this.availableStrValues_ = this.availableValues.map(valueToStr);
            this.updateAutoCompleteValues();
        } else if (this.processedInput.value !== this.value) {
            this.updateAutoCompleteValues();
        }
        this.processedInput = {
            availableValues: this.availableValues,
            value: this.value
        };
    }

    private updateAutoCompleteValues(): void {
        const value = valueToStr(this.value).toLowerCase();
        this.autocompleteValues_ = this.availableStrValues_
            .filter(s => s.toLowerCase().includes(value))
            .slice(0, ValueEditorViewComponent.MAX_AUTOCOMPLETE_PROPOSALS);
    }

    onInput(event: any): void {
        const value: string = event.target.value;
        this.value = value;
        this.valueChange.emit(value);
    }

    onOptionSelected(event: MatAutocompleteSelectedEvent): void {
        const selectedValue = event.option.value;
        this.valueChange.emit(selectedValue);
    }
}
