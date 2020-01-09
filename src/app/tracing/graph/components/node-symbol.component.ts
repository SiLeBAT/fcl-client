import { Component, OnInit, Input } from '@angular/core';
import { NodeShapeType, Color } from '@app/tracing/data.model';
import { Map as ImmutableMap } from 'immutable';
import { Utils } from '@app/tracing/util/non-ui-utils';

@Component({
    selector: 'fcl-node-symbol',
    templateUrl: './node-symbol.component.html',
    styleUrls: ['./node-symbol.component.scss']
})
export class NodeSymbolComponent implements OnInit {

    private readonly ShapeMap: ImmutableMap<string, string> = ImmutableMap<string, string>({
        [NodeShapeType.CIRCLE]: 'circle',
        [NodeShapeType.SQUARE]: 'square',
        [NodeShapeType.TRIANGLE]: 'triangle',
        [NodeShapeType.DIAMOND]: 'diamond',
        [NodeShapeType.PENTAGON]: 'pentagon',
        [NodeShapeType.HEXAGON]: 'hexagon',
        [NodeShapeType.OCTAGON]: 'octagon',
        [NodeShapeType.STAR]: 'star'
    });

    private _svgShapeType: string;
    private _fillColor: string;

    @Input() set shapeType(shape: NodeShapeType) {
        this._svgShapeType = shape ? this.ShapeMap.get(shape) : null;
    }

    @Input() set fillColor(color: Color) {
        this._fillColor = color ? Utils.colorToCss(color) : 'none';
    }

    getShapeType(): string {
        return this._svgShapeType;
    }

    getFillColor(): string {
        return this._fillColor;
    }

    constructor() { }

    ngOnInit() {
    }
}
