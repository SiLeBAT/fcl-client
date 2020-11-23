import { Component, OnInit, Input } from '@angular/core';
import { Color } from '@app/tracing/data.model';
import { Utils } from '@app/tracing/util/non-ui-utils';

@Component({
    selector: 'fcl-edge-symbol',
    templateUrl: './edge-symbol.component.html',
    styleUrls: ['./edge-symbol.component.scss']
})
export class EdgeSymbolComponent implements OnInit {

    private _edgeColor: string;

    @Input() set edgeColor(color: Color) {
        this._edgeColor = color ? Utils.colorToCss(color) : 'none';
    }

    getEdgeColor(): string {
        return this._edgeColor;
    }

    constructor() { }

    ngOnInit() {
    }
}
