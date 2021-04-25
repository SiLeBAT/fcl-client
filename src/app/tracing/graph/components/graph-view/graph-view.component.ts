import {
    Component, ElementRef, ViewChild, OnDestroy, Input, Output,
    EventEmitter, OnChanges, ChangeDetectionStrategy, SimpleChanges
} from '@angular/core';
import { Size, Layout, PositionMap } from '../../../data.model';
import _ from 'lodash';
import { ContextMenuRequestInfo, NodeId, SelectedGraphElements } from '../../graph.model';
import { StyleConfig } from '../../cy-graph/cy-style';
import { VirtualZoomCyGraph } from '../../cy-graph/virtual-zoom-cy-graph';
import { GraphEventType, InteractiveCyGraph, LayoutOption } from '../../cy-graph/interactive-cy-graph';
import { CyConfig, GraphData, LayoutConfig, LayoutName } from '../../cy-graph/cy-graph';
import { LAYOUT_FARM_TO_FORK, LAYOUT_FRUCHTERMAN, LAYOUT_PRESET } from '../../cy-graph/cy.constants';
import { isPosMapEmpty } from '../../cy-graph/shared-utils';
import { getLayoutConfig } from '../../cy-graph/layouting-utils';
import { AvoidOverlayCyGraph } from '../../cy-graph/avoid-overlay-cy-graph';

export interface GraphDataChange {
    layout?: Layout;
    nodePositions?: PositionMap;
    selectedElements?: SelectedGraphElements;
}

@Component({
    selector: 'fcl-graph-view',
    templateUrl: './graph-view.component.html',
    styleUrls: ['./graph-view.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GraphViewComponent implements OnDestroy, OnChanges {

    private static readonly MAX_FARM_TO_FORK_NODE_COUNT = 100;

    private cyGraph_: InteractiveCyGraph = null;

    @ViewChild('graph', { static: true }) graphElement: ElementRef;

    @Input() graphData: GraphData | null = null;
    @Input() styleConfig: StyleConfig | null = null;
    @Input() cyConfig: CyConfig = {};

    @Input() showZoom: boolean = false;
    @Input() avoidOverlay: boolean = false;

    @Output() graphDataChange = new EventEmitter<GraphDataChange>();
    @Output() contextMenuRequest = new EventEmitter<ContextMenuRequestInfo>();

    get zoomPercentage(): number | undefined {
        return this.cyGraph_ ? this.cyGraph_.zoomPercentage : undefined;
    }

    constructor(public elementRef: ElementRef) {}

    /** --- life cycle hooks */

    ngOnChanges(changes: SimpleChanges) {
        if (changes.graphData !== undefined || changes.styleConfig !== undefined || changes.avoidOverlay) {
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
            this.cyGraph_.zoomFit();
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

    runLayoutManager(layoutName: LayoutName, nodesToLayout: NodeId[]): null | (() => void) {
        return this.cyGraph_ === null ?
            null :
            this.cyGraph_.runLayout(layoutName, nodesToLayout);
    }

    getLayoutOptions(nodesToLayout: NodeId[]): LayoutOption[] | null {
        return this.cyGraph_ === null ? null : this.cyGraph_.getLayoutOptions(nodesToLayout);
    }

    private isSizePositive(): boolean {
        const size = this.getSize();
        return size.width > 0 && size.height > 0;
    }

    private getSize(): Size {
        const size: Size = this.elementRef.nativeElement.getBoundingClientRect();
        return {
            width: size.width,
            height: size.height
        };
    }

    private onGraphDataChange(): void {
        this.graphDataChange.emit({
            layout:
                this.graphData.layout !== this.cyGraph_.layout ?
                this.cyGraph_.layout :
                undefined
            ,
            nodePositions:
                this.graphData.nodePositions !== this.cyGraph_.nodePositions ?
                this.cyGraph_.nodePositions :
                undefined
            ,
            selectedElements:
                this.graphData.selectedElements !== this.cyGraph_.selectedElements ?
                this.cyGraph_.selectedElements :
                undefined
        });
    }

    private onContextMenuRequest(info: ContextMenuRequestInfo): void {
        this.contextMenuRequest.emit(info);
    }

    private createPresetLayoutConfig(viewport: Layout | null): LayoutConfig {
        return {
            ...(viewport === null ? {} : viewport),
            name: LAYOUT_PRESET,
            fit: viewport === null
        };
    }

    private createLayoutConfig(): LayoutConfig {
        if (isPosMapEmpty(this.graphData.nodePositions)) {
            return this.graphData.nodeData.length > GraphViewComponent.MAX_FARM_TO_FORK_NODE_COUNT ?
                getLayoutConfig(LAYOUT_FRUCHTERMAN) :
                getLayoutConfig(LAYOUT_FARM_TO_FORK);
        } else {
            return this.createPresetLayoutConfig(this.graphData.layout);
        }
    }

    private createCyGraph(): void {
        if (this.avoidOverlay) {
            this.cyGraph_ = new AvoidOverlayCyGraph(
                this.graphElement.nativeElement,
                this.graphData,
                this.styleConfig,
                this.createLayoutConfig(),
                this.cyConfig
            );
        } else {
            this.cyGraph_ = new VirtualZoomCyGraph(
                this.graphElement.nativeElement,
                this.graphData,
                this.styleConfig,
                this.createLayoutConfig(),
                this.cyConfig
            );
        }

        this.cyGraph_.registerListener(GraphEventType.LAYOUT_CHANGE, () => this.onGraphDataChange());
        this.cyGraph_.registerListener(GraphEventType.SELECTION_CHANGE, () => this.onGraphDataChange());
        this.cyGraph_.registerListener(
            GraphEventType.CONTEXT_MENU_REQUEST,
            (info: ContextMenuRequestInfo) => this.onContextMenuRequest(info)
        );

        if (this.graphData !== this.cyGraph_.data) {
            setTimeout(() => this.onGraphDataChange(), 0);
        }
    }

    private processGraphInputUpdate(): void {
        if (this.graphData && this.styleConfig) {
            if (this.cyGraph_ && (!this.graphData.layout || this.avoidOverlay !== this.cyGraph_ instanceof AvoidOverlayCyGraph)) {
                // clean cyGraph if the viewport(layout) is unknwon or
                // avoidOverlay does not match graph type
                this.cleanCyGraph();
            }
            if (!this.cyGraph_) {
                this.createCyGraph();
            } else if (this.graphData !== this.cyGraph_.data || this.styleConfig !== this.cyGraph_.style) {
                this.cyGraph_.updateGraph(this.graphData, this.styleConfig);
            }
        } else if (this.cyGraph_) {
            this.cleanCyGraph();
        }
    }

}
