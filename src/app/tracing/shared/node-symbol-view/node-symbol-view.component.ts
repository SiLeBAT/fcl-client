import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {NodeShapeType, Color} from '@app/tracing/data.model';
import {Map as ImmutableMap} from 'immutable';
import {Utils} from '@app/tracing/util/non-ui-utils';

interface GradientStop {
  offset: string;
  style: string;
}

function isColorWhite(color: Color): boolean {
  return color.r === 255 && color.b === 255 && color.g === 255;
}

@Component({
  selector: 'fcl-node-symbol-view',
  templateUrl: './node-symbol-view.component.html',
  styleUrls: ['./node-symbol-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NodeSymbolViewComponent {
  private static readonly DEFAULT_COLOR_WHITE = 'rgb(255, 255, 255)';

  private readonly ShapeMap: ImmutableMap<string, string> = ImmutableMap<
    string,
    string
  >({
    [NodeShapeType.CIRCLE]: 'circle',
    [NodeShapeType.SQUARE]: 'square',
    [NodeShapeType.TRIANGLE]: 'triangle',
    [NodeShapeType.DIAMOND]: 'diamond',
    [NodeShapeType.PENTAGON]: 'pentagon',
    [NodeShapeType.HEXAGON]: 'hexagon',
    [NodeShapeType.OCTAGON]: 'octagon',
    [NodeShapeType.STAR]: 'star',
  });

  private svgShapeType_: string | null = null;
  private fillColor_: string | null =
    NodeSymbolViewComponent.DEFAULT_COLOR_WHITE;
  private isFillColorNonWhite_ = false;
  private gradientId_: string | null = null;
  private gradientStops_: GradientStop[] = [];

  @Input() set shapeType(shape: NodeShapeType) {
    this.svgShapeType_ = shape ? this.ShapeMap.get(shape) : null;
  }

  @Input() set fillColor(color: Color | null) {
    this.setFillColor(color);
  }

  @Input() set mapStationColor(colors: Color[]) {
    this.setFillColor(colors);
  }

  @Input() set dataTableShapeType(shape: NodeShapeType | undefined | null) {
    this.svgShapeType_ = shape
      ? this.ShapeMap.get(shape)
      : this.ShapeMap.get(NodeShapeType.CIRCLE);
  }

  getShapeType(): string | null {
    return this.svgShapeType_;
  }

  getFillColor(): string {
    return this.fillColor_ ?? `url(#${this.gradientId_})`;
  }

  get gradientId(): string | null {
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

  private resetColors(): void {
    this.fillColor_ = null;
    this.isFillColorNonWhite_ = true;
    this.gradientStops_ = [];
  }

  private setDefaultColor(): void {
    this.fillColor_ = NodeSymbolViewComponent.DEFAULT_COLOR_WHITE;
    this.isFillColorNonWhite_ = false;
  }

  private setFillColor(colorOrColors: Color | Color[] | null): void {
    this.resetColors();

    if (!colorOrColors) {
      this.setDefaultColor();
    } else if (Array.isArray(colorOrColors)) {
      if (colorOrColors.length === 0) {
        this.setDefaultColor();
      } else if (colorOrColors.length === 1) {
        this.setSimpleFillColor(colorOrColors[0]);
      } else {
        this.setGradientFillColor(colorOrColors);
      }
    } else {
      const color: Color = colorOrColors;
      this.setSimpleFillColor(color);
    }
  }

  private setSimpleFillColor(color: Color): void {
    this.fillColor_ = Utils.colorToCss(color);
    this.isFillColorNonWhite_ = !isColorWhite(color);
  }

  private setGradientFillColor(colors: Color[]): void {
    let gradientId = 'col';
    let gradientStops: GradientStop[] = [];

    const percent = 100 / colors.length;
    gradientStops = colors.flatMap((c: Color, index) => {
      gradientId += `r${c.r}g${c.g}b${c.b}`;

      return [
        {
          offset: `${index * percent}%`,
          style: `rgb(${c.r}, ${c.g}, ${c.b})`,
        },
        {
          offset: `${(index + 1) * percent}%`,
          style: `rgb(${c.r}, ${c.g}, ${c.b})`,
        },
      ];
    });
    this.isFillColorNonWhite_ = true;

    this.gradientId_ = gradientId;
    this.gradientStops_ = gradientStops;
  }
}
