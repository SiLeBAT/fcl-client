import { StationHighlightingData } from './../../data.model';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import * as fromTracing from '../../state/tracing.reducers';
import * as tracingSelectors from '../../state/tracing.selectors';
import { takeWhile } from 'rxjs/operators';
import { AlertService } from '@app/shared/services/alert.service';

@Component({
    selector: 'fcl-highlighting-station',
    templateUrl: './highlighting-station.component.html',
    styleUrls: ['./highlighting-station.component.scss']
})
export class HighlightingStationComponent implements OnInit, OnDestroy {

    colorAndShapeHighlightings: StationHighlightingData[] = [];

    private isHighlightingStationTabActive$: Observable<boolean> = this.store.pipe(
        select(tracingSelectors.getIsHighlightingStationTabActive),
        takeWhile(() => this.componentIsActive)
    );

    private componentIsActive = true;
    private stateSubscription: Subscription;

    constructor(
        private store: Store<fromTracing.State>,
        private alertService: AlertService
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
                        this.stateSubscription = this.store.select(tracingSelectors.getStationHighlightingSettings).subscribe(
                            (stationHighlightingData) => this.applyState(stationHighlightingData),
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

    private applyState(stationHighlightingData: StationHighlightingData[]) {
        this.colorAndShapeHighlightings = stationHighlightingData.filter((item: StationHighlightingData) => {
            return (item.color || (item.shape !== undefined && item.shape !== null));
        });
    }
}
