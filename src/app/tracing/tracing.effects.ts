import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { AlertService } from '../shared/services/alert.service';

import { DataService } from './services/data.service';
import * as tracingStateActions from './state/tracing.actions';
import * as tracingEffectActions from './tracing.actions';
import * as fromTracing from './state/tracing.reducers';
import * as tracingSelectors from './state/tracing.selectors';
import { mergeMap, withLatestFrom } from 'rxjs/operators';
import { EMPTY, of } from 'rxjs';
import { DeliveryData, DeliveryId, StationData, StationId } from './data.model';
import { Store, select } from '@ngrx/store';
import { StationPropertiesComponent, StationPropertiesData } from './dialog/station-properties/station-properties.component';
import { DeliveryPropertiesComponent, DeliveryPropertiesData } from './dialog/delivery-properties/delivery-properties.component';
import { DeliveriesPropertiesComponent } from './dialog/deliveries-properties/deliveries-properties.component';
import { MatDialog } from '@angular/material/dialog';
import { EditTracingSettingsService } from './services/edit-tracing-settings.service';
import { EditHighlightingService } from './configuration/edit-highlighting.service';
import { GraphService } from './graph/graph.service';

@Injectable()
export class TracingEffects {
    constructor(
        private actions$: Actions,
        private dataService: DataService,
        private editTracSettingsService: EditTracingSettingsService,
        private graphService: GraphService,
        private dialogService: MatDialog,
        private alertService: AlertService,
        private editHighlightingService: EditHighlightingService,
        private store: Store<fromTracing.State>
    ) {}

    @Effect()
    showStationProperties$ = this.actions$.pipe(
        ofType<tracingEffectActions.ShowStationPropertiesMSA>(tracingEffectActions.TracingActionTypes.ShowStationPropertiesMSA),
        withLatestFrom(this.store.pipe(select(tracingSelectors.selectDataServiceInputState))),
        mergeMap(([action, state]) => {
            const stationId = action.payload.stationId;
            const data = this.dataService.getData(state);
            const station = data.statMap[stationId];

            if (station) {
                const deliveries: Map<DeliveryId, DeliveryData> = new Map();
                const connectedStations: Map<StationId, StationData> = new Map();

                for (const delivery of data.getDelById(station.incoming)) {
                    deliveries.set(delivery.id, delivery);
                    connectedStations.set(delivery.source, data.statMap[delivery.source]);
                }

                for (const delivery of data.getDelById(station.outgoing)) {
                    deliveries.set(delivery.id, delivery);
                    connectedStations.set(delivery.target, data.statMap[delivery.target]);
                }

                const dialogData: StationPropertiesData = {
                    station: station,
                    deliveries: deliveries,
                    connectedStations: connectedStations
                };

                this.dialogService.open(StationPropertiesComponent, { data: dialogData });
            }
            return EMPTY;
        })
    );

    @Effect()
    showDeliveryProperties$ = this.actions$.pipe(
        ofType<tracingEffectActions.ShowDeliveryPropertiesMSA>(tracingEffectActions.TracingActionTypes.ShowDeliveryPropertiesMSA),
        withLatestFrom(this.store.pipe(select(tracingSelectors.selectDataServiceInputState))),
        mergeMap(([action, state]) => {
            const deliveryIds = action.payload.deliveryIds;
            const data = this.dataService.getData(state);
            if (deliveryIds.length === 1) {
                const delivery = data.delMap[deliveryIds[0]];

                if (delivery) {
                    const dialogData: DeliveryPropertiesData = {
                        delivery: delivery,
                        source: data.statMap[delivery.source],
                        target: data.statMap[delivery.target],
                        originalSource: data.statMap[delivery.originalSource],
                        originalTarget: data.statMap[delivery.originalTarget]
                    };

                    this.dialogService.open(DeliveryPropertiesComponent, { data: dialogData });
                }
            } else {
                this.dialogService.open(DeliveriesPropertiesComponent, {
                    data: { deliveryIds: deliveryIds }
                });
            }
            return EMPTY;
        })
    );

    @Effect()
    showElementsTrace$ = this.actions$.pipe(
        ofType<tracingEffectActions.ShowElementsTraceMSA>(tracingEffectActions.TracingActionTypes.ShowElementsTraceMSA),
        withLatestFrom(this.store.pipe(select(tracingSelectors.getTracingSettings))),
        mergeMap(([action, state]) => {
            try {
                const payload = this.editTracSettingsService.getShowElementsTracePayload(state, action.payload);
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
    clearTrace$ = this.actions$.pipe(
        ofType<tracingEffectActions.ClearTraceMSA>(tracingEffectActions.TracingActionTypes.ClearTraceMSA),
        withLatestFrom(this.store.pipe(select(tracingSelectors.getTracingSettings))),
        mergeMap(([action, state]) => {
            try {
                const payload = this.editTracSettingsService.getClearTracePayload(state);
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
                const payload = this.editTracSettingsService.getSetStationCrossContPayload(state, stationIds, crossContamination);
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
    setStationKillContamination$ = this.actions$.pipe(
        ofType<tracingEffectActions.SetStationKillContaminationMSA>(
            tracingEffectActions.TracingActionTypes.SetStationKillContaminationMSA
        ),
        withLatestFrom(this.store.pipe(select(tracingSelectors.getTracingSettings))),
        mergeMap(([action, state]) => {
            const stationIds = action.payload.stationIds;
            const killContamination = action.payload.killContamination;
            try {
                const payload = this.editTracSettingsService.getSetStationKillContPayload(state, stationIds, killContamination);
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
                const payload = this.editTracSettingsService.getMarkStationsAsOutbreakPayload(state, stationIds, outbreak);
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
    makeElementsInvisible$ = this.actions$.pipe(
        ofType<tracingEffectActions.MakeElementsInvisibleMSA>(tracingEffectActions.TracingActionTypes.MakeElementsInvisibleMSA),
        withLatestFrom(this.store.pipe(select(tracingSelectors.getMakeElementsInvisibleInputState))),
        mergeMap(([action, state]) => {
            try {
                const payload = this.editHighlightingService.getMakeElementsInvisiblePayload(state, action.payload);
                if (payload) {
                    return of(new tracingStateActions.SetInvisibleElementsSOA(payload));
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
        withLatestFrom(this.store.pipe(select(tracingSelectors.selectHighlightingSettings))),
        mergeMap(([action, state]) => {
            try {
                const payload = this.editHighlightingService.getClearInvisiblitiesPayload(state, action.payload);
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
                const payload = this.editTracSettingsService.getClearOutbreakStationsPayload(state);
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
    setSelectedGraphElements$ = this.actions$.pipe(
        ofType<tracingEffectActions.SetSelectedGraphElementsMSA>(tracingEffectActions.TracingActionTypes.SetSelectedGraphElementsMSA),
        withLatestFrom(this.store.pipe(select(tracingSelectors.selectSharedGraphState))),
        mergeMap(([action, state]) => {
            try {
                const graphData = this.graphService.getData(state);
                const selectedFCElements = this.graphService.convertGraphSelectionToFclSelection(
                    action.payload.selectedElements,
                    graphData,
                    action.payload.maintainOffGraphSelection
                );
                if (selectedFCElements) {
                    return of(new tracingStateActions.SetSelectedElementsSOA({
                        selectedElements: selectedFCElements
                    }));
                }
            } catch (error) {
                this.alertService.error(`Graph selection could not be set!, error: ${error}`);
            }
            return EMPTY;
        })
    );
}
