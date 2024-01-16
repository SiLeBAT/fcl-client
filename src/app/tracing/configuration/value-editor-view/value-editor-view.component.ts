import {
    Component, Input, ViewEncapsulation, Output,
    EventEmitter, ChangeDetectionStrategy, OnDestroy,
    ElementRef, ViewChild
} from '@angular/core';
import { MatAutocompleteSelectedEvent, MatAutocompleteTrigger } from '@angular/material/autocomplete';

type ValueType = string | number | boolean;

function valueToStr(value: ValueType): string {
    return typeof value === 'string' ? value : value.toString();
}

interface InputData {
    availableValues: ValueType[];
    value: ValueType;
}

const OVERFLOW_VALUE_AUTO = 'auto';
const OVERFLOW_VALUE_SCROLL = 'scroll';
const SCROLLABLE_OVERFLOW_VALUES = [OVERFLOW_VALUE_AUTO, OVERFLOW_VALUE_SCROLL];

const EVENT_WHEEL = 'wheel';
const EVENT_SCROLL = 'scroll';
const BLOCKED_EVENTS = [EVENT_WHEEL];
const CLOSING_EVENTS = [EVENT_SCROLL];

interface ElementListeners {
    element: HTMLElement;
    listeners: {
        type: string;
        callback: (e: any) => void;
    }[];
}

@Component({
    selector: 'fcl-value-editor-view',
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './value-editor-view.component.html',
    encapsulation: ViewEncapsulation.None
})
export class ValueEditorViewComponent implements OnDestroy {

    private static readonly MAX_AUTOCOMPLETE_PROPOSALS = 20;
    private scrollableElementListeners: ElementListeners[] = [];
    private onBlockedEventBinding = this.onBlockedEvent.bind(this);
    private onClosingEventBinding = this.onClosingEvent.bind(this);

    @Input() disabled = false;
    @Input() placeholder = 'value';
    @Input() value: string | number | boolean = '';
    @Input() set availableValues(values: ValueType[] | undefined) {
        this.availableValues_ = values || [];
    }

    get availableValues(): ValueType[] {
        return this.availableValues_;
    }

    @Output() valueChange = new EventEmitter<ValueType>();

    @ViewChild(MatAutocompleteTrigger) autocomplete: MatAutocompleteTrigger;

    private availableValues_: ValueType[] = [];
    private autocompleteValues_: string[] = [];
    private availableStrValues_: string[] = [];
    private processedInput: InputData;

    get autoCompleteValues(): string[] {
        this.processInputIfNecessary();
        return this.autocompleteValues_;
    }
    constructor(
        private hostElement: ElementRef
    ) {
    }

    ngOnDestroy(): void {
        if (this.scrollableElementListeners.length > 0) {
            this.removeElementListeners();
        }
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

    onAutocompleteOpened(): void {
        this.addContainerListeners();
    }

    onAutocompleteClosed(): void {
        this.removeElementListeners();
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

    private onBlockedEvent(e: Event): boolean {
        e.preventDefault();
        e.stopPropagation();

        return false;
    }

    private onClosingEvent(e: Event): void {
        if (this.autocomplete.panelOpen) {
            this.autocomplete.closePanel();
        }
    }

    private isElementScrollable(element: HTMLElement): boolean {
        const style = getComputedStyle(element);
        return SCROLLABLE_OVERFLOW_VALUES.includes(style.overflowY);
    }

    private addElementListeners(element: HTMLElement): void {
        if (element.nodeName !== 'BODY' && element.nodeName !== 'HTML') {

            if (this.isElementScrollable(element)) {
                const elementListeners: ElementListeners = {
                    element: element,
                    listeners: []
                };
                BLOCKED_EVENTS.forEach(e => {
                    element.addEventListener(e, this.onBlockedEventBinding, {passive: false});
                    elementListeners.listeners.push({
                        type: e,
                        callback: this.onBlockedEventBinding
                    });

                });
                CLOSING_EVENTS.forEach(e => {
                    element.addEventListener(e, this.onClosingEventBinding);
                    elementListeners.listeners.push({
                        type: e,
                        callback: this.onClosingEventBinding
                    });
                });
                this.scrollableElementListeners.push(elementListeners);
            }
            const parentElement = element.parentElement;
            if (parentElement && element !== parentElement) {
                this.addElementListeners(parentElement);
            }
        }
    }

    private addContainerListeners(): void {
        this.scrollableElementListeners = [];
        this.addElementListeners(this.hostElement.nativeElement.parentElement);
    }

    private removeElementListeners(): void {
        this.scrollableElementListeners.forEach(
            eL => eL.listeners.forEach(
                l => eL.element.removeEventListener(l.type, l.callback)
            )
        );
        this.scrollableElementListeners = [];
    }

}
