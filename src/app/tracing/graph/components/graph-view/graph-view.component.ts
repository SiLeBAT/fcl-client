import {
    Component,
    ElementRef,
    ViewChild,
    OnDestroy,
    Input,
    Output,
    EventEmitter,
    OnChanges,
    ChangeDetectionStrategy,
    SimpleChanges,
} from "@angular/core";
import { Size, Layout, PositionMap } from "../../../data.model";
import {
    ContextMenuRequestInfo,
    EdgeId,
    NodeId,
    SelectedGraphElements,
} from "../../graph.model";
import { StyleConfig } from "../../cy-graph/cy-style";
import { VirtualZoomCyGraph } from "../../cy-graph/virtual-zoom-cy-graph";
import {
    GraphEventType,
    InteractiveCyGraph,
    LayoutOption,
} from "../../cy-graph/interactive-cy-graph";
import {
    CyConfig,
    GraphData,
    LayoutConfig,
    LayoutName,
} from "../../cy-graph/cy-graph";
import {
    LAYOUT_FARM_TO_FORK,
    LAYOUT_FRUCHTERMAN,
    LAYOUT_PRESET,
} from "../../cy-graph/cy.constants";
import { isPosMapEmpty } from "../../cy-graph/shared-utils";
import { getLayoutConfig } from "../../cy-graph/layouting-utils";

export interface GraphSelectionChange {
    selectedElements: SelectedGraphElements;
    isShiftSelection: boolean;
}
export interface GraphDataChange {
    layout?: Layout;
    nodePositions?: PositionMap;
    selectionChange?: GraphSelectionChange;
}

