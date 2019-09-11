import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { AlertService } from '../shared/services/alert.service';

import { DataService } from './services/data.service';
import * as tracingStateActions from './state/tracing.actions';
import * as tracingEffectActions from './tracing.actions';
import * as fromTracing from './state/tracing.reducers';
import * as tracingSelectors from './state/tracing.selectors';
import { map, catchError, mergeMap, withLatestFrom } from 'rxjs/operators';
import { EMPTY, of } from 'rxjs';
import { DeliveryData, StationData } from './data.model';
import { Store, select } from '@ngrx/store';
import { StationPropertiesComponent, StationPropertiesData } from './dialog/station-properties/station-properties.component';
import { DeliveryPropertiesComponent, DeliveryPropertiesData } from './dialog/delivery-properties/delivery-properties.component';
import { MatDialog } from '@angular/material';
import { TracingService } from './services/tracing.service';
import { HighlightingService } from './services/highlighting.service';

@Injectable()
export class TracingEffects {
    constructor(
        private actions$: Actions,
        private dataService: DataService,
        private tracingService: TracingService,
        private dialogService: MatDialog,
        private alertService: AlertService,
        private highlightingService: HighlightingService,
        private store: Store<fromTracing.State>
    ) {}

    @Effect()
    showStationProperties$ = this.actions$.pipe(
        ofType<tracingEffectActions.ShowStationPropertiesMSA>(tracingEffectActions.TracingActionTypes.ShowStationPropertiesMSA),
        withLatestFrom(this.store.pipe(select(tracingSelectors.getBasicGraphData))),
        mergeMap(([action, state]) => {
            const stationId = action.payload.stationId;
            // tslint:disable-next-line rxjs-finnish
            const hoverDeliveriesSubject = action.payload.hoverDeliveriesSubject;
            const data = this.dataService.getData(state);
            const station = data.statMap[stationId];

            if (station) {
                const deliveries: Map<string, DeliveryData> = new Map();
                const connectedStations: Map<string, StationData> = new Map();

                for (const d of data.getDelById(station.incoming)) {
                    deliveries.set(d.id, d);
                    connectedStations.set(d.source, data.statMap[d.source]);
                }

                for (const d of data.getDelById(station.outgoing)) {
                    deliveries.set(d.id, d);
                    connectedStations.set(d.target, data.statMap[d.target]);
                }

                const dialogData: StationPropertiesData = {
                    station: station,
                    deliveries: deliveries,
                    connectedStations: connectedStations,
                    hoverDeliveriesSubject: hoverDeliveriesSubject
                };

                this.dialogService.open(StationPropertiesComponent, { data: dialogData });
            }
            return EMPTY;
        })
    );

    @Effect()
    showDeliveryProperties$ = this.actions$.pipe(
        ofType<tracingEffectActions.ShowDeliveryPropertiesMSA>(tracingEffectActions.TracingActionTypes.ShowDeliveryPropertiesMSA),
        withLatestFrom(this.store.pipe(select(tracingSelectors.getBasicGraphData))),
        mergeMap(([action, state]) => {
            const deliveryId = action.payload.deliveryId;
            const data = this.dataService.getData(state);
            const delivery = data.delMap[deliveryId];

            if (delivery) {
                const dialogData: DeliveryPropertiesData = {
                    delivery: delivery
                };

                this.dialogService.open(DeliveryPropertiesComponent, { data: dialogData });
            }
            return EMPTY;
        })
    );

    @Effect()
    showStationTrace$ = this.actions$.pipe(
        ofType<tracingEffectActions.ShowStationTraceMSA>(tracingEffectActions.TracingActionTypes.ShowStationTraceMSA),
        withLatestFrom(this.store.pipe(select(tracingSelectors.getTracingSettings))),
        mergeMap(([action, state]) => {
            const stationId = action.payload.stationId;
            const observedType = action.payload.observedType;
            try {
                const payload = this.tracingService.getShowStationTracePayload(state, stationId, observedType);
                if (payload) {
                    return of(new tracingStateActions.SetTracingSettingsSOA(payload));
                }
            } catch (error) {
                this.alertService.error(`Station trace could not be set!, error: ${error}`);
            }
            return EMPTY;
        })
    );

    @Effect()
    showDeliveryTrace$ = this.actions$.pipe(
        ofType<tracingEffectActions.ShowDeliveryTraceMSA>(tracingEffectActions.TracingActionTypes.ShowDeliveryTraceMSA),
        withLatestFrom(this.store.pipe(select(tracingSelectors.getTracingSettings))),
        mergeMap(([action, state]) => {
            const deliveryId = action.payload.deliveryId;
            const observedType = action.payload.observedType;
            try {
                const payload = this.tracingService.getShowDeliveryTracePayload(state, deliveryId, observedType);
                if (payload) {
                    return of(new tracingStateActions.SetTracingSettingsSOA(payload));
                }
            } catch (error) {
                this.alertService.error(`Delivery trace could not be set!, error: ${error}`);
            }
            return EMPTY;
        })
    );

