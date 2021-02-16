import {
    Component, ElementRef, ViewChild, OnDestroy, Input, Output,
    EventEmitter, OnChanges, ChangeDetectionStrategy
} from '@angular/core';

import { Size, Layout, PositionMap } from '../../../data.model';
import _ from 'lodash';
import { ContextMenuRequestInfo, SelectedGraphElements } from '../../graph.model';
import { StyleConfig } from '../../cy-graph/cy-style';
import { VirtualZoomCyGraph } from '../../cy-graph/virtual-zoom-cy-graph';
import { GraphEventType, InteractiveCyGraph } from '../../cy-graph/interactive-cy-graph';
import { GraphData, LayoutConfig } from '../../cy-graph/cy-graph';
import { LAYOUT_FARM_TO_FORK, LAYOUT_FRUCHTERMAN, LAYOUT_GRID, LAYOUT_PRESET, PRESET_LAYOUT_NAME } from '../../cy-graph/cy.constants';
import { isPosMapEmpty } from '../../cy-graph/shared-utils';

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

    private static readonly MIN_ZOOM = 0.1;
    private static readonly MAX_ZOOM = 100.0;

    private cyGraph_: InteractiveCyGraph = null;

    @ViewChild('graph', { static: true }) graphElement: ElementRef;

    @Input() graphData: GraphData;
    @Input() styleConfig: StyleConfig;

    @Input() showZoom: boolean;

    @Output() graphDataChange = new EventEmitter<GraphDataChange>();
    @Output() contextMenuRequest = new EventEmitter<ContextMenuRequestInfo>();

    get zoomPercentage(): number | undefined {
        return this.cyGraph_ ? this.cyGraph_.zoomPercentage : undefined;
    }

    constructor(public elementRef: ElementRef) {}

    /** --- life cycle hooks */

    ngOnChanges() {
        this.processInputDataUpdate();
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
            name: PRESET_LAYOUT_NAME,
            fit: viewport === null
        };
    }

    private createCyGraph(): void {
        const layoutConfig: LayoutConfig =
            isPosMapEmpty(this.graphData.nodePositions) ?
            { name: LAYOUT_GRID } :
            this.createPresetLayoutConfig(this.graphData.layout);

        this.cyGraph_ = new VirtualZoomCyGraph(
            this.graphElement.nativeElement,
            this.graphData,
            this.styleConfig,
            layoutConfig,
            {
                minZoom: GraphViewComponent.MIN_ZOOM,
                maxZoom: GraphViewComponent.MAX_ZOOM,
                autoungrabify: true
            }
        );
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

    private processInputDataUpdate(): void {
        if (this.graphData && this.styleConfig) {
            if (this.cyGraph_ && !this.graphData.layout) {
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
