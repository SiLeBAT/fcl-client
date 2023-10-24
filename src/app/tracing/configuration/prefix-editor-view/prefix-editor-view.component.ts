import {
    Component, Input, ViewEncapsulation, Output,
    EventEmitter, ChangeDetectionStrategy,
    ViewChild, ElementRef, AfterViewChecked
} from '@angular/core';

const MASK_CHARACTER = '∙';
const INPUT_TYPE_INSERT_TEXT = 'insertText';
const INPUT_TYPE_INSERT_FROM_DROP = 'insertFromDrop';
const INPUT_TYPE_DELETE_BY_DRAG = 'deleteByDrag';
const INPUT_TYPE_DELETE_PREFIX = 'delete';
const FORMAT_TYPE_TEXT_PLAIN = 'text/plain';

@Component({
    selector: 'fcl-prefix-editor-view',
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './prefix-editor-view.component.html',
    encapsulation: ViewEncapsulation.None
})
export class PrefixEditorViewComponent implements AfterViewChecked {

    @Input() disabled = false;
    @Input() placeholder = 'no prefix';
    @Input() set value(value: string) {
        if (value !== this._value) {
            this._value = value;
            this._displayValue = this.maskText(value);
            this.pendingSelectionRange = null;
        }
    }

    @Output() valueChange = new EventEmitter<string>();

    @ViewChild('inputElement') inputElementRef: ElementRef<HTMLInputElement>;

    get displayValue(): string {
        return this._displayValue;
    }

    private _value: string = '';
    private _displayValue: string = '';
    private pendingSelectionRange: { start: number; end: number } | null = null;


    private get inputElement(): HTMLInputElement {
        return this.inputElementRef.nativeElement;
    }

    private get rawSelection(): string {
        return this._value.slice(this.selStart, this.selEnd);
    }

    private get displayedSelection(): string {
        return this.inputElement.value.slice(this.selStart, this.selEnd);
    }

    private get selStart(): number {
        return this.inputElement.selectionStart;
    }

    private get selEnd(): number {
        return this.inputElement.selectionEnd;
    }

    //#region ngCycle methods

    ngAfterViewChecked(): void {
        if (this.pendingSelectionRange) {
            if (document.activeElement === this.inputElement) {
                this.inputElement.setSelectionRange(
                    this.pendingSelectionRange.start,
                    this.pendingSelectionRange.end,
                    'none'
                );
            }
            this.pendingSelectionRange = null;
        }
    }

    //#endregion ngCycle methods

    //#region template methods

    onInput(event: InputEvent): void {
        if (event.inputType === INPUT_TYPE_INSERT_FROM_DROP) {
            this.processInsertDropEvent();
        } else if (event.inputType === INPUT_TYPE_INSERT_TEXT) {
            this.processInsertCharacterEvent(event.data);
        } else if (event.inputType.startsWith(INPUT_TYPE_DELETE_PREFIX)) {
            this.processDeleteEvent(event.inputType !== INPUT_TYPE_DELETE_BY_DRAG);
        }
        // paste inputs are handled on paste event (because paste length and sel length is not known only there)
    }

    onPaste(event: ClipboardEvent): boolean | void {
        const clipboardText = event.clipboardData.getData(FORMAT_TYPE_TEXT_PLAIN);

        if (clipboardText.length > 0) {
            const rawParts = this.getRawTextParts();
            const newValue = `${rawParts.start}${clipboardText}${rawParts.end}`;

            if (newValue !== this._value) {
                event.preventDefault();
                const newCursorIndex = this.selStart + clipboardText.length;
                this.pendingSelectionRange = {
                    start: newCursorIndex,
                    end: newCursorIndex
                };
                this.setNewValue(newValue);
                return false;
            }
        }
    }

    onCopy(event: ClipboardEvent): void {
        const clipboardText = this.displayedSelection;
        const selectedRawText = this.rawSelection;

        if (selectedRawText !== clipboardText) {
            event.preventDefault();
            event.clipboardData.setData(FORMAT_TYPE_TEXT_PLAIN, selectedRawText);
        }
    }

    onDragStart(event: DragEvent): void {
        const dragDisplayText = event.dataTransfer.getData(FORMAT_TYPE_TEXT_PLAIN);
        const dragRawText = this.rawSelection;

        if (dragDisplayText !== dragRawText) {
            event.dataTransfer.setData(FORMAT_TYPE_TEXT_PLAIN, dragRawText);
        }
    }

    //#endregion template methods

    private processInsertDropEvent(): void {
        const beforeSel = this._value.slice(0, this.selStart);
        const afterSel = this._value.slice(this.selStart);
        const rawDropText = this.displayedSelection;
        const newValue = `${beforeSel}${rawDropText}${afterSel}`;
        this.pendingSelectionRange = {
            start: this.selStart,
            end: this.selEnd
        };
        this.setNewValue(newValue);
    }

    private processDeleteEvent(restoreSelection: boolean): void {
        const rawParts = this.getRawTextParts();
        const newValue = `${rawParts.start}${rawParts.end}`;
        if (restoreSelection) {
            const newCursorPos = this.selStart;
            this.pendingSelectionRange = {
                start: newCursorPos,
                end: newCursorPos
            };
        }
        this.setNewValue(newValue);
    }

    private processInsertCharacterEvent(character: string): void {
        const rawParts = this.getRawTextParts(this.selStart - 1);
        const newValue = `${rawParts.start}${character}${rawParts.end}`;

        this.pendingSelectionRange = {
            start: this.selStart,
            end: this.selStart
        };
        this.setNewValue(newValue);
    }

    private setNewValue(newValue: string): void {
        this._value = newValue;
        this._displayValue = this.maskText(newValue);
        this.valueChange.emit(newValue);
    }

    private maskText(text: string): string {
        return text.replace(/\s/g, MASK_CHARACTER);
    }

    private getRawTextParts(startLength?: number, endLength?: number): { start: string; end: string } {
        startLength = startLength !== undefined ? startLength : this.selStart;
        endLength = endLength !== undefined ? endLength : (this.inputElement.value.length - this.selEnd);

        const rawTextStart = this._value.slice(0, startLength);
        const rawTextEnd = this._value.slice(this._value.length - endLength);

        return {
            start: rawTextStart,
            end: rawTextEnd
        };
    }
}