    @Effect()
    clearTrace$ = this.actions$.pipe(
        ofType<tracingEffectActions.ClearTraceMSA>(tracingEffectActions.TracingActionTypes.ClearTraceMSA),
        withLatestFrom(this.store.pipe(select(tracingSelectors.getTracingSettings))),
        mergeMap(([action, state]) => {
            try {
                const payload = this.tracingService.getClearTracePayload(state);
                if (payload) {
                    return of(new tracingStateActions.SetTracingSettingsSOA(payload));
                }
            } catch (error) {
                this.alertService.error(`Trace could not be cleared!, error: ${error}`);
            }
            return EMPTY;
        })
    );

    @Effect()
    setStationCrossCantamination$ = this.actions$.pipe(
        ofType<tracingEffectActions.SetStationCrossContaminationMSA>(
            tracingEffectActions.TracingActionTypes.SetStationCrossContaminationMSA
        ),
        withLatestFrom(this.store.pipe(select(tracingSelectors.getTracingSettings))),
        mergeMap(([action, state]) => {
            const stationIds = action.payload.stationIds;
            const crossContamination = action.payload.crossContamination;
            try {
                const payload = this.tracingService.getSetStationCrossContPayload(state, stationIds, crossContamination);
                if (payload) {
                    return of(new tracingStateActions.SetTracingSettingsSOA(payload));
                }
            } catch (error) {
                this.alertService.error(`Station cross contamination could not be set!, error: ${error}`);
            }
            return EMPTY;
        })
    );

    @Effect()
    setStationKillCantamination$ = this.actions$.pipe(
        ofType<tracingEffectActions.SetStationKillContaminationMSA>(
            tracingEffectActions.TracingActionTypes.SetStationKillContaminationMSA
        ),
        withLatestFrom(this.store.pipe(select(tracingSelectors.getTracingSettings))),
        mergeMap(([action, state]) => {
            const stationIds = action.payload.stationIds;
            const killContamination = action.payload.killContamination;
            try {
                const payload = this.tracingService.getSetStationKillContPayload(state, stationIds, killContamination);
                if (payload) {
                    return of(new tracingStateActions.SetTracingSettingsSOA(payload));
                }
            } catch (error) {
                this.alertService.error(`Station kill contamination could not be set!, error: ${error}`);
            }
            return EMPTY;
        })
    );

    @Effect()
    markStationsAsOutbreak$ = this.actions$.pipe(
        ofType<tracingEffectActions.MarkStationsAsOutbreakMSA>(tracingEffectActions.TracingActionTypes.MarkStationsAsOutbreakMSA),
        withLatestFrom(this.store.pipe(select(tracingSelectors.getTracingSettings))),
        mergeMap(([action, state]) => {
            const stationIds = action.payload.stationIds;
            const outbreak = action.payload.outbreak;
            try {
                const payload = this.tracingService.getMarkStationsAsOutbreakPayload(state, stationIds, outbreak);
                if (payload) {
                    return of(new tracingStateActions.SetTracingSettingsSOA(payload));
                }
            } catch (error) {
                this.alertService.error(`Outbreak stations could not be set!, error: ${error}`);
            }
            return EMPTY;
        })
    );

    @Effect()
    makeStationsInvisible$ = this.actions$.pipe(
        ofType<tracingEffectActions.MakeStationsInvisibleMSA>(tracingEffectActions.TracingActionTypes.MakeStationsInvisibleMSA),
        withLatestFrom(this.store.pipe(select(tracingSelectors.getHighlightingSettings))),
        mergeMap(([action, state]) => {
            try {
                const payload = this.highlightingService.getMarkStationsInvisiblePayload(state, action.payload.stationIds, true);
                if (payload) {
                    return of(new tracingStateActions.SetHighlightingSettingsSOA(payload));
                }
            } catch (error) {
                this.alertService.error(`Stations could not be made invisible!, error: ${error}`);
            }
            return EMPTY;
        })
    );

    @Effect()
    clearInvisiblities$ = this.actions$.pipe(
        ofType<tracingEffectActions.ClearInvisibilitiesMSA>(tracingEffectActions.TracingActionTypes.ClearInvisibilitiesMSA),
        withLatestFrom(this.store.pipe(select(tracingSelectors.getHighlightingSettings))),
        mergeMap(([action, state]) => {
            try {
                const payload = this.highlightingService.getClearInvisiblitiesPayload(state);
                if (payload) {
                    return of(new tracingStateActions.SetHighlightingSettingsSOA(payload));
                }
            } catch (error) {
                this.alertService.error(`Invisibilities could not be cleared!, error: ${error}`);
            }
            return EMPTY;
        })
    );

    @Effect()
    clearOutbreakStations$ = this.actions$.pipe(
        ofType<tracingEffectActions.ClearOutbreakStationsMSA>(tracingEffectActions.TracingActionTypes.ClearOutbreakStationsMSA),
        withLatestFrom(this.store.pipe(select(tracingSelectors.getTracingSettings))),
        mergeMap(([action, state]) => {
            try {
                const payload = this.tracingService.getClearOutbreakStationsPayload(state);
                if (payload) {
                    return of(new tracingStateActions.SetTracingSettingsSOA(payload));
                }
            } catch (error) {
                this.alertService.error(`Outbreak stations could not be set!, error: ${error}`);
            }
            return EMPTY;
        })
    );
}
