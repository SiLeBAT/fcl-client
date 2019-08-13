import { Constants } from '../util/constants';
import { Component, OnInit, OnDestroy } from '@angular/core';

import { TableSettings, FclData } from '../data.model';
import * as fromTracing from '../state/tracing.reducers';
import * as TracingSelectors from '../state/tracing.selectors';
import * as tracingActions from '../state/tracing.actions';
import { Store, select } from '@ngrx/store';
import { takeWhile, take } from 'rxjs/operators';
import { Utils } from '../util/utils';
import { DialogSelectData, DialogSelectComponent } from '../dialog/dialog-select/dialog-select.component';
import { MatDialog } from '@angular/material';
import { DataService } from '../services/data.service';

@Component({
    selector: 'fcl-table-settings',
    templateUrl: './table-settings.component.html',
    styleUrls: ['./table-settings.component.scss']
})
export class TableSettingsComponent implements OnInit, OnDestroy {

    tableModes = Constants.TABLE_MODES;
    showTypes = Constants.SHOW_TYPES;
    tableSettings: TableSettings;

    private componentActive: boolean = true;
    private cachedState: FclData;

    constructor(
        private store: Store<fromTracing.State>,
        private dialogService: MatDialog,
        private dataService: DataService
    ) { }

    ngOnInit() {
        this.store.pipe(
            select(TracingSelectors.getFclData),
            takeWhile(() => this.componentActive)
        ).subscribe(
            (data: FclData) => {
                this.cachedState = data;
                this.tableSettings = data.tableSettings;
            }, (error => {
                throw new Error(`error loading data: ${error}`);
            })
        );
    }

    setTableMode() {
        this.store.dispatch(new tracingActions.SetTableModeSOA(this.tableSettings.mode));
    }

    setTableShowType() {
        this.store.dispatch(new tracingActions.SetTableShowTypeSOA(this.tableSettings.showType));
    }

    changeColumns() {
        const options: {
            value: string;
            viewValue: string;
            selected: boolean;
        }[] = [];

        for (const column of Utils.getAllTableProperties(
            this.cachedState.tableSettings.mode,
            this.dataService.getData({
                fclElements: this.cachedState.fclElements,
                groupSettings: this.cachedState.groupSettings,
                tracingSettings: this.cachedState.tracingSettings,
                highlightingSettings: this.cachedState.graphSettings.highlightingSettings,
                selectedElements: this.cachedState.graphSettings.selectedElements
            })
        )) {
            options.push({
                value: column,
                viewValue: Constants.PROPERTIES.has(column) ? Constants.PROPERTIES.get(column).name : '"' + column + '"',
                selected: Utils.getTableProperties(
                    this.cachedState.tableSettings.mode,
                    this.cachedState.tableSettings.stationColumns,
                    this.cachedState.tableSettings.deliveryColumns
                ).includes(column)
            });
        }

        const dialogData: DialogSelectData = {
            title: 'Input',
            options: options
        };

        this.dialogService.open(DialogSelectComponent, { data: dialogData }).afterClosed()
            .pipe(
                take(1)
            ).subscribe((selections: string[]) => {
                if (selections != null) {
                    this.store.dispatch(new tracingActions.SetTableColumnsSOA([this.cachedState.tableSettings.mode, selections]));
                }
            },
            error => {
                throw new Error(`error loading dialog or selecting columns: ${error}`);
            });
    }

    ngOnDestroy() {
        this.componentActive = false;
    }
}
