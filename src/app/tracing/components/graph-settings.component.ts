import { BasicGraphState, DataServiceData } from './../data.model';
import { DataService } from './../services/data.service';
import { Component, OnInit, OnDestroy, ViewChildren, QueryList } from '@angular/core';
import { Constants } from '../util/constants';
import * as TracingSelectors from '../state/tracing.selectors';
import * as fromTracing from '../state/tracing.reducers';
import * as tracingActions from '../state/tracing.actions';
import { Store, select } from '@ngrx/store';
import { takeWhile } from 'rxjs/operators';
import { FclData, GraphSettings } from '../data.model';
import { Utils as UIUtils } from '../util/ui-utils';
import { Observable, combineLatest } from 'rxjs';

@Component({
    selector: 'fcl-graph-settings',
    templateUrl: './graph-settings.component.html',
    styleUrls: ['./graph-settings.component.scss']
})
export class GraphSettingsComponent implements OnInit, OnDestroy {
    graphTypes = Constants.GRAPH_TYPES;
    graphSettings: GraphSettings;
    sizes = Constants.SIZES;
    hasGisInfo = false;
    private componentActive: boolean = true;

    constructor(private store: Store<fromTracing.State>, private dataService: DataService) {}

    ngOnInit() {

        const fclData$: Observable<FclData> = this.store
            .pipe(
                select(TracingSelectors.getFclData)
        );

        const basicGraphData$: Observable<BasicGraphState> = this.store
            .pipe(
                select(TracingSelectors.getBasicGraphData)
        );

        combineLatest([
            fclData$,
            basicGraphData$
        ]).pipe(
            takeWhile(() => this.componentActive)
        ).subscribe(
            ([fclData, basicGraphData]) => {
                this.graphSettings = fclData.graphSettings;

                const dataServiceData: DataServiceData = this.dataService.getData(basicGraphData);
                this.hasGisInfo = UIUtils.hasVisibleStationsWithGisInfo(dataServiceData.stations);
            },
            error => {
                throw new Error(`error loading data: ${error}`);
            }
        );
    }

    setGraphType() {
        this.store.dispatch(new tracingActions.SetGraphTypeSOA(this.graphSettings.type));
    }

    setNodeSize() {
        this.store.dispatch(new tracingActions.SetNodeSizeSOA(this.graphSettings.nodeSize));
    }

    setFontSize() {
        this.store.dispatch(new tracingActions.SetFontSizeSOA(this.graphSettings.fontSize));
    }

    mergeDeliveries() {
        this.store.dispatch(new tracingActions.MergeDeliveriesSOA(this.graphSettings.mergeDeliveries));
    }

    showLegend() {
        this.store.dispatch(new tracingActions.ShowLegendSOA(this.graphSettings.showLegend));
    }

    showZoom() {
        this.store.dispatch(new tracingActions.ShowZoomSOA(this.graphSettings.showZoom));
    }

    ngOnDestroy() {
        this.componentActive = false;
    }
}
