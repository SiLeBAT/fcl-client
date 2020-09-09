import { Component, ElementRef, ViewChild, OnDestroy, Input, Output, AfterViewInit, EventEmitter, DoCheck, OnChanges, SimpleChanges } from '@angular/core';

import {
    LegendInfo,
    Position,
    Size,
    Layout,
    PositionMap
} from '../../../data.model';
import * as _ from 'lodash';
import { CyGraphType } from '../../graph.model';
import { CyGraph, GraphData, GraphEventType, SelectedGraphElements } from './cy-graph';
import { StyleConfig } from './cy-style';

export interface LayoutOnlyChange {
    layout: Layout;
}
interface PositionChange {
    nodePositions: PositionMap;
}

export type LayoutChange = LayoutOnlyChange | PositionChange | (LayoutOnlyChange & PositionChange);

@Component({
    selector: 'fcl-graph-view',
    templateUrl: './graph-view.component.html',
    styleUrls: ['./graph-view.component.scss']
})
export class GraphViewComponent implements OnDestroy, AfterViewInit, DoCheck, OnChanges {

    private ngAfterViewInitPassed = false;
    private inputProcessed: boolean = true;
    private cyGraph_: CyGraph;

    @ViewChild('graph', { static: true }) graphElement: ElementRef;

    @Input() graphData: GraphData;
    @Input() styleConfig: StyleConfig;

    @Input() showZoom: boolean;
    @Input() showLegend: boolean;
    @Input() legendInfo: LegendInfo;
    @Input() cyGraphType: CyGraphType;

    @Output() layoutChange = new EventEmitter<LayoutChange>();
    @Output() panChange = new EventEmitter<Position>();
    @Output() selectionChange = new EventEmitter<SelectedGraphElements>();

    get zoomPercentage(): number {
        return this.cyGraph_ ? this.cyGraph_.zoomPercentage : 0.5;
    }

    constructor(public elementRef: ElementRef) {}

    ngOnChanges(changes: SimpleChanges) {
        this.inputProcessed = false;
    }

    ngDoCheck(): void {
        if (!this.inputProcessed) {
            this.checkGraph();
        }
    }

    /** --- life cycle hooks */

    ngAfterViewInit(): void {
        this.ngAfterViewInitPassed = true;
        console.log('GraphView.ngAfterViewInit entered ... (Size:' + JSON.stringify(this.getSize()) + ')');
        this.checkGraph();
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

    onZoomReset(): void {
        if (this.cyGraph_) {
            this.cyGraph_.resetZoom();
        }
    }

    onZoomSlided(value: string) {
        if (this.cyGraph_) {
            this.cyGraph_.zoomPercentage = +value;
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

    private onLayoutChange(): void {
        this.layoutChange.emit({
            layout: this.graphData.layout !== this.cyGraph_.layout ? this.cyGraph_.layout : undefined,
            nodePositions: this.graphData.nodePositions !== this.cyGraph_.data.nodePositions ? this.cyGraph_.data.nodePositions : undefined
        });
    }

    private onPanChange(): void {
        this.panChange.emit(this.cyGraph_.pan);
    }

    private onSelectionChange(): void {
        this.selectionChange.emit(this.cyGraph_.data.selectedElements);
    }

    private onContextMenuRequest(): void {}

    private checkGraph(): void {
        if (this.ngAfterViewInitPassed) {
            if (!this.inputProcessed) {
                if (this.graphData && this.styleConfig) {
                    if (this.cyGraph_ && !this.graphData.layout) {
                        this.cyGraph_.destroy();
                        this.cyGraph_ = undefined;
                    }
                    if (!this.cyGraph_) {
                        this.cyGraph_ = new CyGraph(this.graphElement.nativeElement, this.graphData, this.styleConfig, { name: 'random' });
                        this.cyGraph_.registerListener(GraphEventType.LAYOUT_CHANGE, () => this.onLayoutChange());
                        this.cyGraph_.registerListener(GraphEventType.PAN_CHANGE, () => this.onPanChange());
                        this.cyGraph_.registerListener(GraphEventType.SELECTION_CHANGE, () => this.onSelectionChange());
                        this.cyGraph_.registerListener(GraphEventType.CONTEXT_MENU_REQUEST, () => this.onContextMenuRequest());
                        this.onLayoutChange();
                    } else if (this.graphData !== this.cyGraph_.data || this.styleConfig !== this.cyGraph_.style) {
                        this.cyGraph_.updateGraph(this.graphData, this.styleConfig);
                    }
                } else if (this.cyGraph_) {
                    this.cyGraph_.destroy();
                    this.cyGraph_ = undefined;
                }
                this.inputProcessed = true;
            }
        }
    }
}
