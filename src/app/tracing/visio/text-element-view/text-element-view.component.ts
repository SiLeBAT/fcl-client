import { Component, OnInit, Output, Input, EventEmitter } from '@angular/core';

@Component({
    selector: 'fcl-text-element-view',
    templateUrl: './text-element-view.component.html',
    styleUrls: ['./text-element-view.component.scss']
})
export class TextElementViewComponent implements OnInit {

    @Input() set value(value: string) {
        if (value !== this.lastInput) {
            this.initialValue = value;
        }
    }

    @Output() valueChange = new EventEmitter<string>();

    private lastInput: string = undefined;
    initialValue: string = undefined;

    constructor() { }

    ngOnInit() {
    }

    onKeyDown(e: KeyboardEvent): boolean {
        // filter out Enter
        return !(e.key === 'Enter');
    }

    onPaste(e: ClipboardEvent): void {
        // cancel default paste
        e.preventDefault();
        // get text representation of clipboard
        const text = e.clipboardData.getData('text/plain');

        if (text !== undefined && text !== null) {
            // remove linebreaks and insert text manually
            document.execCommand('insertHTML', false, text.replace(/(\r\n|\n|\r)/gm, ''));
        }
    }

    onInput(e: Event): void {
        const textBox = (e.target as HTMLDivElement);
        const textContent = textBox.textContent;
        this.lastInput = textContent;
        this.valueChange.emit(textContent);
    }
}
