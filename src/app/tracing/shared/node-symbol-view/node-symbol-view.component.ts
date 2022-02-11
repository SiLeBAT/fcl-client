import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NodeShapeType, Color } from '@app/tracing/data.model';
import { Map as ImmutableMap } from 'immutable';
import { Utils } from '@app/tracing/util/non-ui-utils';

interface GradientStop {
    offset: string;
    style: string;
}

function arrayToColor(color: number[]): Color {
    return { r: color[0], g: color[1], b: color[2] };
}

function isColorWhite(color: Color): boolean {
    return color.r === 255 && color.b === 255 && color.g === 255;
}

@Component({
    selector: 'fcl-node-symbol-view',
    templateUrl: './node-symbol-view.component.html',
    styleUrls: ['./node-symbol-view.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NodeSymbolViewComponent {

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

    private svgShapeType_: string | null = null;
    private fillColor_ = NodeSymbolViewComponent.DEFAULT_COLOR_WHITE;
    private isFillColorNonWhite_ = false;
    private gradientId_: string | null = null;
    private gradientStops_: GradientStop[] = [];

    @Input() set shapeType(shape: NodeShapeType) {
        this.svgShapeType_ = shape ? this.ShapeMap.get(shape) : null;
    }

    @Input() set fillColor(color: Color | null) {
        this.setFillColor(color);
    }

    @Input() set mapStationColor(colors: number[][]) {
        this.setFillColor(colors);
    }

    @Input() set dataTableShapeType(shape: NodeShapeType) {
        this.svgShapeType_ = shape ? this.ShapeMap.get(shape) : this.ShapeMap.get(NodeShapeType.CIRCLE);
    }

    getShapeType(): string {
        return this.svgShapeType_;
    }

    getFillColor(): string {
        return this.fillColor_ || `url(#${this.gradientId_})`;
    }

    get gradientId(): string {
        return this.gradientId_;
    }

    get useGradient(): boolean {
        return this.fillColor_ === null;
    }

    get gradientStops(): GradientStop[] {
        return this.gradientStops_;
    }

    get isFillColorNonWhite(): boolean {
        return this.isFillColorNonWhite_;
    }

    constructor() {}

    private resetColors(): void {
        this.fillColor_ = null;
        this.isFillColorNonWhite_ = true;
        this.gradientStops_ = null;
        this.gradientStops_ = [];
    }

    private setDefaultColor(): void {
        this.fillColor_ = NodeSymbolViewComponent.DEFAULT_COLOR_WHITE;
        this.isFillColorNonWhite_ = false;
    }

    private setFillColor(colorOrColors: Color | number[][] | null): void {
        this.resetColors();

        if (colorOrColors === null) {
            this.setDefaultColor();
        } else {
            if (Array.isArray(colorOrColors)) {
                const colors: number[][] = colorOrColors;
                if (colors.length === 0) {
                    this.setDefaultColor();
                } else if (colors.length === 1) {
                    this.setSimpleFillColor(arrayToColor(colors[0]));
                } else {
                    this.setGradientFillColor(colors);
                }
            } else {
                const color: Color = colorOrColors;
                this.setSimpleFillColor(color);
            }
        }
    }

    private setSimpleFillColor(color: Color): void {
        this.fillColor_ = Utils.colorToCss(color);
        this.isFillColorNonWhite_ = !isColorWhite(color);
    }

    private setGradientFillColor(colors: number[][]): void {
        let gradientId: string = 'col';
        let gradientStops: GradientStop[];

        const percent = 100 / colors.length;
        gradientStops = colors.flatMap((c: number[], index) => {
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
        this.isFillColorNonWhite_ = true;

        this.gradientId_ = gradientId;
        this.gradientStops_ = gradientStops;
    }
}
