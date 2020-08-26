import { Component, OnInit, Input } from '@angular/core';
import { NodeShapeType, Color } from '@app/tracing/data.model';
import { Map as ImmutableMap } from 'immutable';
import { Utils } from '@app/tracing/util/non-ui-utils';

interface GradientStop {
    offset: string;
    style: string;
}

@Component({
    selector: 'fcl-node-symbol-view',
    templateUrl: './node-symbol-view.component.html',
    styleUrls: ['./node-symbol-view.component.scss']
})
export class NodeSymbolViewComponent implements OnInit {

    private static readonly DEFAULT_GRADIENT_ID = 'colr255g255b255';
    private static readonly DEFAULT_COLOR_WHITE = 'rgb(255, 255, 255)';

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
    private _isFillColorNonWhite: boolean;

    @Input() set shapeType(shape: NodeShapeType) {
        this._svgShapeType = shape ? this.ShapeMap.get(shape) : null;
    }

    @Input() set fillColor(color: Color) {
        this._fillColor = color ? Utils.colorToCss(color) : NodeSymbolViewComponent.DEFAULT_COLOR_WHITE;
        this.gradientId = color ? `colr${color.r}g${color.g}b${color.b}` : NodeSymbolViewComponent.DEFAULT_GRADIENT_ID;

        let gradientStops: GradientStop[];
        let gradientId: string;

        gradientId = color ? `colr${color.r}g${color.g}b${color.b}` : NodeSymbolViewComponent.DEFAULT_GRADIENT_ID;
        gradientStops = [
            {
                offset: '0%',
                style: this._fillColor
            },
            {
                offset: '100%',
                style: this._fillColor
            }
        ];

        this.gradientId = gradientId;
        this.gradientStops = gradientStops;
        this._isFillColorNonWhite = color ? color.r !== 255 || color.b !== 255 || color.g !== 255 : false;
    }

    @Input() set mapStationColor(color: number[][]) {
        let gradientId: string = 'col';
        let gradientStops: GradientStop[];

        if (color.length > 0) {

            const percent = 100 / color.length;
            gradientStops = color.flatMap((c: number[], index) => {
                gradientId += `r${c[0]}g${c[1]}b${c[2]}`;

                return [
                    {
                        offset: `${index * percent}%`,
                        style: `rgb(${c[0]}, ${c[1]}, ${c[2]})`
                    },
                    {
                        offset: `${(index + 1) * percent}%`,
                        style: `rgb(${c[0]}, ${c[1]}, ${c[2]})`
                    }
                ];
            });
            this._isFillColorNonWhite = true;
        } else {
            this.gradientId = NodeSymbolViewComponent.DEFAULT_GRADIENT_ID;
            gradientStops = [
                {
                    offset: '0%',
                    style: NodeSymbolViewComponent.DEFAULT_COLOR_WHITE
                },
                {
                    offset: '100%',
                    style: NodeSymbolViewComponent.DEFAULT_COLOR_WHITE
                }
            ];
            this._isFillColorNonWhite = false;
        }

        this.gradientId = gradientId;
        this.gradientStops = gradientStops;
    }

    @Input() set dataTableShapeType(shape: NodeShapeType) {
        this._svgShapeType = shape ? this.ShapeMap.get(shape) : this.ShapeMap.get(NodeShapeType.CIRCLE);
    }

    gradientId: string = NodeSymbolViewComponent.DEFAULT_GRADIENT_ID;
    gradientStops: GradientStop[] = [
        {
            offset: '0%',
            style: NodeSymbolViewComponent.DEFAULT_COLOR_WHITE
        },
        {
            offset: '100%',
            style: NodeSymbolViewComponent.DEFAULT_COLOR_WHITE
        }
    ];

    getShapeType(): string {
        return this._svgShapeType;
    }

    getFillColor(): string {
        return `url(#${this.gradientId})`;
    }

    getIsFillColorNonWhite(): boolean {
        return this._isFillColorNonWhite;
    }

    constructor() { }

    ngOnInit() {
    }
}
