import { Component, OnInit, Input } from '@angular/core';
import { NodeShapeType, Color } from '@app/tracing/data.model';
import { Map as ImmutableMap } from 'immutable';
import { Utils } from '@app/tracing/util/non-ui-utils';

@Component({
    selector: 'fcl-edge-symbol',
    templateUrl: './edge-symbol.component.html'
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
