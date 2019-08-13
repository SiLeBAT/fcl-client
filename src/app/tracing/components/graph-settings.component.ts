import { Component, OnInit, OnDestroy } from '@angular/core';
import { Constants } from '../util/constants';
import * as TracingSelectors from '../state/tracing.selectors';
import * as fromTracing from '../state/tracing.reducers';
import * as tracingActions from '../state/tracing.actions';
import { Store, select } from '@ngrx/store';
import { takeWhile } from 'rxjs/operators';
import { FclData, GraphSettings } from '../data.model';

@Component({
    selector: 'fcl-graph-settings',
    templateUrl: './graph-settings.component.html',
    styleUrls: ['./graph-settings.component.scss']
})
export class GraphSettingsComponent implements OnInit, OnDestroy {
    graphTypes = Constants.GRAPH_TYPES;
    graphSettings: GraphSettings;
    sizes = Constants.SIZES;
    private componentActive: boolean = true;

    constructor(private store: Store<fromTracing.State>) {}

    ngOnInit() {
        this.store
            .pipe(
                select(TracingSelectors.getFclData),
                takeWhile(() => this.componentActive)
            )
            .subscribe(
                (data: FclData) => {
                    this.graphSettings = data.graphSettings;
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
