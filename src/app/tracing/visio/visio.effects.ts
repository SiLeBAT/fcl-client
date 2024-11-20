import { Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { AlertService } from "../../shared/services/alert.service";

import * as visioActions from "./visio.actions";
import * as tracingStoreActions from "./../state/tracing.actions";
import * as fromTracing from "./../state/tracing.reducers";
import * as tracingSelectors from "./../state/tracing.selectors";

import { mergeMap, withLatestFrom } from "rxjs/operators";
import { MatLegacyDialog as MatDialog } from "@angular/material/legacy-dialog";
import { EMPTY, of } from "rxjs";
import { DataService } from "../services/data.service";
import { Store, select } from "@ngrx/store";
import { generateVisioReport } from "./visio.service";
import { Router } from "@angular/router";
import { ReportConfigurationComponent } from "./report-configuration/report-configuration.component";
import { Position, StationId } from "../data.model";
import { Constants } from "../util/constants";

@Injectable()
export class VisioEffects {
    constructor(
        private actions$: Actions,
        private alertService: AlertService,
        private store: Store<fromTracing.State>,
        private dialogService: MatDialog,
        private dataService: DataService,
        private router: Router,
    ) {}

    openROAReportConfiguration$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType<visioActions.OpenROAReportConfigurationMSA>(
                    visioActions.VisioActionTypes.OpenROAReportConfigurationMSA,
                ),
                mergeMap((action) => {
                    this.dialogService.open(ReportConfigurationComponent, {
                        data: null,
                    });
                    return EMPTY;
                }),
            ),
        { dispatch: false },
    );

    generateROAReport$ = createEffect(() =>
        this.actions$.pipe(
            ofType<visioActions.GenerateROAReportMSA>(
                visioActions.VisioActionTypes.GenerateROAReportMSA,
            ),
            withLatestFrom(
                this.store.pipe(select(tracingSelectors.getROAReportData)),
            ),
            mergeMap(([action, roaReportData]) => {
                const dataServiceData = this.dataService.getData(
                    roaReportData.schemaGraphState,
                );

                if (dataServiceData.isStationAnonymizationActive) {
                    // replace configured station box label by anonymization label
                    roaReportData = {
                        ...roaReportData,
                        roaSettings: {
                            ...roaReportData.roaSettings!,
                            labelSettings: {
                                ...roaReportData.roaSettings!.labelSettings,
                                stationLabel: [
                                    [
                                        {
                                            prop: Constants.COLUMN_ANONYMIZED_NAME,
                                            altText: "",
                                            isNullable: false,
                                        },
                                    ],
                                ],
                            },
                        },
                    };
                }

                const fclElements = {
                    stations: dataServiceData.stations,
                    deliveries: dataServiceData.deliveries,
                    samples: roaReportData.samples,
                };
                const visStations = fclElements.stations.filter(
                    (s) => !s.invisible && !s.contained,
                );

                const stationIdToPosMap: Record<StationId, Position> = {};
                visStations.forEach(
                    (station) =>
                        (stationIdToPosMap[station.id] =
                            roaReportData.schemaGraphState.stationPositions[
                                station.id
                            ]),
                );

                try {
                    const roaReport = generateVisioReport(
                        fclElements,
                        stationIdToPosMap,
                        roaReportData.roaSettings!,
                    );
                    if (roaReport !== null) {
                        this.router.navigate(["/graph-editor"]).catch((err) => {
                            this.alertService.error(
                                `Unable to navigate to graph editor: ${err}`,
                            );
                        });
                        return of(
                            new tracingStoreActions.GenerateVisioLayoutSuccess(
                                roaReport,
                            ),
                        );
                    } else {
                        return EMPTY;
                    }
                } catch (error) {
                    this.alertService.error(
                        `ROA report generation failed!, error: ${error}`,
                    );
                    return EMPTY;
                }
            }),
        ),
    );
}
