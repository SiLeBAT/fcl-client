import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
    selector: 'fcl-color-picker-view',
    templateUrl: './color-picker-view.component.html'
})
export class ColorPickerViewComponent implements OnInit {
    @Input() color: string;
    @Output() colorChange = new EventEmitter<string>();

    constructor() { }

    ngOnInit() {
    }

    onColorPickerSelect(color: string) {
        this.colorChange.emit(color);
    }

}
