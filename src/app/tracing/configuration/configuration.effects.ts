import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as fromTracing from '../state/tracing.reducers';
import { mergeMap, take, withLatestFrom } from 'rxjs/operators';
import { EMPTY } from 'rxjs';
import { select, Store } from '@ngrx/store';
import { Option, DialogSelectData, DialogSelectComponent, DialogResultData } from '../dialog/dialog-select/dialog-select.component';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { SelectFilterTableColumnsMSA, ConfigurationActionTypes, DeleteHighlightingRuleSSA } from './configuration.actions';
import { TableType } from './model';
import {
    SetFilterStationTableColumnOrderSOA, SetFilterDeliveryTableColumnOrderSOA, SetStationHighlightingRulesSOA,
    SetDeliveryHighlightingRulesSOA
} from '../state/tracing.actions';
import { DialogYesNoComponent, DialogYesNoData } from '../dialog/dialog-yes-no/dialog-yes-no.component';
import { selectHighlightingSettings } from '../state/tracing.selectors';
import { EditHighlightingService } from './edit-highlighting.service';
import { TableColumn } from '../data.model';
import * as _ from 'lodash';
import { Constants } from '../util/constants';

@Injectable()
export class ConfigurationEffects {
    constructor(
        private editHighlightingService: EditHighlightingService,
        private actions$: Actions,
        private dialogService: MatDialog,
        private store: Store<fromTracing.State>
    ) {}

    selectFilterTableColumnsMSA$ = createEffect(
        () => this.actions$.pipe(
            ofType<SelectFilterTableColumnsMSA>(ConfigurationActionTypes.SelectFilterTableColumnsMSA),
            mergeMap(action => {

                const tableType = action.payload.type;
                const oldColumnOrder = action.payload.columnOrder;
                const mapColumnToOption: (c: TableColumn) => Option = (column) => {
                    const isAnoColumn = column.id === Constants.COLUMN_ANONYMIZED_NAME;
                    return {
                        value: column.id,
                        viewValue: column.name,
                        selected: oldColumnOrder.includes(column.id),
                        disabled: column.dataIsUnavailable && isAnoColumn,
                        notRecommended: column.dataIsUnavailable,
                        tooltip: column.dataIsUnavailable ? 'Data is not available.' : ''
                    };
                };
                const dialogData: DialogSelectData = {
                    title: tableType === TableType.STATIONS ?
                        'Station Columns' : 'Delivery Columns',
                    sorting: action.payload.columnOrder,
                    favouriteOptions: action.payload.favouriteColumns.map(mapColumnToOption),
                    otherOptions: action.payload.otherColumns.map(mapColumnToOption)
                };

                this.dialogService.open(DialogSelectComponent, { data: dialogData }).afterClosed()
                    .pipe(
                        take(1)
                    ).subscribe((result: DialogResultData) => {
                        if (result && result.sorting) {
                            if (tableType === TableType.STATIONS) {
                                this.store.dispatch(new SetFilterStationTableColumnOrderSOA({ columnOrder: result.sorting }));
                            } else if (tableType === TableType.DELIVERIES) {
                                this.store.dispatch(new SetFilterDeliveryTableColumnOrderSOA({ columnOrder: result.sorting }));
                            }
                        }
                    },
                    error => {
                        throw new Error(`error loading dialog or selecting columns: ${error}`);
                    });
                return EMPTY;
            })
        ),
        { dispatch: false }
    );

    DeleteHighlightingRuleSSA$ = createEffect(
        () => this.actions$.pipe(
            ofType<DeleteHighlightingRuleSSA>(ConfigurationActionTypes.DeleteHighlightingRuleSSA),
            withLatestFrom(this.store.pipe(select(selectHighlightingSettings))),
            mergeMap(([action, state]) => {
                const deleteRuleId = action.payload.deleteRequestData.ruleId;
                const stationRuleToDelete = state.stations.find(rule => rule.id === deleteRuleId) || null;
                const deliveryRuleToDelete =
                    stationRuleToDelete !== null ?
                        null :
                        (state.deliveries.find(rule => rule.id === deleteRuleId) || null);

                const ruleToDelete = stationRuleToDelete || deliveryRuleToDelete;

                if (ruleToDelete !== null) {

                    const xPos = (action.payload.deleteRequestData.xPos - 350).toString(10).concat('px');
                    const yPos = (action.payload.deleteRequestData.yPos - 140).toString(10).concat('px');

                    const position = {
                        top: yPos,
                        left: xPos
                    };

                    const dialogData: DialogYesNoData = {
                        title: `Are you sure you want to delete the '${ruleToDelete.name}' highlighting rule?`,
                        position: position
                    };

                    const dialogConfig = new MatDialogConfig();
                    dialogConfig.position = position;
                    dialogConfig.data = dialogData;

                    this.dialogService.open(DialogYesNoComponent, dialogConfig).afterClosed()
                        .pipe(
                            take(1)
                        ).subscribe((result) => {
                            if (result === true) {
                                if (stationRuleToDelete !== null) {
                                    const newRules = this.editHighlightingService.removeRule(state.stations, deleteRuleId);
                                    this.store.dispatch(new SetStationHighlightingRulesSOA({ rules: newRules }));
                                } else {
                                    const newRules = this.editHighlightingService.removeRule(state.deliveries, deleteRuleId);
                                    this.store.dispatch(new SetDeliveryHighlightingRulesSOA({ rules: newRules }));
                                }
                            }
                        },
                        error => {
                            throw new Error(`error loading YesNo dialog: ${error}`);
                        });
                }
                return EMPTY;
            })
        ),
        { dispatch: false }
    );
}