@Component({
    selector: "fcl-graph-view",
    templateUrl: "./graph-view.component.html",
    styleUrls: ["./graph-view.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraphViewComponent implements OnDestroy, OnChanges {
    private static readonly MAX_FARM_TO_FORK_NODE_COUNT = 100;

    private cyGraph_: InteractiveCyGraph | null = null;

    @ViewChild("graph", { static: true }) graphElement: ElementRef;

    @Input() graphData: GraphData | null = null;
    @Input() styleConfig: StyleConfig | null = null;
    @Input() cyConfig: CyConfig = {};

    @Input() showZoom: boolean = false;
    @Input() fitGraphToVisibleArea = false;

    @Output() graphDataChange = new EventEmitter<GraphDataChange>();
    @Output() contextMenuRequest = new EventEmitter<ContextMenuRequestInfo>();

    get zoomPercentage(): number | undefined {
        return this.cyGraph_ ? this.cyGraph_.zoomPercentage : undefined;
    }

    constructor(public elementRef: ElementRef) {}

    /** --- life cycle hooks */

    ngOnChanges(changes: SimpleChanges) {
        if (
            changes.graphData !== undefined ||
            changes.styleConfig !== undefined
        ) {
            this.processGraphInputUpdate();
        }
    }

    ngOnDestroy() {
        this.cleanCyGraph();
    }

    private cleanCyGraph(): void {
        if (this.cyGraph_) {
            this.cyGraph_.destroy();
            this.cyGraph_ = null;
        }
    }

    onZoomIn(): void {
        if (this.cyGraph_) {
            this.cyGraph_.zoomIn();
        }
    }

    onZoomOut(): void {
        if (this.cyGraph_) {
            this.cyGraph_.zoomOut();
        }
    }

    onZoomFit(): void {
        if (this.cyGraph_) {
            this.cyGraph_.zoomFit(this.fitGraphToVisibleArea);
        }
    }

    onZoomSlide(value: string): void {
        if (this.cyGraph_) {
            this.cyGraph_.zoomToPercentage(Number(value));
        }
    }

    onComponentResized(): void {
        if (this.cyGraph_ && this.isSizePositive()) {
            this.cyGraph_.updateSize();
        }
    }

    runLayoutManager(
        layoutName: LayoutName,
        nodesToLayout: NodeId[],
    ): null | (() => void) {
        return this.cyGraph_ === null
            ? null
            : this.cyGraph_.runLayout(
                  layoutName,
                  nodesToLayout,
                  this.fitGraphToVisibleArea,
              );
    }

    getLayoutOptions(nodesToLayout: NodeId[]): LayoutOption[] | null {
        return this.cyGraph_ === null
            ? null
            : this.cyGraph_.getLayoutOptions(nodesToLayout);
    }

    focusElement(elementId: NodeId | EdgeId): void {
        if (this.cyGraph_) {
            this.cyGraph_.focusElement(elementId);
        }
    }

    isGraphNonEmpty(): boolean {
        const nodeCount = this.graphData?.nodeData.length ?? 0;
        const ghostCount = this.graphData?.ghostData?.nodeData.length ?? 0;
        return nodeCount + ghostCount > 0;
    }

    isGraphFullyInvisible(): boolean {
        const nodeCount = this.graphData?.nodeData.length ?? 0;
        const ghostCount = this.graphData?.ghostData?.nodeData.length ?? 0;
        return nodeCount === 0 && ghostCount > 0;
    }

    private isGraphChanged() {
        return (
            this.graphData !== this.cyGraph_?.data ||
            this.styleConfig !== this.cyGraph_.style
        );
    }

    private isSizePositive(): boolean {
        const size = this.getSize();
        return size.width > 0 && size.height > 0;
    }

    private getSize(): Size {
        const size: Size =
            this.elementRef.nativeElement.getBoundingClientRect();
        return {
            width: size.width,
            height: size.height,
        };
    }

    private onGraphDataChange(): void {
        this.graphDataChange.emit({
            layout:
                this.graphData!.layout !== this.cyGraph_!.layout
                    ? this.cyGraph_!.layout
                    : undefined,
            nodePositions:
                this.graphData!.nodePositions !== this.cyGraph_!.nodePositions
                    ? this.cyGraph_!.nodePositions
                    : undefined,
        });
    }

    private onGraphSelectionChange(isShiftSelection: boolean): void {
        if (
            this.graphData!.selectedElements !== this.cyGraph_!.selectedElements
        ) {
            this.graphDataChange.emit({
                selectionChange: {
                    selectedElements: this.cyGraph_!.selectedElements,
                    isShiftSelection: isShiftSelection,
                },
            });
        }
    }

    private onContextMenuRequest(info: ContextMenuRequestInfo): void {
        this.contextMenuRequest.emit(info);
    }

    private createPresetLayoutConfig(viewport: Layout | null): LayoutConfig {
        return {
            ...(viewport ?? {}),
            name: LAYOUT_PRESET,
            fit: viewport === null,
        };
    }

    private createLayoutConfig(graphData: GraphData): LayoutConfig {
        if (isPosMapEmpty(graphData.nodePositions)) {
            return graphData.nodeData.length >
                GraphViewComponent.MAX_FARM_TO_FORK_NODE_COUNT
                ? getLayoutConfig(LAYOUT_FRUCHTERMAN)
                : getLayoutConfig(LAYOUT_FARM_TO_FORK);
        } else {
            return this.createPresetLayoutConfig(graphData.layout);
        }
    }

    private createCyGraph(
        graphData: GraphData,
        styleConfig: StyleConfig,
    ): void {
        this.cyGraph_ = new VirtualZoomCyGraph(
            this.graphElement.nativeElement,
            graphData,
            styleConfig,
            this.createLayoutConfig(graphData),
            this.cyConfig,
            this.fitGraphToVisibleArea,
        );

        this.cyGraph_.registerListener(GraphEventType.LAYOUT_CHANGE, () =>
            this.onGraphDataChange(),
        );
        this.cyGraph_.registerListener(
            GraphEventType.SELECTION_CHANGE,
            (shift: boolean) => this.onGraphSelectionChange(shift),
        );
        this.cyGraph_.registerListener(
            GraphEventType.CONTEXT_MENU_REQUEST,
            (info: ContextMenuRequestInfo) => this.onContextMenuRequest(info),
        );

        if (this.graphData !== this.cyGraph_.data) {
            setTimeout(() => this.onGraphDataChange(), 0);
        }
    }

    private processGraphInputUpdate(): void {
        if (
            this.cyGraph_ &&
            (!this.graphData || !this.styleConfig || !this.graphData.layout)
        ) {
            // clean cyGraph if graphData, styleConfig, or the viewport(layout) is unknown.
            this.cleanCyGraph();
        }

        if (!this.graphData || !this.styleConfig) {
            return;
        }

        if (!this.cyGraph_ && this.isGraphNonEmpty()) {
            this.createCyGraph(this.graphData, this.styleConfig);
            return;
        }

        if (this.cyGraph_ && this.isGraphChanged()) {
            this.cyGraph_.updateGraph(this.graphData, this.styleConfig);
            return;
        }
    }
}
