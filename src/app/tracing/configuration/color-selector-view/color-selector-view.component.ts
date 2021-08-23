import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { Color } from '@app/tracing/data.model';

@Component({
    selector: 'fcl-color-selector-view',
    templateUrl: './color-selector-view.component.html',
    styleUrls: ['./color-selector-view.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ColorSelectorViewComponent {

    private static readonly DEFAULT_COLOR: Color = {
        r: 3,
        g: 78,
        b: 162
    };

    @Input() set color(color: Color) {
        if (color !== null) {
            this.rgbaColorStr_ = this.convertColorToRGBAStr(color);
            this.rgbColorStr_ = this.convertColorToRGBStr(color);
        } else {
            this.rgbColorStr_ = undefined;
        }
    }
    @Input() disabled: boolean = false;
    @Output() colorChange = new EventEmitter<Color>();

    private rgbaColorStr_ = this.convertColorToRGBAStr(ColorSelectorViewComponent.DEFAULT_COLOR);
    private rgbColorStr_ = this.convertColorToRGBStr(ColorSelectorViewComponent.DEFAULT_COLOR);

    get rgbaColorStr(): string {
        return this.rgbaColorStr_;
    }

    get rgbColorStr(): string {
        return this.rgbColorStr_;
    }

    constructor() { }

    onColorPickerSelect(color: string) {
        this.colorChange.emit(this.convertRGBAStrToColor(color));
    }

    private convertRGBAStrToColor(color: string): Color {
        const rgbArray: number[] = color
            .match(/\((.+?)\)/)[1]
            .split(',')
            .map(x => parseInt(x, 10))
            .slice(0, 3);
        return {
            r: rgbArray[0],
            g: rgbArray[1],
            b: rgbArray[2]
        };
    }

    private convertColorToRGBAStr(color: Color): string {
        return `rgba(${color.r}, ${color.g}, ${color.b})`;
    }

    private convertColorToRGBStr(color: Color): string {
        return `rgb(${color.r},${color.g},${color.b})`;
    }

    get style(): any {
        return this.rgbColorStr_ ?
            { 'background-color': this.rgbColorStr_ } :
            {};
    }
}
