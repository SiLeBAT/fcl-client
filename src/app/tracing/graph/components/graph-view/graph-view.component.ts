import { Component, ElementRef, OnInit, ViewChild, OnDestroy, Input, Output, AfterViewInit, EventEmitter } from '@angular/core';
import { ResizeSensor } from 'css-element-queries';

import {
    Layout,
    Position,
    GraphState,
    GraphType,
    LegendInfo,
    StationData,
    DeliveryData,
    MergeDeliveriesType,
    MapType,
    ShapeFileData,
    Size
} from '../../../data.model';
import * as _ from 'lodash';
import { AvailableSpace, CyGraphType } from '../../graph.model';
import { GraphContextMenuComponent } from '../graph-context-menu/graph-context-menu.component';
import { CyGraph } from '../../cy-graph';

@Component({
    selector: 'fcl-graph-view',
    templateUrl: './graph-view.component.html',
    styleUrls: ['./graph-view.component.scss']
})
export class GraphViewComponent implements OnInit, OnDestroy, AfterViewInit {

    private componentIsActive = false;
    private cyGraph_: CyGraph;

    @Input() showZoom: boolean;
    @Input() showLegend: boolean;
    @Input() legendInfo: LegendInfo;
    @Input() cyGraphType: CyGraphType;

    @Output() graphEvent = new EventEmitter();

    get zoomPercentage(): number {
        return 50;
    }

    constructor(
        public elementRef: ElementRef
    ) {}

    /** --- life cycle hooks */

    ngOnInit() {
        this.componentIsActive = true;
    }

    ngAfterViewInit(): void {

    }

    ngOnDestroy() {
        this.componentIsActive = false;
        this.cleanCyGraph();
    }

    private cleanCyGraph(): void {
        if (this.cyGraph_) {
            this.cyGraph_.destroy();
            this.cyGraph_ = null;
        }
    }

    onZoomIn(): void {
        this.cyGraph_.zoomIn();
    }

    onZoomOut(): void {
        this.cyGraph_.zoomOut();
    }

    onZoomReset(): void {
        this.cyGraph_.resetZoom();
    }

    onZoomSlided(value: string) {
        this.cyGraph_.zoom = +value;
    }

    onComponentResized(): void {
        if (this.cyGraph_) {
            const size = this.getSize();
            if (size.width > 0 && size.height > 0) {
                this.cyGraph_.updateSize();
            }
        }
    }

    private getSize(): Size {
        const size: Size = this.elementRef.nativeElement.getBoundingClientRect();
        return {
            width: size.width,
            height: size.height
        };
    }
}
