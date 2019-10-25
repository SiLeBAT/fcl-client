import { BasicGraphState, DataServiceData } from './../data.model';
import { DataService } from './../services/data.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Constants } from '../util/constants';
import * as TracingSelectors from '../state/tracing.selectors';
import * as fromTracing from '../state/tracing.reducers';
import * as tracingActions from '../state/tracing.actions';
import { Store, select, resultMemoize } from '@ngrx/store';
import { takeWhile } from 'rxjs/operators';
import { Utils as UIUtils } from '../util/ui-utils';
import { Observable, combineLatest } from 'rxjs';
import { FclData, GraphSettings, MergeDeliveriesType } from '../data.model';

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

    readonly mergeDeliveriesOptions: { value: MergeDeliveriesType, label: string, toolTip: string }[] = [
        {
            value: MergeDeliveriesType.NO_MERGE,
            label: 'No',
            toolTip: 'Deliveries are not merged.'
        },
        {
            value: MergeDeliveriesType.MERGE_ALL,
            label: 'All',
            toolTip: 'All deliveries between a pair of nodes are merged.'
        },
        {
            value: MergeDeliveriesType.MERGE_PRODUCT_WISE,
            label: 'Product-wise',
            toolTip: 'Deliveries from an identical product are merged.'
        },
        {
            value: MergeDeliveriesType.MERGE_LABEL_WISE,
            label: 'Label-wise',
            toolTip: 'Deliveries with an identical label are merged.'
        },
        {
            value: MergeDeliveriesType.MERGE_LOT_WISE,
            label: 'Lot-wise',
            toolTip: 'Deliveries from an identical lot are merged.'
        }
    ];

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

    setMergeDeliveriesType() {
        this.store.dispatch(new tracingActions.SetMergeDeliveriesTypeSOA({ mergeDeliveriesType: this.graphSettings.mergeDeliveriesType }));
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
