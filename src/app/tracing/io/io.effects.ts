import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { AlertService } from '../../shared/services/alert.service';
import * as tracingStateActions from '../state/tracing.actions';
import * as fromTracing from '../state/tracing.reducers';
import * as tracingSelectors from '../state/tracing.selectors';
import { map, catchError, mergeMap, withLatestFrom } from 'rxjs/operators';
import { of, from, EMPTY } from 'rxjs';
import { IOService } from './io.service';
import { FclData, ShapeFileData } from '../data.model';
import { Store, select } from '@ngrx/store';
import * as ioActions from './io.actions';
import { Utils } from './../util/ui-utils';
import { InputEncodingError, InputFormatError, InputDataError } from './io-errors';

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
                return from(this.ioService.getFclData(fileList[0])).pipe(
                    map((data: FclData) => new tracingStateActions.LoadFclDataSuccess({ fclData: data })),
                    catchError((error) => {
                        let errorMsg = `Data cannot be uploaded.`;
                        if (error instanceof InputEncodingError) {
                            errorMsg += ` Please ensure to upload only data encoded in UTF-8 format.`;
                        } else if (error instanceof InputFormatError) {
                            errorMsg += ` Please select a .json file with the correct format!${error.message ? ' ' + error.message + '' : ''}`;
                        } else if (error instanceof InputDataError) {
                            errorMsg += ` Please select a .json file with valid data!${error.message ? ' ' + error.message + '' : ''}`;
                        } else {
                            errorMsg += ` Error: ${ error.message }`;
                        }
                        this.alertService.error(errorMsg);
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
    loadShapeFileMSA$ = this.actions$.pipe(
        ofType<ioActions.LoadShapeFileMSA>(ioActions.IOActionTypes.LoadShapeFileMSA),
        mergeMap(action => {
            const fileList: FileList = action.payload.dataSource;
            if (fileList.length === 1) {
                return from(this.ioService.getShapeFileData(fileList[0])).pipe(
                    map((data: ShapeFileData) => new tracingStateActions.LoadShapeFileSuccessSOA({ shapeFileData: data })),
                    catchError((error) => {
                        let errorMsg = `Data cannot be loaded.`;
                        if (error instanceof InputEncodingError) {
                            errorMsg += ` Please ensure to load only data encoded in UTF-8.`;
                        } else if (error instanceof InputFormatError) {
                            errorMsg += ` ${ error.message ? error.message : 'Invalid .geojson format.'}`;
                        } else if (error instanceof InputDataError) {
                            errorMsg += ` ${ error.message ? error.message : 'Invalid data.'}`;
                        } else {
                            errorMsg += ` Error: ${ error.message }`;
                        }
                        this.alertService.error(errorMsg);
                        return of(new tracingStateActions.LoadShapeFileFailureMSA());
                    })
                );
            } else {
                return of(new tracingStateActions.LoadShapeFileFailureMSA());
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
                if (canvas.toBlob) {
                    canvas.toBlob((blob: any) => {
                        Utils.openSaveBlobDialog(blob, fileName);
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
