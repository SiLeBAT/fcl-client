import { Component, OnInit, OnDestroy } from '@angular/core';
import { Constants } from '../util/constants';
import * as TracingSelectors from '../state/tracing.selectors';
import * as fromTracing from '../state/tracing.reducers';
import * as tracingActions from '../state/tracing.actions';
import { Store, select } from '@ngrx/store';
import { takeWhile } from 'rxjs/operators';
import { GraphSettings, MergeDeliveriesType, CrossContTraceType } from '../data.model';

interface TracingSettings {
    crossContTraceType: CrossContTraceType;
}

@Component({
    selector: 'fcl-graph-settings',
    templateUrl: './graph-settings.component.html',
    styleUrls: ['./graph-settings.component.scss']
})
export class GraphSettingsComponent implements OnInit, OnDestroy {
    graphSettings: GraphSettings;
    tracingSettings: TracingSettings;

    fontSizes = Constants.FONT_SIZES;
    nodeSizes = Constants.NODE_SIZES;

    readonly crossContTraceTypeOptions: {
        value: CrossContTraceType;
        label: string;
        toolTip: string;
    }[] = [
        {
            value: CrossContTraceType.DO_NOT_CONSIDER_DELIVERY_DATES,
            label: 'Ignore dates',
            toolTip: 'Delivery dates are ignored for cross contamination tracing.'
        },
        {
            value: CrossContTraceType.USE_EXPLICIT_DELIVERY_DATES,
            label: 'Use explicit dates',
            toolTip: 'Use explicit delivery dates for cross contamination tracing.'
        },
        {
            value: CrossContTraceType.USE_INFERED_DELIVERY_DATES_LIMITS,
            label: 'Use deduced dates',
            toolTip: 'Use deduced delivery dates for cross contamination tracing. Deduction is based on explicit delivery dates and delivery relations.'
        }
    ];

    readonly mergeDeliveriesOptions: {
        value: MergeDeliveriesType;
        label: string;
        toolTip: string;
    }[] = [
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

    constructor(private store: Store<fromTracing.State>) {}

    ngOnInit() {
        this.store
            .pipe(
                select(TracingSelectors.getFclData),
                takeWhile(() => this.componentActive)
            )
            .subscribe(
                fclData => {
                    this.graphSettings = fclData.graphSettings;
                    this.tracingSettings = fclData.tracingSettings;
                },
                error => {
                    throw new Error(`error loading data: ${error}`);
                }
            );
    }

    setNodeSize() {
        this.store.dispatch(
            new tracingActions.SetNodeSizeSOA({ nodeSize: this.graphSettings.nodeSize })
        );
    }

    setFontSize() {
        this.store.dispatch(
            new tracingActions.SetFontSizeSOA({ fontSize: this.graphSettings.fontSize })
        );
    }

    setMergeDeliveriesType() {
        this.store.dispatch(
            new tracingActions.SetMergeDeliveriesTypeSOA({
                mergeDeliveriesType: this.graphSettings.mergeDeliveriesType
            })
        );
    }

    setCrossContTraceType() {
        this.store.dispatch(
            new tracingActions.SetCrossContTraceTypeSOA({
                crossContTraceType: this.tracingSettings.crossContTraceType
            })
        );
    }

    showLegend() {
        this.store.dispatch(
            new tracingActions.ShowLegendSOA(this.graphSettings.showLegend)
        );
    }

    showMergedDeliveriesCounts() {
        this.store.dispatch(
            new tracingActions.ShowMergedDeliveriesCountsSOA({
                showMergedDeliveriesCounts: this.graphSettings
                    .showMergedDeliveriesCounts
            })
        );
    }

    showZoom() {
        this.store.dispatch(
            new tracingActions.ShowZoomSOA(this.graphSettings.showZoom)
        );
    }

    ngOnDestroy() {
        this.componentActive = false;
    }
}
