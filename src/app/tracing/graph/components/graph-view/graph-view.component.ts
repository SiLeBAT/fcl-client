import { Component, ElementRef, ViewChild, OnDestroy, Input, Output, AfterViewInit, EventEmitter, DoCheck, OnChanges, SimpleChanges } from '@angular/core';

import {
    LegendInfo,
    Size
} from '../../../data.model';
import * as _ from 'lodash';
import { CyGraphType } from '../../graph.model';
import { CyGraph, StyleConfig, GraphData, GraphEventType } from '../../cy-graph';

@Component({
    selector: 'fcl-graph-view',
    templateUrl: './graph-view.component.html',
    styleUrls: ['./graph-view.component.scss']
})
export class GraphViewComponent implements OnDestroy, AfterViewInit, DoCheck, OnChanges {

    // private componentIsActive = false;
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

    @Output() graphEvent = new EventEmitter();

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

    // ngOnInit() {
    //     this.componentIsActive = true;
    // }

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

    private onLayoutChange(): void {}
    private onPanChange(): void {}
    private onSelectionChange(): void {}
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
                        this.cyGraph_.registerListener(GraphEventType.LAYOUT_CHANGE, () => this.onLayoutChange);
                        this.cyGraph_.registerListener(GraphEventType.PAN_CHANGE, () => this.onPanChange);
                        this.cyGraph_.registerListener(GraphEventType.SELECTION_CHANGE, () => this.onSelectionChange);
                        this.cyGraph_.registerListener(GraphEventType.CONTEXT_MENU_REQUEST, () => this.onContextMenuRequest);
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
