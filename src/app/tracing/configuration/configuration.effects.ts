import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { AlertService } from '../../shared/services/alert.service';
import * as fromTracing from '../state/tracing.reducers';
import { mergeMap, take, withLatestFrom } from 'rxjs/operators';
import { EMPTY } from 'rxjs';
import { select, Store } from '@ngrx/store';
import { DialogSelectData, DialogSelectComponent } from '../dialog/dialog-select/dialog-select.component';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { SelectFilterTableColumnsMSA, ConfigurationActionTypes, DeleteStationHighlightingRuleSSA } from './configuration.actions';
import { TableType } from './model';
import { SetFilterStationTableColumnOrderSOA, SetFilterDeliveryTableColumnOrderSOA, SetStationHighlightingRulesSOA } from '../state/tracing.actions';
import { DialogYesNoComponent, DialogYesNoData } from '../dialog/dialog-yes-no/dialog-yes-no.component';
import { selectStationHighlightingSettings } from '../state/tracing.selectors';

@Injectable()
export class ConfigurationEffects {
    constructor(
        private actions$: Actions,
        private dialogService: MatDialog,
        private alertService: AlertService,
        private store: Store<fromTracing.State>
    ) {}

    @Effect()
    selectFilterTableColumnsMSA$ = this.actions$.pipe(
        ofType<SelectFilterTableColumnsMSA>(ConfigurationActionTypes.SelectFilterTableColumnsMSA),
        mergeMap(action => {

            const tableType = action.payload.type;
            const oldColumnOrder = action.payload.columnOrder;
            const columnOptions = action.payload.columns.map(c => ({
                value: c.id,
                viewValue: c.name,
                selected: oldColumnOrder.includes(c.id)
            }));

            const dialogData: DialogSelectData = {
                title: 'Show Columns',
                options: columnOptions
            };

            this.dialogService.open(DialogSelectComponent, { data: dialogData }).afterClosed()
                .pipe(
                    take(1)
                ).subscribe((selections: string[]) => {
                    if (selections != null) {
                        // assumption, the selection is unordered
                        const newColumnOrder = [].concat(
                            oldColumnOrder.filter(prop => selections.includes(prop)),
                            selections.filter(prop => !oldColumnOrder.includes(prop))
                        );
                        if (tableType === TableType.STATIONS) {
                            this.store.dispatch(new SetFilterStationTableColumnOrderSOA({ columnOrder: newColumnOrder }));
                        } else if (tableType === TableType.DELIVERIES) {
                            this.store.dispatch(new SetFilterDeliveryTableColumnOrderSOA({ columnOrder: newColumnOrder }));
                        }
                    }
                },
                error => {
                    throw new Error(`error loading dialog or selecting columns: ${error}`);
                });
            return EMPTY;
        })
    );

    @Effect()
    DeleteStationHighlightingRulesSSA$ = this.actions$.pipe(
        ofType<DeleteStationHighlightingRuleSSA>(ConfigurationActionTypes.DeleteStationHighlightingRuleSSA),
        withLatestFrom(this.store.pipe(select(selectStationHighlightingSettings))),
        mergeMap(([action, state]) => {
            const oldRules = state;
            const deleteRuleId = action.payload.deleteRequestData.ruleId;
            const ruleToDelete = oldRules.find(rule => rule.id === deleteRuleId) || null;

            if (ruleToDelete !== null) {

                const newRules = oldRules.filter(rule => rule.id !== deleteRuleId);
                const xPos = (action.payload.deleteRequestData.xPos - 350).toString(10).concat('px');
                const yPos = (action.payload.deleteRequestData.yPos - 140).toString(10).concat('px');

                const position = {
                    top: yPos,
                    left: xPos
                };

                const dialogData: DialogYesNoData = {
                    title: `Really delete the '${ruleToDelete.name}' highlighting rule?`,
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
                            this.store.dispatch(new SetStationHighlightingRulesSOA(
                                { rules: newRules }
                            ));
                        }
                    },
                    error => {
                        throw new Error(`error loading YesNo dialog: ${error}`);
                    });
            }
            return EMPTY;
        })
    );
}
