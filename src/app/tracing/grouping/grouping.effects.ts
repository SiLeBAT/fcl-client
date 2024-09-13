import { Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { AlertService } from "../../shared/services/alert.service";

import * as groupingActions from "./grouping.actions";
import * as storeActions from "./../state/tracing.actions";
import * as fromTracing from "./../state/tracing.reducers";
import * as tracingSelectors from "./../state/tracing.selectors";

import { mergeMap, withLatestFrom } from "rxjs/operators";
import { MatLegacyDialog as MatDialog } from "@angular/material/legacy-dialog";
import { of, EMPTY } from "rxjs";
import { GroupingService } from "./grouping.service";
import { Store, select } from "@ngrx/store";
import {
    MergeStationsDialogData,
    MergeStationsDialogComponent,
} from "./merge-stations-dialog/merge-stations-dialog.component";

@Injectable()
export class GroupingEffects {
    constructor(
        private actions$: Actions,
        private alertService: AlertService,
        private store: Store<fromTracing.State>,
        private dialogService: MatDialog,
        private groupingService: GroupingService,
    ) {}

    mergeStations$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType<groupingActions.MergeStationsMSA>(
                    groupingActions.GroupingActionTypes.MergeStationsMSA,
                ),
                withLatestFrom(
                    this.store.pipe(select(tracingSelectors.getGroupingData)),
                ),
                mergeMap(([action, state]) => {
                    const memberIds = action.payload.memberIds;

                    const dialogData: MergeStationsDialogData = {
                        memberIds: memberIds,
                        state: state,
                    };

                    this.dialogService.open(MergeStationsDialogComponent, {
                        data: dialogData,
                    });
                    return EMPTY;
                }),
            ),
        { dispatch: false },
    );

    collapseStations$ = createEffect(() =>
        this.actions$.pipe(
            ofType<groupingActions.CollapseStationsMSA>(
                groupingActions.GroupingActionTypes.CollapseStationsMSA,
            ),
            withLatestFrom(
                this.store.pipe(select(tracingSelectors.getGroupingData)),
            ),
            mergeMap(([action, state]) => {
                const groupType = action.payload.groupType;
                const groupMode = action.payload.groupMode;
                try {
                    const payload =
                        this.groupingService.getCollapseStationsPayload(
                            state,
                            groupType,
                            groupMode,
                        );

                    if (payload) {
                        return of(
                            new storeActions.SetStationGroupsSOA(payload),
                        );
                    } else {
                        return EMPTY;
                    }
                } catch (error) {
                    this.alertService.error(
                        `Stations could not be collapsed!, error: ${error}`,
                    );
                    return EMPTY;
                }
            }),
        ),
    );

    uncollapseStations$ = createEffect(() =>
        this.actions$.pipe(
            ofType<groupingActions.UncollapseStationsMSA>(
                groupingActions.GroupingActionTypes.UncollapseStationsMSA,
            ),
            withLatestFrom(
                this.store.pipe(select(tracingSelectors.getGroupingData)),
            ),
            mergeMap(([action, state]) => {
                const groupType = action.payload.groupType;
                try {
                    const payload =
                        this.groupingService.getUncollapseStationsPayload(
                            state,
                            groupType,
                        );

                    if (payload) {
                        return of(
                            new storeActions.SetStationGroupsSOA(payload),
                        );
                    } else {
                        return EMPTY;
                    }
                } catch (error) {
                    this.alertService.error(
                        `Stations could not be uncollapsed!, error: ${error}`,
                    );
                    return EMPTY;
                }
            }),
        ),
    );

    expandStations$ = createEffect(() =>
        this.actions$.pipe(
            ofType<groupingActions.ExpandStationsMSA>(
                groupingActions.GroupingActionTypes.ExpandStationsMSA,
            ),
            withLatestFrom(
                this.store.pipe(select(tracingSelectors.getGroupingData)),
            ),
            mergeMap(([action, state]) => {
                const stationIds = action.payload.stationIds;
                try {
                    const payload =
                        this.groupingService.getExpandStationsPayload(
                            state,
                            stationIds,
                        );

                    if (payload) {
                        return of(
                            new storeActions.SetStationGroupsSOA(payload),
                        );
                    } else {
                        return EMPTY;
                    }
                } catch (error) {
                    this.alertService.error(
                        `Stations could not be uncollapsed!, error: ${error}`,
                    );
                    return EMPTY;
                }
            }),
        ),
    );
}
