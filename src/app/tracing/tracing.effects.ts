import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { AlertService } from '../shared/services/alert.service';
import { DataService } from './services/data.service';
import * as tracingStateActions from './state/tracing.actions';
import * as tracingEffectActions from './tracing.actions';
import * as fromTracing from './state/tracing.reducers';
import * as tracingSelectors from './state/tracing.selectors';
import * as _ from 'lodash';
import { map, mergeMap, withLatestFrom, catchError } from 'rxjs/operators';
import { EMPTY, of, from } from 'rxjs';
import { DeliveryData, DeliveryId, StationData, StationId, JsonDataExtract } from './data.model';
import { Store, select } from '@ngrx/store';
import { StationPropertiesComponent, StationPropertiesData } from './dialog/station-properties/station-properties.component';
import { DeliveryPropertiesComponent, DeliveryPropertiesData } from './dialog/delivery-properties/delivery-properties.component';
import { DeliveriesPropertiesComponent } from './dialog/deliveries-properties/deliveries-properties.component';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { EditTracingSettingsService } from './services/edit-tracing-settings.service';
import { EditHighlightingService } from './configuration/edit-highlighting.service';
import { GraphService } from './graph/graph.service';
import { TableService } from './services/table.service';
import { IOService } from './io/io.service';

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
        private tableService: TableService,
        private ioService: IOService,
        private store: Store<fromTracing.State>
    ) { }

    showStationProperties$ = createEffect(
        () => this.actions$.pipe(
            ofType<tracingEffectActions.ShowStationPropertiesMSA>(tracingEffectActions.TracingActionTypes.ShowStationPropertiesMSA),
            withLatestFrom(this.store.pipe(select(tracingSelectors.selectDataServiceInputState))),
            mergeMap(([action, state]) => {
                const stationId = action.payload.stationId;
                const data = this.dataService.getData(state);
                const station = data.statMap[stationId];

                if (station) {
                    const deliveries = new Map<DeliveryId, DeliveryData>();
                    const connectedStations = new Map<StationId, StationData>();

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
                        connectedStations: connectedStations,
                        stationColumns: this.tableService.getStationColumnSets(state, data, false).columns
                    };

                    this.dialogService.open(StationPropertiesComponent, { data: dialogData });
                }
                return EMPTY;
            })
        ),
        { dispatch: false }
    );

    focusStationSSA$ = createEffect(
        () => this.actions$.pipe(
            ofType<tracingEffectActions.FocusStationSSA>(tracingEffectActions.TracingActionTypes.FocusStationSSA),
            withLatestFrom(this.store.pipe(select(tracingSelectors.selectSharedGraphState))),
            mergeMap(([action, state]) => {
                const focusStationId = action.payload.stationId;
                const focuseNodeId = this.graphService.getNodeIdFromStationId(focusStationId, state);

                if (focuseNodeId !== null) {
                    if (state.selectedElements.deliveries.length > 0) {
                        this.store.dispatch(new tracingStateActions.SetSelectedDeliveriesSOA({ deliveryIds: [] }));
                    }
                    this.store.dispatch(new tracingEffectActions.FocusGraphElementSSA({ elementId: focuseNodeId }));
                }
                return EMPTY;
            })
        ),
        { dispatch: false }
    );

    focusDeliverySSA$ = createEffect(
        () => this.actions$.pipe(
            ofType<tracingEffectActions.FocusDeliverySSA>(tracingEffectActions.TracingActionTypes.FocusDeliverySSA),
            withLatestFrom(this.store.pipe(select(tracingSelectors.selectSharedGraphState))),
            mergeMap(([action, state]) => {
                const focusDeliveryId = action.payload.deliveryId;
                const focuseEdgeId = this.graphService.getEdgeIdFromDeliveryId(focusDeliveryId, state);

                if (focuseEdgeId !== null) {
                    if (state.selectedElements.stations.length > 0) {
                        this.store.dispatch(new tracingStateActions.SetSelectedStationsSOA({ stationIds: [] }));
                    }
                    this.store.dispatch(new tracingEffectActions.FocusGraphElementSSA({ elementId: focuseEdgeId }));
                }
                return EMPTY;
            })
        ),
        { dispatch: false }
    );

    showDeliveryProperties$ = createEffect(
        () => this.actions$.pipe(
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
                            originalTarget: data.statMap[delivery.originalTarget],
                            deliveryColumns: this.tableService.getDeliveryColumnSets(state, data, false).columns
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
        ),
        { dispatch: false }
    );

    showElementsTrace$ = createEffect(() => this.actions$.pipe(
        ofType<tracingEffectActions.ShowElementsTraceMSA>(tracingEffectActions.TracingActionTypes.ShowElementsTraceMSA),
        withLatestFrom(this.store.pipe(select(tracingSelectors.getTracingSettings))),
        mergeMap(([action, state]) => {
            try {
                const payload = this.editTracSettingsService.getShowElementsTracePayload(state, action.payload);
                if (payload) {
                    return of(new tracingStateActions.SetTracingSettingsSOA(payload));
                }
            } catch (error) {
                this.alertService.error(`Element(s) trace could not be set!, error: ${error}`);
            }
            return EMPTY;
        })
    ));

    clearTrace$ = createEffect(() => this.actions$.pipe(
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
    ));

    setStationCrossCantamination$ = createEffect(() => this.actions$.pipe(
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
    ));

    setKillContamination$ = createEffect(() => this.actions$.pipe(
        ofType<tracingEffectActions.SetKillContaminationMSA>(
            tracingEffectActions.TracingActionTypes.SetKillContaminationMSA
        ),
        withLatestFrom(this.store.pipe(select(tracingSelectors.getTracingSettings))),
        mergeMap(([action, state]) => {
            try {
                const payload = this.editTracSettingsService.getSetKillContaminationPayload(state, action.payload);
                if (payload) {
                    return of(new tracingStateActions.SetTracingSettingsSOA(payload));
                }
            } catch (error) {
                this.alertService.error(`Kill contamination could not be (un)set!, error: ${error}`);
            }
            return EMPTY;
        })
    ));

    markElementsAsOutbreak$ = createEffect(() => this.actions$.pipe(
        ofType<tracingEffectActions.MarkElementsAsOutbreakMSA>(tracingEffectActions.TracingActionTypes.MarkElementsAsOutbreakMSA),
        withLatestFrom(this.store.pipe(select(tracingSelectors.getTracingSettings))),
        mergeMap(([action, state]) => {
            try {
                const payload = this.editTracSettingsService.getMarkElementsAsOutbreakPayload(state, action.payload);
                if (payload) {
                    return of(new tracingStateActions.SetTracingSettingsSOA(payload));
                }
            } catch (error) {
                this.alertService.error(`Outbreaks could not be set!, error: ${error}`);
            }
            return EMPTY;
        })
    ));

    makeElementsInvisible$ = createEffect(() => this.actions$.pipe(
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
    ));

    clearInvisiblities$ = createEffect(() => this.actions$.pipe(
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
    ));

    clearOutbreaks$ = createEffect(() => this.actions$.pipe(
        ofType<tracingEffectActions.ClearOutbreaksMSA>(tracingEffectActions.TracingActionTypes.ClearOutbreaksMSA),
        withLatestFrom(this.store.pipe(select(tracingSelectors.getTracingSettings))),
        mergeMap(([action, state]) => {
            try {
                const payload = this.editTracSettingsService.getClearOutbreaksPayload(state, action.payload);
                if (payload) {
                    return of(new tracingStateActions.SetTracingSettingsSOA(payload));
                }
            } catch (error) {
                this.alertService.error(`Outbreaks could not be cleared!, error: ${error}`);
            }
            return EMPTY;
        })
    ));

    clearCrossContaminations$ = createEffect(() => this.actions$.pipe(
        ofType<tracingEffectActions.ClearCrossContaminationMSA>(tracingEffectActions.TracingActionTypes.ClearCrossContaminationMSA),
        withLatestFrom(this.store.pipe(select(tracingSelectors.getTracingSettings))),
        mergeMap(([_action, state]) => {
            try {
                const payload = this.editTracSettingsService.getClearCrossContaminationPayload(state);
                if (payload) {
                    return of(new tracingStateActions.SetTracingSettingsSOA(payload));
                }
            } catch (error) {
                this.alertService.error(`Cross Contaminations could not be cleared!, error: ${error}`)
            }
            return EMPTY;
        })
    ));

    setSelectedGraphElements$ = createEffect(() => this.actions$.pipe(
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
    ));

    setStationPositionsAndLayoutMSA$ = createEffect(() => this.actions$.pipe(
        ofType<tracingEffectActions.SetStationPositionsAndLayoutMSA>(
            tracingEffectActions.TracingActionTypes.SetStationPositionsAndLayoutMSA
        ),
        withLatestFrom(this.store.pipe(select(tracingSelectors.getFclData))),
        mergeMap(([action, state]) => {
            try {

                const oldStationPositionsAreEmpty = _.isEmpty(state.graphSettings.stationPositions);
                const payloadPositionsAreEmpty = _.isEmpty(action.payload.stationPositions);

                this.store.dispatch(new tracingStateActions.SetStationPositionsAndLayoutSOA(action.payload));

                if ((oldStationPositionsAreEmpty) && (!payloadPositionsAreEmpty)) {
                    this.store.dispatch(new tracingEffectActions.SetLastUnchangedJsonDataExtractMSA());
                }
            } catch (error) {
                this.alertService.error(`Graph selection could not be set!, error: ${error}`);
            }
            return EMPTY;
        })
    ), { dispatch: false });


    setLastUnchangedJsonDataExtractMSA$ = createEffect(() => this.actions$.pipe(
        ofType<tracingEffectActions.SetLastUnchangedJsonDataExtractMSA>(
            tracingEffectActions.TracingActionTypes.SetLastUnchangedJsonDataExtractMSA
        ),
        withLatestFrom(this.store.pipe(select(tracingSelectors.getFclData))),
        mergeMap(([, fclData]) => from(this.ioService.fclDataToJsonDataExtract(fclData)).pipe(
            map((extract: JsonDataExtract) =>
                new tracingStateActions.SetLastUnchangedJsonDataExtractSuccessSOA({ extractData: extract })),
            catchError((error) => {
                const errorMsg = `Reduced Reference Copy cannot be refreshed: ${error.message}`;
                this.alertService.error(errorMsg);
                return EMPTY;
            })
        ))
    ));

}
