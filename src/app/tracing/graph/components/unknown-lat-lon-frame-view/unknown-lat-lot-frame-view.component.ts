import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { Layout } from "@app/tracing/data.model";
import { BoundaryRect } from "@app/tracing/util/geometry-utils";
import {
    createMargin,
    getRenderedRect,
} from "../../cy-graph/virtual-zoom-utils";

@Component({
    selector: "fcl-unknown-lat-lon-frame-view",
    templateUrl: "./unknown-lat-lon-frame-view.component.html",
})
export class UnknownLatLonFrameViewComponent implements OnChanges {
    private static readonly BORDER_RADIUS = 10;

    @Input() viewport: Layout | null = null;
    @Input() unknownLatLonRect: BoundaryRect | null = null;
    @Input() unknownLatLonRectBorderWidth: number | null = null;

    private d_: string = "";

    get d(): string {
        return this.d_;
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (
            this.unknownLatLonRect !== null &&
            this.viewport !== null &&
            this.unknownLatLonRectBorderWidth !== null
        ) {
            this.updatePathCommands();
        }
    }

    private updatePathCommands(): void {
        const boundaryWidthHalf = this.unknownLatLonRectBorderWidth! / 2;
        const radius = Math.min(
            UnknownLatLonFrameViewComponent.BORDER_RADIUS,
            boundaryWidthHalf,
        );

        const outerRect = getRenderedRect(
            this.unknownLatLonRect!,
            createMargin(boundaryWidthHalf),
            this.viewport!,
        );
        const innerRect = getRenderedRect(
            this.unknownLatLonRect!,
            createMargin(-boundaryWidthHalf),
            this.viewport!,
        );

        const cmdAprefix = `A ${radius} ${radius}, 0, 0, 1,`;
        const cmdHSuffix = `${outerRect.width - 2 * radius}`;
        this.d_ = `M${outerRect.left} ${outerRect.top + radius}
            ${cmdAprefix} ${outerRect.left + radius} ${outerRect.top}
            h${cmdHSuffix}
            ${cmdAprefix} ${outerRect.right} ${outerRect.top + radius}
            v${outerRect.height - 2 * radius}
            ${cmdAprefix} ${outerRect.right - radius} ${outerRect.bottom}
            h-${cmdHSuffix}
            ${cmdAprefix} ${outerRect.left} ${outerRect.bottom - radius}
            z
            M${innerRect.left} ${innerRect.top}
            h${innerRect.width}
            v${innerRect.height}
            h-${innerRect.width}
            z`;
    }
}
