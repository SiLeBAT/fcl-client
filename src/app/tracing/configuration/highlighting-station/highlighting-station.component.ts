import { BasicGraphState, LegendInfo, DataServiceData } from './../../data.model';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import * as fromTracing from '../../state/tracing.reducers';
import * as tracingSelectors from '../../state/tracing.selectors';
import { takeWhile } from 'rxjs/operators';
import { AlertService } from '@app/shared/services/alert.service';
import { DataService } from '@app/tracing/services/data.service';

@Component({
    selector: 'fcl-highlighting-station',
    templateUrl: './highlighting-station.component.html',
    styleUrls: ['./highlighting-station.component.scss']
})
export class HighlightingStationComponent implements OnInit, OnDestroy {

    highlightingInfo: LegendInfo;

    private isHighlightingStationTabActive$: Observable<boolean> = this.store.pipe(
        select(tracingSelectors.getIsHighlightingStationTabActive),
        takeWhile(() => this.componentIsActive)
    );

    private componentIsActive = true;
    private stateSubscription: Subscription;

    private cachedState: BasicGraphState;
    private cachedData: LegendInfo;

    constructor(
        private store: Store<fromTracing.State>,
        private alertService: AlertService,
        private dataService: DataService
    ) { }

    ngOnInit() {

        this.isHighlightingStationTabActive$.subscribe(
            isActive => {
                if (!isActive) {
                    if (this.stateSubscription) {
                        this.stateSubscription.unsubscribe();
                        this.stateSubscription = null;
                    }
                } else {
                    if (!this.stateSubscription) {
                        this.stateSubscription = this.store.select(tracingSelectors.getBasicGraphData).subscribe(
                            (state) => this.applyState(state),
                            err => this.alertService.error(`getStationFilterData store subscription failed: ${err}`)
                        );
                    }
                }
            },
            err => this.alertService.error(`showConfigurationSideBar store subscription failed: ${err}`)
        );
    }

    ngOnDestroy() {
        this.componentIsActive = false;
        if (this.stateSubscription) {
            this.stateSubscription.unsubscribe();
            this.stateSubscription = null;
        }
    }

    private applyState(state: BasicGraphState) {
        const dataList: LegendInfo = this.cachedData ? this.cachedData : undefined;
        const dataServiceData: DataServiceData = this.dataService.getData(state);

        this.cachedData = {
            ...this.cachedData,
            ...dataList
        };
        this.cachedState = {
            ...this.cachedState,
            ...state
        };
        this.highlightingInfo = dataServiceData.legendInfo;
    }
}
