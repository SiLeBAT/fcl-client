import { Component, OnInit, OnDestroy } from "@angular/core";
import { Constants } from "../util/constants";
import * as TracingSelectors from "../state/tracing.selectors";
import * as fromTracing from "../state/tracing.reducers";
import * as tracingActions from "../state/tracing.actions";
import { Store, select } from "@ngrx/store";
import { takeWhile } from "rxjs/operators";
import {
    GraphSettings,
    MergeDeliveriesType,
    CrossContTraceType,
    TracingSettings,
    Color,
    MapType,
    GraphType,
} from "../data.model";

interface Option<T> {
    value: T;
    label: string;
    toolTip: string;
}

@Component({
    selector: "fcl-graph-settings",
    templateUrl: "./graph-settings.component.html",
    styleUrls: ["./graph-settings.component.scss"],
})
export class GraphSettingsComponent implements OnInit, OnDestroy {
    graphSettings: GraphSettings;
    tracingSettings: TracingSettings;

    fontSizes = Constants.FONT_SIZES;
    nodeSizes = Constants.NODE_SIZES;
    edgeWidths = Constants.EDGE_WIDTHS;
    geojsonBorderWidths = Constants.GEOJSON_BORDER_WIDTHS;

    get isShapeFileMapActive(): boolean {
        return (
            this.graphSettings.mapType !== MapType.MAP_ONLY &&
            this.graphSettings.type === GraphType.GIS
        );
    }

    readonly crossContTraceTypeOptions: Option<CrossContTraceType>[] = [
        {
            value: CrossContTraceType.DO_NOT_CONSIDER_DELIVERY_DATES,
            label: "Ignore dates",
            toolTip:
                "Delivery dates are ignored for cross contamination tracing.",
        },
        {
            value: CrossContTraceType.USE_EXPLICIT_DELIVERY_DATES,
            label: "Use explicit dates",
            toolTip:
                "Use explicit delivery dates for cross contamination tracing.",
        },
        {
            value: CrossContTraceType.USE_INFERED_DELIVERY_DATES_LIMITS,
            label: "Use deduced dates",
            toolTip:
                "Use deduced delivery dates for cross contamination tracing. Deduction is based on explicit delivery dates and delivery relations.",
        },
    ];

    readonly mergeDeliveriesOptions: Option<MergeDeliveriesType>[] = [
        {
            value: MergeDeliveriesType.NO_MERGE,
            label: "No",
            toolTip: "Deliveries are not merged.",
        },
        {
            value: MergeDeliveriesType.MERGE_ALL,
            label: "All",
            toolTip: "All deliveries between a pair of nodes are merged.",
        },
        {
            value: MergeDeliveriesType.MERGE_PRODUCT_WISE,
            label: "Product-wise",
            toolTip: "Deliveries from an identical product are merged.",
        },
        {
            value: MergeDeliveriesType.MERGE_LABEL_WISE,
            label: "Label-wise",
            toolTip: "Deliveries with an identical label are merged.",
        },
        {
            value: MergeDeliveriesType.MERGE_LOT_WISE,
            label: "Lot-wise",
            toolTip: "Deliveries from an identical lot are merged.",
        },
    ];

    private componentActive: boolean = true;

    constructor(private store: Store<fromTracing.State>) {}

    ngOnInit() {
        this.store
            .pipe(
                select(TracingSelectors.getFclData),
                takeWhile(() => this.componentActive),
            )
            .subscribe(
                (fclData) => {
                    this.graphSettings = fclData.graphSettings;
                    this.tracingSettings = fclData.tracingSettings;
                },
                (error) => {
                    throw new Error(`error loading data: ${error}`);
                },
            );
    }

    setNodeSize(nodeSize: number): void {
        this.store.dispatch(
            new tracingActions.SetNodeSizeSOA({ nodeSize: nodeSize }),
        );
    }

    onAdjustEdgeWidthToNodeSizeChanged(
        adjustEdgeWidthToNodeSize: boolean,
    ): void {
        this.store.dispatch(
            new tracingActions.SetAdjustEdgeWidthToNodeSizeSOA({
                adjustEdgeWidthToNodeSize: adjustEdgeWidthToNodeSize,
            }),
        );
    }

    onSetEdgeWidth(edgeWidth: number): void {
        this.store.dispatch(
            new tracingActions.SetEdgeWidthSOA({ edgeWidth: edgeWidth }),
        );
    }

    setFontSize(fontSize: number): void {
        this.store.dispatch(
            new tracingActions.SetFontSizeSOA({ fontSize: fontSize }),
        );
    }

    setMergeDeliveriesType(mergeDeliveriesType: MergeDeliveriesType) {
        this.store.dispatch(
            new tracingActions.SetMergeDeliveriesTypeSOA({
                mergeDeliveriesType: mergeDeliveriesType,
            }),
        );
    }

    setCrossContTraceType(crossContTraceType: CrossContTraceType) {
        this.store.dispatch(
            new tracingActions.SetCrossContTraceTypeSOA({
                crossContTraceType: crossContTraceType,
            }),
        );
    }

    showLegend(showLegend: boolean) {
        this.store.dispatch(new tracingActions.ShowLegendSOA(showLegend));
    }

    showMergedDeliveriesCounts(showMergedDeliveriesCounts: boolean) {
        this.store.dispatch(
            new tracingActions.ShowMergedDeliveriesCountsSOA({
                showMergedDeliveriesCounts: showMergedDeliveriesCounts,
            }),
        );
    }

    showZoom(showZoom: boolean) {
        this.store.dispatch(new tracingActions.ShowZoomSOA(showZoom));
    }

    onFitGraphToVisibleAreaChange(fitGraphToVisibleArea: boolean) {
        this.store.dispatch(
            new tracingActions.SetFitGraphToVisibleAreaSOA({
                fitGraphToVisibleArea: fitGraphToVisibleArea,
            }),
        );
    }

    onGeojsonBorderColorChange(color: Color) {
        this.store.dispatch(
            new tracingActions.SetGeojsonBorderColorSOA({ color: color }),
        );
    }

    onGeojsonBorderWidthChange(borderWidth: number): void {
        this.store.dispatch(
            new tracingActions.SetGeojsonBorderWidthSOA({ width: borderWidth }),
        );
    }

    ngOnDestroy() {
        this.componentActive = false;
    }
}
