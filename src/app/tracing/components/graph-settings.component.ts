import { Component, OnInit, OnDestroy } from '@angular/core';
import { Constants } from '../util/constants';
import * as TracingSelectors from '../state/tracing.selectors';
import * as fromTracing from '../state/tracing.reducers';
import * as tracingActions from '../state/tracing.actions';
import { Store, select } from '@ngrx/store';
import { takeWhile } from 'rxjs/operators';
import { GraphSettings, MergeDeliveriesType } from '../data.model';

@Component({
    selector: 'fcl-graph-settings',
    templateUrl: './graph-settings.component.html',
    styleUrls: ['./graph-settings.component.scss']
})
export class GraphSettingsComponent implements OnInit, OnDestroy {
    graphSettings: GraphSettings;
    sizes = Constants.SIZES;

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
                },
                error => {
                    throw new Error(`error loading data: ${error}`);
                }
            );
    }

    setNodeSize() {
        this.store.dispatch(
            new tracingActions.SetNodeSizeSOA(this.graphSettings.nodeSize)
        );
    }

    setFontSize() {
        this.store.dispatch(
            new tracingActions.SetFontSizeSOA(this.graphSettings.fontSize)
        );
    }

    setMergeDeliveriesType() {
        this.store.dispatch(
            new tracingActions.SetMergeDeliveriesTypeSOA({
                mergeDeliveriesType: this.graphSettings.mergeDeliveriesType
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
