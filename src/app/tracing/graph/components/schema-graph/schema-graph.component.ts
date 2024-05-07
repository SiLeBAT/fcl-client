import { Component, ElementRef, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import html2canvas from 'html2canvas';
import { GraphType, LegendInfo, SchemaGraphState } from '../../../data.model';
import * as _ from 'lodash';
import { Action, Store } from '@ngrx/store';
import { ContextMenuRequestInfo, GraphServiceData } from '../../graph.model';
import { GraphService } from '../../graph.service';
import { AlertService } from '@app/shared/services/alert.service';
import { map } from 'rxjs/operators';
import { GraphDataChange, GraphViewComponent } from '../graph-view/graph-view.component';
import { CyConfig, GraphData } from '../../cy-graph/cy-graph';
import { ContextMenuViewComponent } from '../context-menu/context-menu-view.component';
import { ContextMenuService, LayoutAction, LayoutActionTypes } from '../../context-menu.service';
import { State } from '@app/tracing/state/tracing.reducers';
import { SetSchemaGraphLayoutSOA } from '@app/tracing/state/tracing.actions';
import { getGraphType, selectSchemaGraphState, getShowLegend, getShowZoom, getStyleConfig, getFitGraphToVisibleArea } from '@app/tracing/state/tracing.selectors';
import { SchemaGraphService } from '../../schema-graph.service';
import { DialogActionsComponent, DialogActionsData } from '@app/tracing/dialog/dialog-actions/dialog-actions.component';
import { MatLegacyDialog as MatDialog, MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';
import { optInGate } from '@app/tracing/shared/rxjs-operators';
import { FocusGraphElementSSA, SetSelectedGraphElementsMSA, TracingActionTypes, SetStationPositionsAndLayoutMSA } from '@app/tracing/tracing.actions';
import { Actions, ofType } from '@ngrx/effects';

@Component({
    selector: 'fcl-schema-graph',
    templateUrl: './schema-graph.component.html',
    styleUrls: ['./schema-graph.component.scss']
})
export class SchemaGraphComponent implements OnInit, OnDestroy {

    private static readonly LAYOUT_RUNNING = 'Layout running ...';
    private static readonly STOP_LAYOUTING = 'Stop';
    private static readonly MIN_ZOOM = 0.001;
    private static readonly MAX_ZOOM = 100.0;

    @ViewChild('contextMenu', { static: true }) contextMenu: ContextMenuViewComponent;
    @ViewChild('graph', { static: true }) graphViewComponent: GraphViewComponent;

    private graphType$ = this.store.select(getGraphType);
    isGraphActive$ = this.graphType$.pipe(map(graphType => graphType === GraphType.GRAPH));
    showZoom$ = this.store.select(getShowZoom).pipe(optInGate(this.isGraphActive$, true));
    showLegend$ = this.store.select(getShowLegend).pipe(optInGate(this.isGraphActive$, true));
    styleConfig$ = this.store.select(getStyleConfig).pipe(optInGate(this.isGraphActive$, true));
    fitGraphToVisibleArea$ = this.store.select(getFitGraphToVisibleArea);

    private focusElementSubscription: Subscription | null = null;
    private graphStateSubscription: Subscription | null = null;

    private cachedState: SchemaGraphState | null = null;
    private sharedGraphData: GraphServiceData | null = null;
    private schemaGraphData: GraphData | null = null;
    private legendInfo_: LegendInfo | null = null;
    private cyConfig_: CyConfig = {
        minZoom: SchemaGraphComponent.MIN_ZOOM,
        maxZoom: SchemaGraphComponent.MAX_ZOOM
    };

    private asyncRelayoutingDialog: MatDialogRef<DialogActionsComponent, any> | null = null;

    constructor(
        private actions$: Actions,
        private store: Store<State>,
        public elementRef: ElementRef,
        private dialogService: MatDialog,
        private graphService: GraphService,
        private schemaGraphService: SchemaGraphService,
        private contextMenuService: ContextMenuService,
        private alertService: AlertService
    ) {}

    ngOnInit() {

        this.graphStateSubscription = this.store
            .select(selectSchemaGraphState)
            .pipe(optInGate(this.isGraphActive$, true))
            .subscribe(
                graphState => this.applyState(graphState),
                err => this.alertService.error(`getGisGraphData store subscription failed: ${err}`)
            );

        this.focusElementSubscription = this.actions$
            .pipe(ofType<FocusGraphElementSSA>(TracingActionTypes.FocusGraphElementSSA))
            .pipe(optInGate(this.isGraphActive$, false))
            .subscribe(
                action => this.graphViewComponent.focusElement(action.payload.elementId),
                err => this.alertService.error(`focusElement subscription failed: ${err}`)
            );
    }

    ngOnDestroy() {
        if (this.graphStateSubscription) {
            this.graphStateSubscription.unsubscribe();
            this.graphStateSubscription = null;
        }
        if (this.focusElementSubscription) {
            this.focusElementSubscription.unsubscribe();
            this.focusElementSubscription = null;
        }
    }

    async getCanvas(): Promise<HTMLCanvasElement> {
        return html2canvas(this.elementRef.nativeElement);
    }

    onContextMenuRequest(requestInfo: ContextMenuRequestInfo): void {
        if (this.sharedGraphData) {
            const menuData = this.contextMenuService.getMenuData(
                requestInfo.hoverContext,
                this.sharedGraphData,
                this.graphViewComponent.getLayoutOptions(
                    requestInfo.hoverContext.edgeId === undefined && requestInfo.hoverContext.nodeId === undefined ?
                        this.schemaGraphData!.nodeData.map(n => n.id) :
                        this.contextMenuService.getContextElements(requestInfo.hoverContext, this.sharedGraphData).nodeIds
                )
            );
            this.contextMenu.open(requestInfo.position, menuData);
        }
    }

    onContextMenuSelect(action: Action): void {
        if (action) {
            if (action.type === LayoutActionTypes.LayoutAction) {
                const layoutAction: LayoutAction = action as LayoutAction;
                const asyncStopCallback = this.graphViewComponent.runLayoutManager(
                    layoutAction.payload.layoutName,
                    layoutAction.payload.nodeIds
                );
                if (asyncStopCallback !== null) {
                    this.openAsyncRelayoutingDialog(asyncStopCallback);
                }
            } else {
                this.store.dispatch(action);
            }
        }
    }

    onGraphDataChange(graphDataChange: GraphDataChange): void {
        if (this.cachedState) {
            if (this.asyncRelayoutingDialog !== null) {
                this.asyncRelayoutingDialog.close();
            }
            if (graphDataChange.nodePositions) {
                this.store.dispatch(new SetStationPositionsAndLayoutMSA({
                    stationPositions: this.schemaGraphService.convertNodePosToStationPositions(
                        graphDataChange.nodePositions,
                        this.cachedState,
                        this.schemaGraphData!
                    ),
                    layout: graphDataChange.layout
                }));
            }
            if (graphDataChange.layout) {
                this.store.dispatch(new SetSchemaGraphLayoutSOA({ layout: graphDataChange.layout }));
            }
            if (graphDataChange.selectionChange) {
                this.store.dispatch(new SetSelectedGraphElementsMSA({
                    selectedElements: graphDataChange.selectionChange.selectedElements,
                    maintainOffGraphSelection: graphDataChange.selectionChange.isShiftSelection
                }));
            }
        }
    }

    get graphData(): GraphData | null {
        return this.schemaGraphData;
    }

    get legendInfo(): LegendInfo | null {
        return this.legendInfo_;
    }

    get cyConfig(): CyConfig {
        return this.cyConfig_;
    }

    private applyState(newState: SchemaGraphState) {
        this.sharedGraphData = this.graphService.getData(newState);
        this.schemaGraphData = this.schemaGraphService.getData(newState);
        this.legendInfo_ = this.sharedGraphData.legendInfo ?? null;
        this.cachedState = newState;
    }

    private openAsyncRelayoutingDialog(stopCallBack: (() => void)): void {
        const layoutDialogData: DialogActionsData = {
            title: SchemaGraphComponent.LAYOUT_RUNNING,
            actions: [{ name: SchemaGraphComponent.STOP_LAYOUTING, action: () => stopCallBack() }]
        };
        this.asyncRelayoutingDialog = this.dialogService.open(DialogActionsComponent, {
            disableClose: true,
            data: layoutDialogData
        });
    }
}
