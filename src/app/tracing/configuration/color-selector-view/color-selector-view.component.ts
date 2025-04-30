import {
    Component,
    Input,
    Output,
    EventEmitter,
    ChangeDetectionStrategy,
    ElementRef,
    ViewChild,
    ChangeDetectorRef,
} from "@angular/core";
import { Color, RGBAColor } from "@app/tracing/data.model";
import { ColorPickerDirective } from "ngx-color-picker";

export type ColorPickerPosition = "left" | "top" | "right" | "bottom";
type AlphaChannel = "disabled" | "always";

function isRGBAColor(color: Color | RGBAColor): color is RGBAColor {
    return (color as RGBAColor).a !== undefined;
}

@Component({
    selector: "fcl-color-selector-view",
    templateUrl: "./color-selector-view.component.html",
    styleUrls: ["./color-selector-view.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorSelectorViewComponent {
    private static readonly COLOR_PICKER_HEIGHT = 320;
    private static readonly COLOR_PICKER_WIDTH = 230;
    private static readonly MAT_EXPANSION_PANEL_TAGNAME = "MAT-EXPANSION-PANEL";
    private static readonly WO_SPACE_CLASS = "fcl-color-picker--wo-space";

    private colorPickerPositionOffsets: Record<ColorPickerPosition, string> = {
        left: "-390%",
        top: "-90%",
        bottom: "-90%",
        right: "-390%",
    };

    private defaultColorPickerPositions: ColorPickerPosition[] = [
        "left",
        "right",
        "top",
        "bottom",
    ];

    private rgbaColorStr_: string | undefined;
    private buttonStyle_: { "background-color"?: string } = {};

    private colorPickerPosition: ColorPickerPosition =
        this.defaultColorPickerPositions[0];
    private spaceIsNotAvailable = false;

    private useAlphaChannel = false;

    useFirstColorPickerButton = true;

    @Input() preferredColorPickerPosition: ColorPickerPosition =
        this.defaultColorPickerPositions[0];

    @Input() set color(color: Color | RGBAColor | null | undefined) {
        if (color !== null && color !== undefined) {
            this.useAlphaChannel = isRGBAColor(color);
            this.rgbaColorStr_ = this.convertColorToRGBAStr(color);
            this.buttonStyle_ = { "background-color": this.rgbaColorStr_ };
        } else {
            this.rgbaColorStr_ = undefined;
            this.buttonStyle_ = {};
        }
    }
    @Input() disabled: boolean = false;
    @Output() colorChange = new EventEmitter<Color | RGBAColor>();

    @ViewChild("colorpicker", { static: false }) colorPickerElement: ElementRef;
    @ViewChild(ColorPickerDirective, { static: false })
    colorPickerDirective: ColorPickerDirective;

    get cpAlphaChannel(): AlphaChannel {
        return this.useAlphaChannel ? "always" : "disabled";
    }

    get rgbaColorStr(): string | undefined {
        return this.rgbaColorStr_;
    }

    get cpPosition(): ColorPickerPosition {
        return this.colorPickerPosition;
    }

    get cpPositionOffset(): string {
        return this.colorPickerPositionOffsets[this.colorPickerPosition];
    }

    get buttonStyle(): any {
        return this.buttonStyle_;
    }

    get ngClass(): string {
        return this.spaceIsNotAvailable
            ? ColorSelectorViewComponent.WO_SPACE_CLASS
            : "";
    }

    constructor(private changeDetectorRef: ChangeDetectorRef) {}

    onColorPickerSelect(rgbaColorStr: string) {
        const color = this.convertRGBAStrToColor(rgbaColorStr);
        if (color) {
            this.colorChange.emit(color);
        }
    }

    onClick(event: MouseEvent): void {
        this.updateColorPickerPosition();

        this.changeDetectorRef.detectChanges();
        this.colorPickerDirective.openDialog();
    }

    onColorPickerClose(): void {
        // The component uses 2 identical color picker buttons.
        // This mechanism is required, because the color picker doesn't updates
        // its cpPosition.
        // The position, where the color-picker-dialog should be opened can be provided by an input, but
        // once the color-picker-dialog was opened the position cannot be changed anymore it will always be opened
        // at the same position.
        // By using 2 alternating color picker buttons the update of the position can be forced.
        // Here we toggle between the 2 buttons
        this.useFirstColorPickerButton = !this.useFirstColorPickerButton;
    }

    private convertRGBAStrToColor(rgbaColorStr: string): Color | RGBAColor {
        // e.g.: rgba(3,162,96) or rgba(5,4,3,0.85)
        const matchArray = rgbaColorStr.match(
            /^rgba?\(\s*(?<r>\d{1,3}),\s*(?<g>\d{1,3}),\s*(?<b>\d{1,3})(,\s*(?<a>[^\)]+))?\)$/,
        );
        if (matchArray && matchArray.length >= 4) {
            const rgbArray = matchArray.slice(1, 4).map((x) => parseInt(x, 10));
            const rgbColor = {
                r: rgbArray[0],
                g: rgbArray[1],
                b: rgbArray[2],
            };
            if (matchArray.length >= 6) {
                const opacity = parseFloat(matchArray[5]);
                if (!Number.isNaN(opacity)) {
                    const rgbaColor: RGBAColor = {
                        ...rgbColor,
                        a: opacity,
                    };
                    return rgbaColor;
                }
            }
            return rgbColor;
        }
        throw new Error(
            `RGB Values cannot be extracted from rgb/rgba color string '${rgbaColorStr}'`,
        );
    }

    private convertColorToRGBAStr(color: Color | RGBAColor): string {
        return isRGBAColor(color)
            ? `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`
            : `rgba(${color.r}, ${color.g}, ${color.b})`;
    }

    private getPreferredPositions(): ColorPickerPosition[] {
        return [
            this.preferredColorPickerPosition,
            ...this.defaultColorPickerPositions.filter(
                (p) => p !== this.preferredColorPickerPosition,
            ),
        ];
    }

    private updateColorPickerPosition(): void {
        const space = this.getSpaceForColorPicker();
        const positions = this.getPreferredPositions();
        let appropriateColorPickerPosition: ColorPickerPosition | undefined;
        for (const pos of positions) {
            if (
                (pos === "left" &&
                    space.left >=
                        ColorSelectorViewComponent.COLOR_PICKER_WIDTH) ||
                (pos === "top" &&
                    space.top >=
                        ColorSelectorViewComponent.COLOR_PICKER_HEIGHT) ||
                (pos === "right" &&
                    space.right >=
                        ColorSelectorViewComponent.COLOR_PICKER_WIDTH) ||
                (pos === "bottom" &&
                    space.bottom >=
                        ColorSelectorViewComponent.COLOR_PICKER_HEIGHT)
            ) {
                appropriateColorPickerPosition = pos;

                break;
            }
        }
        this.spaceIsNotAvailable = appropriateColorPickerPosition === undefined;
        if (appropriateColorPickerPosition !== undefined) {
            this.colorPickerPosition = appropriateColorPickerPosition;
        } else {
            this.colorPickerPosition = "left";
        }
    }

    private getSpaceForColorPicker(): {
        left: number;
        right: number;
        bottom: number;
        top: number;
    } {
        let element: HTMLElement = this.colorPickerElement.nativeElement;
        const buttonRect = element.getBoundingClientRect();
        while (
            element.tagName !==
                ColorSelectorViewComponent.MAT_EXPANSION_PANEL_TAGNAME &&
            element.parentElement
        ) {
            element = element.parentElement;
        }
        const containerRect = element.getBoundingClientRect();
        return {
            left: buttonRect.left - containerRect.left,
            right: containerRect.right - buttonRect.right,
            bottom: containerRect.bottom - buttonRect.bottom,
            top: buttonRect.top - containerRect.top,
        };
    }
}
