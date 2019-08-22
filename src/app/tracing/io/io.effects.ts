import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { AlertService } from '../../shared/services/alert.service';

import * as tracingStateActions from '../state/tracing.actions';
import * as fromTracing from '../state/tracing.reducers';
import * as tracingSelectors from '../state/tracing.selectors';
import { map, catchError, mergeMap, withLatestFrom } from 'rxjs/operators';
import { of, from, EMPTY } from 'rxjs';
import { IOService } from './io.service';
import { FclData } from '../data.model';

import { Store, select } from '@ngrx/store';

import * as ioActions from './io.actions';
import { Utils } from './../util/ui-utils';

@Injectable()
export class IOEffects {
    constructor(
        private actions$: Actions,
        private ioService: IOService,
        private alertService: AlertService,
        private store: Store<fromTracing.State>
    ) {}

    @Effect()
    loadFclDataMSA$ = this.actions$.pipe(
        ofType<ioActions.LoadFclDataMSA>(ioActions.IOActionTypes.LoadFclDataMSA),
        mergeMap(action => {
            const fileList: FileList = action.payload.dataSource;
            if (fileList.length === 1) {
                return from(this.ioService.getData(fileList[0])).pipe(
                    map((data: FclData) => new tracingStateActions.LoadFclDataSuccess({ fclData: data })),
                    catchError((error) => {
                        this.alertService.error(`Please select a .json file with the correct format!, error: ${error}`);
                        return of(new tracingStateActions.LoadFclDataFailure());
                    })
                );
            } else {
                this.alertService.error('Please select a .json file with the correct format!');
                return of(new tracingStateActions.LoadFclDataFailure());
            }
        })
    );

    @Effect()
    saveFclData$ = this.actions$.pipe(
        ofType<ioActions.SaveFclDataMSA>(ioActions.IOActionTypes.SaveFclDataMSA),
        withLatestFrom(this.store.pipe(select(tracingSelectors.getFclData))),
        mergeMap(([action, fclData]) => {
            return from(this.ioService.getExportData(fclData)).pipe(
                mergeMap(exportData => {
                    if (exportData) {
                        const blob = new Blob([JSON.stringify(exportData)], { type: 'application/json' });
                        const fileName = 'data.json';

                        if (window.navigator.msSaveOrOpenBlob != null) {
                            window.navigator.msSaveOrOpenBlob(blob, fileName);
                        } else {
                            const url = window.URL.createObjectURL(blob);

                            Utils.openSaveDialog(url, fileName);
                            window.URL.revokeObjectURL(url);
                        }
                    }
                    return EMPTY;
                }),
                catchError(error => {
                    if (error) {
                        this.alertService.error(`File could not be saved!, error: ${error}`);
                    }
                    return EMPTY;
                })
            );
        })
    );

    @Effect()
    saveGraphImage$ = this.actions$.pipe(
        ofType<ioActions.SaveGraphImageMSA>(ioActions.IOActionTypes.SaveGraphImageMSA),
        mergeMap((action) => {
            const canvas = action.payload.canvas;
            const fileName = 'graph.png';
            try {
                if (window.navigator.msSaveOrOpenBlob != null && canvas.toBlob != null) {
                    canvas.toBlob((blob: any) => {
                        window.navigator.msSaveOrOpenBlob(blob, fileName);
                    });
                } else {
                    Utils.openSaveDialog(canvas.toDataURL('image/png'), fileName);
                }
            } catch (error) {
                this.alertService.error(`Graph image could not be saved!, error: ${error}`);
            }
            return EMPTY;
        })
    );
}
