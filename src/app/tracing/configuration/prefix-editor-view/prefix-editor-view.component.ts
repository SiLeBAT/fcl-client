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
const INPUT_TYPE_UNDO = 'historyUndo';
const INPUT_TYPE_REDO = 'historyRedo';
const FORMAT_TYPE_TEXT_PLAIN = 'text/plain';

interface EditOp {
    deleteText?: string;
    deleteTextAt?: number;
    insertText?: string;
    insertTextAt?: number;
}

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
            this._value = this.preprocessValue(value);
            this._displayValue = this.maskText(value);
            this.pendingSelectionRange = null;
            this.undoOps = [];
            this.redoOps = [];
        }
    }

    @Output() valueChange = new EventEmitter<string>();

    @ViewChild('inputElement') inputElementRef: ElementRef<HTMLInputElement>;

    get displayValue(): string {
        return this._displayValue;
    }

    private _value: string = '';
    private undoOps: EditOp[] = [];
    private redoOps: EditOp[] = [];
    private dragStarted = false;
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

    onBeforeInput(event: InputEvent): boolean {
        let cancelInput = false;
        if (event.inputType === INPUT_TYPE_UNDO) {
            const undoOp = this.undoOps.pop();
            if (undoOp) {
                this.undoEditOp(undoOp);
                this.redoOps.push(undoOp);
            }
            cancelInput = true;
        } else if (event.inputType === INPUT_TYPE_REDO) {
            const redoOp = this.redoOps.pop();
            if (redoOp) {
                this.redoEditOp(redoOp);
                this.undoOps.push(redoOp);
            }
            cancelInput = true;
        } else if (
            event.inputType !== INPUT_TYPE_INSERT_FROM_DROP &&
            event.inputType !== INPUT_TYPE_INSERT_TEXT &&
            !event.inputType.startsWith(INPUT_TYPE_DELETE_PREFIX)
        ) {
            cancelInput = true;
        }

        if (cancelInput) {
            event.preventDefault();
        }
        return !cancelInput;
    }


    onInput(event: InputEvent): void {
        if (event.inputType === INPUT_TYPE_INSERT_FROM_DROP) {
            this.processInsertDropEvent();
        } else if (event.inputType === INPUT_TYPE_INSERT_TEXT) {
            this.processInsertCharacterEvent(event.data);
        } else if (event.inputType.startsWith(INPUT_TYPE_DELETE_PREFIX)) {
            this.processDeleteEvent(event.inputType);
        }
        // paste inputs are handled on paste event (because paste length and sel length is not known only there)
    }

    onPaste(event: ClipboardEvent): boolean | void {
        const clipboardText = this.preprocessValue(event.clipboardData.getData(FORMAT_TYPE_TEXT_PLAIN));

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
                this.recordEditOp({
                    deleteText: rawParts.middle,
                    deleteTextAt: rawParts.start.length,
                    insertText: clipboardText,
                    insertTextAt: rawParts.start.length
                });
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

    onCut(event: ClipboardEvent): void {
        const clipboardText = this.displayedSelection;
        const selectedRawText = this.rawSelection;

        if (selectedRawText !== clipboardText) {
            event.clipboardData.setData(FORMAT_TYPE_TEXT_PLAIN, selectedRawText);
        }
    }

    onDragStart(event: DragEvent): void {
        const dragDisplayText = event.dataTransfer.getData(FORMAT_TYPE_TEXT_PLAIN);
        const dragRawText = this.rawSelection;

        if (dragDisplayText !== dragRawText) {
            event.dataTransfer.setData(FORMAT_TYPE_TEXT_PLAIN, dragRawText);
        }
        this.dragStarted = true;
    }

    onDragEnd(event: DragEvent): void {
        this.dragStarted = false;
    }

    onDrop(event: DragEvent): void {
        const unprocessedDropText = event.dataTransfer.getData(FORMAT_TYPE_TEXT_PLAIN);
        const preprocessedDropText = this.preprocessValue(unprocessedDropText);

        if (unprocessedDropText !== preprocessedDropText) {
            event.dataTransfer.setData(FORMAT_TYPE_TEXT_PLAIN, preprocessedDropText);
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
        this.recordEditOp({
            insertText: rawDropText,
            insertTextAt: beforeSel.length
        }, true);
        this.setNewValue(newValue);
    }

    private processDeleteEvent(inputType: string): void {
        const restoreSelection = inputType !== INPUT_TYPE_DELETE_BY_DRAG;
        const rawParts = this.getRawTextParts();
        const newValue = `${rawParts.start}${rawParts.end}`;
        if (restoreSelection) {
            const newCursorPos = this.selStart;
            this.pendingSelectionRange = {
                start: newCursorPos,
                end: newCursorPos
            };
        }
        this.recordEditOp({
            deleteText: rawParts.middle,
            deleteTextAt: rawParts.start.length
        });
        this.setNewValue(newValue);
    }

    private processInsertCharacterEvent(character: string): void {
        const rawParts = this.getRawTextParts(this.selStart - 1);
        const newValue = `${rawParts.start}${character}${rawParts.end}`;

        this.pendingSelectionRange = {
            start: this.selStart,
            end: this.selStart
        };
        this.recordEditOp({
            deleteText: rawParts.middle,
            deleteTextAt: rawParts.start.length,
            insertText: character,
            insertTextAt: rawParts.start.length
        });
        this.setNewValue(newValue);
    }

    private setNewValue(newValue: string): void {
        this._value = newValue;
        this._displayValue = this.maskText(newValue);
        this.valueChange.emit(newValue);
    }

    private maskText(text: string): string {
        return text.replace(/ /g, MASK_CHARACTER);
    }

    private getRawTextParts(startLength?: number, endLength?: number): { start: string; middle: string; end: string } {
        startLength = startLength !== undefined ? startLength : this.selStart;
        endLength = endLength !== undefined ? endLength : (this.inputElement.value.length - this.selEnd);

        const endStart = this._value.length - endLength;
        const rawTextStart = this._value.slice(0, startLength);
        const rawTextEnd = this._value.slice(endStart);

        return {
            start: rawTextStart,
            middle: this._value.slice(startLength, endStart),
            end: rawTextEnd
        };
    }

    private undoEditOp(editOp: EditOp): void {
        let newValue = this._value;
        if (editOp.insertText) {
            const beforeInsert = newValue.slice(0, editOp.insertTextAt);
            const afterInsert = newValue.slice(editOp.insertTextAt + editOp.insertText.length);
            newValue = `${beforeInsert}${afterInsert}`;
            this.pendingSelectionRange = {
                start: editOp.insertTextAt,
                end: editOp.insertTextAt
            };
        }
        if (editOp.deleteText) {
            const beforeDelete = newValue.slice(0, editOp.deleteTextAt);
            const afterDelete = newValue.slice(editOp.deleteTextAt);
            newValue = `${beforeDelete}${editOp.deleteText}${afterDelete}`;
            this.pendingSelectionRange = {
                start: editOp.deleteTextAt,
                end: editOp.deleteTextAt + editOp.deleteText.length
            };
        }
        this.setNewValue(newValue);
    }

    private redoEditOp(editOp: EditOp): void {
        let newValue = this._value;
        if (editOp.deleteText) {
            const beforeDelete = newValue.slice(0, editOp.deleteTextAt);
            const afterDelete = newValue.slice(editOp.deleteTextAt + editOp.deleteText.length);
            newValue = `${beforeDelete}${afterDelete}`;
            this.pendingSelectionRange = {
                start: editOp.deleteTextAt,
                end: editOp.deleteTextAt
            };
        }
        if (editOp.insertText) {
            const beforeInsert = newValue.slice(0, editOp.insertTextAt);
            const afterInsert = newValue.slice(editOp.insertTextAt);
            newValue = `${beforeInsert}${editOp.insertText}${afterInsert}`;
            this.pendingSelectionRange = {
                start: editOp.insertTextAt,
                end: editOp.insertTextAt + editOp.insertText.length
            };
        }

        this.setNewValue(newValue);
    }

    private recordEditOp(editOp: EditOp, isInsertDrop?: boolean): void {
        if (
            isInsertDrop &&
            this.undoOps.length > 0 &&
            this.dragStarted
        ) {
            this.undoOps.push({
                ...this.undoOps.pop(),
                ...editOp
            });
        } else {
            this.undoOps.push(editOp);
        }
        this.redoOps = [];
    }

    private preprocessValue(text: string): string {
        return text.replace(/[\n\t]/g, ' ');
    }
}
