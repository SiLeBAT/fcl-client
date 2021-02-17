import { Component, ElementRef, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import html2canvas from 'html2canvas';
import { GraphState, GraphType, LegendInfo } from '../../../data.model';
import _ from 'lodash';
import { Action, Store } from '@ngrx/store';
import { ContextMenuRequestInfo, GraphServiceData } from '../../graph.model';
import { GraphService } from '../../graph.service';
import { AlertService } from '@app/shared/services/alert.service';
import { filter } from 'rxjs/operators';
import { GraphDataChange } from '../graph-view/graph-view.component';
import { CyConfig, GraphData } from '../../cy-graph/cy-graph';
import { mapGraphSelectionToFclElementSelection } from '../../graph-utils';
import { GisPositioningService } from '../../gis-positioning.service';
import { ContextMenuViewComponent } from '../context-menu/context-menu-view.component';
import { ContextMenuService } from '../../context-menu.service';
import { State } from '@app/tracing/state/tracing.reducers';
import { SetGisGraphLayoutSOA, SetSelectedElementsSOA } from '@app/tracing/state/tracing.actions';
import { getGisGraphData, getGraphType, getMapConfig, getShowLegend, getShowZoom, getStyleConfig } from '@app/tracing/state/tracing.selectors';
import { BoundaryRect } from '@app/tracing/util/geometry-utils';

@Component({
    selector: 'fcl-gis-graph',
    templateUrl: './gis-graph.component.html',
    styleUrls: ['./gis-graph.component.scss']
})
export class GisGraphComponent implements OnInit, OnDestroy {

    private static readonly MIN_ZOOM = 0.1;
    private static readonly MAX_ZOOM = 100.0;

    @ViewChild('contextMenu', { static: true }) contextMenu: ContextMenuViewComponent;

    private componentIsActive = false;

    showZoom$ = this.store.select(getShowZoom);
    showLegend$ = this.store.select(getShowLegend);
    graphType$ = this.store.select(getGraphType);
    mapConfig$ = this.store.select(getMapConfig);
    styleConfig$ = this.store.select(getStyleConfig);

    private graphStateSubscription: Subscription;
    private graphTypeSubscription: Subscription;

    private sharedGraphData: GraphServiceData | null = null;
    private graphData_: GraphData | null = null;
    private unknownLatLonRect_: BoundaryRect | null = null;
    private legendInfo_: LegendInfo | null = null;
    private cyConfig_: CyConfig = {
        minZoom: GisGraphComponent.MIN_ZOOM,
        maxZoom: GisGraphComponent.MAX_ZOOM,
        autoungrabify: true
    };

    constructor(
        private store: Store<State>,
        public elementRef: ElementRef,
        private graphService: GraphService,
        private gisPositioningService: GisPositioningService,
        private contextMenuService: ContextMenuService,
        private alertService: AlertService
    ) {}

    ngOnInit() {

        this.componentIsActive = true;

        this.graphTypeSubscription = this.graphType$.subscribe(
            type => {
                if (type !== GraphType.GIS) {
                    if (this.graphStateSubscription) {
                        this.graphStateSubscription.unsubscribe();
                        this.graphStateSubscription = null;
                    }
                } else {
                    if (!this.graphStateSubscription) {
                        this.graphStateSubscription = this.store
                            .select(getGisGraphData)
                            .pipe(filter(() => this.componentIsActive))
                            .subscribe(
                                graphState => this.applyState(graphState),
                                err => this.alertService.error(`getGisGraphData store subscription failed: ${err}`)
                            );
                    }
                }
            },
            err => this.alertService.error(`getGraphType store subscription failed: ${err}`)
        );
    }

    ngOnDestroy() {
        this.componentIsActive = false;
        if (this.graphTypeSubscription) {
            this.graphTypeSubscription.unsubscribe();
            this.graphTypeSubscription = null;
        }
        if (this.graphStateSubscription) {
            this.graphStateSubscription.unsubscribe();
            this.graphStateSubscription = null;
        }
    }

    getCanvas(): Promise<HTMLCanvasElement> {
        return html2canvas(this.elementRef.nativeElement);
    }

    onContextMenuRequest(requestInfo: ContextMenuRequestInfo): void {
        const menuData = this.contextMenuService.getMenuData(requestInfo.context, this.sharedGraphData, false);
        this.contextMenu.open(requestInfo.position, menuData);
    }

    onContextMenuSelect(action: Action): void {
        if (action) {
            this.store.dispatch(action);
        }
    }

    onGraphDataChange(graphDataChange: GraphDataChange): void {
        if (graphDataChange.layout) {
            this.store.dispatch(new SetGisGraphLayoutSOA({ layout: graphDataChange.layout }));
        }
        if (graphDataChange.selectedElements) {
            this.store.dispatch(new SetSelectedElementsSOA({
                selectedElements: mapGraphSelectionToFclElementSelection(graphDataChange.selectedElements, this.graphData_)
            }));
        }
    }

    get graphData(): GraphData {
        return this.graphData_;
    }

    get legendInfo(): LegendInfo | null {
        return this.legendInfo_;
    }

    get unknownLatLonRect(): BoundaryRect | null {
        return this.unknownLatLonRect_;
    }

    get showMissingGisInfoEntry(): boolean {
        return this.unknownLatLonRect !== null;
    }

    get cyConfig(): CyConfig {
        return this.cyConfig_;
    }

    private applyState(newState: GraphState) {
        this.sharedGraphData = this.graphService.getData(newState);
        const posData = this.gisPositioningService.getPositioningData(this.sharedGraphData);
        this.unknownLatLonRect_ = posData.unknownLatLonRect;
        this.legendInfo_ = this.sharedGraphData.legendInfo;

        this.graphData_ = {
            nodeData: this.sharedGraphData.nodeData,
            edgeData: this.sharedGraphData.edgeData,
            propsChangedFlag: this.sharedGraphData.propsChangedFlag,
            edgeLabelChangedFlag: this.sharedGraphData.edgeLabelChangedFlag,
            nodePositions: posData.nodePositions,
            layout: newState.layout,
            selectedElements: this.sharedGraphData.selectedElements,
            ghostData:
                this.sharedGraphData.ghostElements == null ?
                null :
                ({
                    ...this.sharedGraphData.ghostElements,
                    posMap: posData.ghostPositions
                }),
            hoverEdges: this.sharedGraphData.hoverEdges
        };
    }
}
