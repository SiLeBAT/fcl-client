import { Component, OnInit, Input } from '@angular/core';
import { Utils } from '@app/tracing/util/non-ui-utils';
import { Color } from '@app/tracing/data.model';

@Component({
    selector: 'fcl-klecks-symbol',
    templateUrl: './klecks-symbol.component.html'
})
export class KlecksSymbolComponent implements OnInit {

    private _color: string;

    @Input()
    set color(color: Color) {
        this._color = color ? Utils.colorToCss(color) : 'black';
    }

    getColor(): string {
        return this._color;
    }

    constructor() { }

    ngOnInit() {
    }

}
