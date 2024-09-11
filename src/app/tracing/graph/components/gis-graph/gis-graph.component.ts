import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  OnDestroy,
} from '@angular/core';
import {Subscription} from 'rxjs';
import html2canvas from 'html2canvas';
import {
  GraphType,
  Layout,
  GisGraphState,
  LegendDisplayEntry,
} from '../../../data.model';
import {Action, Store} from '@ngrx/store';
import {ContextMenuRequestInfo, GraphServiceData} from '../../graph.model';
import {GraphService} from '../../graph.service';
import {AlertService} from '@app/shared/services/alert.service';
import {map} from 'rxjs/operators';
import {
  GraphDataChange,
  GraphViewComponent,
} from '../graph-view/graph-view.component';
import {CyConfig, GraphData} from '../../cy-graph/cy-graph';
import {GisPositioningService} from '../../gis-positioning.service';
import {ContextMenuViewComponent} from '../context-menu/context-menu-view.component';
import {ContextMenuService} from '../../context-menu.service';
import {State} from '@app/tracing/state/tracing.reducers';
import {SetGisGraphLayoutSOA} from '@app/tracing/state/tracing.actions';
import {
  selectGisGraphState,
  getGraphType,
  getMapConfig,
  getShowLegend,
  getShowZoom,
  getStyleConfig,
  getFitGraphToVisibleArea,
} from '@app/tracing/state/tracing.selectors';
import {BoundaryRect} from '@app/tracing/util/geometry-utils';
import {optInGate} from '@app/tracing/shared/rxjs-operators';
import {
  FocusGraphElementSSA,
  SetSelectedGraphElementsMSA,
  TracingActionTypes,
} from '@app/tracing/tracing.actions';
import {Actions, ofType} from '@ngrx/effects';

@Component({
  selector: 'fcl-gis-graph',
  templateUrl: './gis-graph.component.html',
  styleUrls: ['./gis-graph.component.scss'],
})
export class GisGraphComponent implements OnInit, OnDestroy {
  private static readonly MIN_ZOOM = 0.1;
  private static readonly MAX_ZOOM = 16000;
  private static readonly DEFAULT_SCREEN_BOUNDARY_WIDTH = 20;

  @ViewChild('contextMenu', {static: true})
  contextMenu: ContextMenuViewComponent;
  @ViewChild('graph', {static: true}) graphViewComponent: GraphViewComponent;

  graphType$ = this.store.select(getGraphType);
  isGraphActive$ = this.graphType$.pipe(
    map(graphType => graphType === GraphType.GIS)
  );
  showZoom$ = this.store
    .select(getShowZoom)
    .pipe(optInGate(this.isGraphActive$, true));
  showLegend$ = this.store
    .select(getShowLegend)
    .pipe(optInGate(this.isGraphActive$, true));
  mapConfig$ = this.store.select(getMapConfig);
  styleConfig$ = this.store
    .select(getStyleConfig)
    .pipe(optInGate(this.isGraphActive$, true));
  fitGraphToVisibleArea$ = this.store.select(getFitGraphToVisibleArea);

  unknownLatLonRectBorderWidth =
    GisGraphComponent.DEFAULT_SCREEN_BOUNDARY_WIDTH;

  private focusElementSubscription: Subscription | null = null;
  private graphStateSubscription: Subscription | null = null;

  private sharedGraphData: GraphServiceData | null = null;
  private graphData_: GraphData | null = null;
  private unknownLatLonRect_: BoundaryRect | null = null;
  private legendInfo_: LegendDisplayEntry[] | null = null;
  private cyConfig_: CyConfig = {
    minZoom: GisGraphComponent.MIN_ZOOM,
    maxZoom: GisGraphComponent.MAX_ZOOM,
    autoungrabify: true,
  };

  constructor(
    private actions$: Actions,
    private store: Store<State>,
    public elementRef: ElementRef,
    private graphService: GraphService,
    private gisPositioningService: GisPositioningService,
    private contextMenuService: ContextMenuService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.graphStateSubscription = this.store
      .select(selectGisGraphState)
      .pipe(optInGate(this.isGraphActive$, true))
      .subscribe(
        graphState => this.applyState(graphState),
        err =>
          this.alertService.error(
            `getGisGraphData store subscription failed: ${err}`
          )
      );

    this.focusElementSubscription = this.actions$
      .pipe(
        ofType<FocusGraphElementSSA>(TracingActionTypes.FocusGraphElementSSA)
      )
      .pipe(optInGate(this.isGraphActive$, false))
      .subscribe(
        action =>
          this.graphViewComponent.focusElement(action.payload.elementId),
        err =>
          this.alertService.error(`focusElement subscription failed: ${err}`)
      );
  }

  ngOnDestroy() {
    if (this.graphStateSubscription !== null) {
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
        null
      );
      this.contextMenu.open(requestInfo.position, menuData);
    }
  }

  onContextMenuSelect(action: Action): void {
    if (action) {
      this.store.dispatch(action);
    }
  }

  onGraphDataChange(graphDataChange: GraphDataChange): void {
    if (graphDataChange.layout) {
      this.store.dispatch(
        new SetGisGraphLayoutSOA({layout: graphDataChange.layout})
      );
    }
    if (graphDataChange.selectionChange) {
      this.store.dispatch(
        new SetSelectedGraphElementsMSA({
          selectedElements: graphDataChange.selectionChange.selectedElements,
          maintainOffGraphSelection:
            graphDataChange.selectionChange.isShiftSelection,
        })
      );
    }
  }

  get graphData(): GraphData | null {
    return this.graphData_;
  }

  get legendInfo(): LegendDisplayEntry[] | null {
    return this.legendInfo_;
  }

  get unknownLatLonRect(): BoundaryRect | null {
    return this.unknownLatLonRect_;
  }

  get showMissingGisInfoEntry(): boolean {
    return this.unknownLatLonRect !== null;
  }

  get viewport(): Layout | null {
    return this.graphData_ === null ? null : this.graphData_.layout;
  }

  get cyConfig(): CyConfig {
    return this.cyConfig_;
  }

  private applyState(newState: GisGraphState): void {
    this.sharedGraphData = this.graphService.getData(newState);
    const posData = this.gisPositioningService.getPositioningData(
      this.sharedGraphData
    );
    this.unknownLatLonRect_ = posData.unknownLatLonRect;
    this.legendInfo_ = this.sharedGraphData.legendInfo!;
    this.unknownLatLonRectBorderWidth = Math.max(
      posData.unknownLatLonRectModelBorderWidth *
        (newState.layout !== null ? newState.layout.zoom : 0),
      GisGraphComponent.DEFAULT_SCREEN_BOUNDARY_WIDTH
    );

    this.graphData_ = {
      nodeData: this.sharedGraphData.nodeData,
      edgeData: this.sharedGraphData.edgeData,
      propsUpdatedFlag: this.sharedGraphData.nodeAndEdgePropsUpdatedFlag,
      nodePositions: posData.nodePositions,
      layout: newState.layout,
      selectedElements: this.sharedGraphData.selectedElements,
      ghostData:
        this.sharedGraphData.ghostElements == null
          ? null
          : {
              ...this.sharedGraphData.ghostElements,
              posMap: posData.ghostPositions!,
            },
      hoverEdges: this.sharedGraphData.hoverEdges,
    };
  }
}
