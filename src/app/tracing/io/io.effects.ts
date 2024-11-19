import { Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { AlertService } from "../../shared/services/alert.service";
import * as tracingStateActions from "../state/tracing.actions";
import * as tracingEffectActions from "../tracing.actions";
import * as fromTracing from "../state/tracing.reducers";
import * as tracingSelectors from "../state/tracing.selectors";
import {
    map,
    catchError,
    mergeMap,
    withLatestFrom,
    concatMap,
    take,
} from "rxjs/operators";
import { of, from, EMPTY } from "rxjs";
import { IOService } from "./io.service";
import { FclData, ShapeFileData } from "../data.model";
import { Store, select } from "@ngrx/store";
import * as ioActions from "./io.actions";
import { Utils } from "./../util/ui-utils";
import {
    InputEncodingError,
    InputFormatError,
    InputDataError,
    XlsxInputFormatError,
} from "./io-errors";
import {
    DialogOkCancelComponent,
    DialogOkCancelData,
} from "../dialog/dialog-ok-cancel/dialog-ok-cancel.component";
import { Constants } from "../util/constants";
import {
    MatLegacyDialog as MatDialog,
    MatLegacyDialogRef as MatDialogRef,
} from "@angular/material/legacy-dialog";
import { DataService } from "../services/data.service";
import { ERROR_TEXTS, ERROR_RESOLUTION_TEXTS } from "./consts";
import { joinNonEmptyTexts } from "../util/non-ui-utils";
@Injectable()
export class IOEffects {
    constructor(
        private actions$: Actions,
        private ioService: IOService,
        private alertService: AlertService,
        private dialog: MatDialog,
        private dataService: DataService,
        private store: Store<fromTracing.State>,
    ) {}

    loadFclDataMSA$ = createEffect(() =>
        this.actions$.pipe(
            ofType<ioActions.LoadFclDataMSA>(
                ioActions.IOActionTypes.LoadFclDataMSA,
            ),
            mergeMap((action) => {
                this.store.dispatch(
                    new tracingStateActions.SetFclDataLoadingSOA(),
                );

                const dataSource: string | FileList = action.payload.dataSource;
                let source: string | File;
                if (dataSource instanceof FileList && dataSource.length === 1) {
                    source = dataSource[0];
                } else if (typeof dataSource === "string") {
                    source = dataSource;
                } else {
                    this.alertService.error(
                        "Please select a .json file with the correct format!",
                    );
                    return of(new tracingStateActions.LoadFclDataFailureSOA());
                }
                return from(this.ioService.getFclData(source)).pipe(
                    concatMap((result: FclData) =>
                        of(
                            new tracingStateActions.LoadFclDataSuccessSOA({
                                fclData: result,
                            }),
                            new tracingEffectActions.SetLastUnchangedJsonDataExtractMSA(),
                        ),
                    ),
                    catchError((error) => {
                        let errorMsgs: string[] = [
                            ERROR_TEXTS.dataUploadFailed,
                        ];
                        if (error instanceof InputEncodingError) {
                            errorMsgs.push(ERROR_RESOLUTION_TEXTS.uploadUTF8);
                        } else if (error instanceof XlsxInputFormatError) {
                            errorMsgs = [
                                ERROR_TEXTS.invalidDataFormat,
                                ERROR_RESOLUTION_TEXTS.uploadAllInOneTemplate,
                                error.message,
                            ];
                        } else if (error instanceof InputFormatError) {
                            errorMsgs.push(
                                ERROR_RESOLUTION_TEXTS.uploadFclJsonWithValidFormat,
                                error.message,
                            );
                        } else if (error instanceof InputDataError) {
                            errorMsgs.push(
                                ERROR_RESOLUTION_TEXTS.uploadFclJsonWithValidData,
                                error.message,
                            );
                        } else {
                            errorMsgs.push(
                                ERROR_TEXTS.generalError,
                                error.message,
                            );
                        }

                        this.alertService.error(
                            joinNonEmptyTexts(errorMsgs, " "),
                        );
                        return of(
                            new tracingStateActions.LoadFclDataFailureSOA(),
                        );
                    }),
                );
            }),
        ),
    );

    loadShapeFileMSA$ = createEffect(() =>
        this.actions$.pipe(
            ofType<ioActions.LoadShapeFileMSA>(
                ioActions.IOActionTypes.LoadShapeFileMSA,
            ),
            mergeMap((action) => {
                const fileList: FileList = action.payload.dataSource;
                if (fileList.length === 1) {
                    return from(
                        this.ioService.getShapeFileData(fileList[0]),
                    ).pipe(
                        map(
                            (data: ShapeFileData) =>
                                new tracingStateActions.LoadShapeFileSuccessSOA(
                                    { shapeFileData: data },
                                ),
                        ),
                        catchError((error) => {
                            let errorMsg = "Data cannot be loaded.";
                            if (error instanceof InputEncodingError) {
                                errorMsg +=
                                    " Please ensure to load only data encoded in UTF-8.";
                            } else if (error instanceof InputFormatError) {
                                errorMsg += ` ${error.message ? error.message : "Invalid .geojson format."}`;
                            } else if (error instanceof InputDataError) {
                                errorMsg += ` ${error.message ? error.message : "Invalid data."}`;
                            } else {
                                errorMsg += ` Error: ${error.message}`;
                            }
                            this.alertService.error(errorMsg);
                            return of(
                                new tracingStateActions.LoadShapeFileFailureMSA(),
                            );
                        }),
                    );
                } else {
                    return of(
                        new tracingStateActions.LoadShapeFileFailureMSA(),
                    );
                }
            }),
        ),
    );

    saveFclData$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType<ioActions.SaveFclDataMSA>(
                    ioActions.IOActionTypes.SaveFclDataMSA,
                ),
                withLatestFrom(
                    this.store.pipe(select(tracingSelectors.getFclData)),
                    this.store.pipe(
                        select(tracingSelectors.selectDataServiceInputState),
                    ),
                ),
                mergeMap(([action, fclData, dataServiceState]) =>
                    from(this.ioService.getExportData(fclData)).pipe(
                        mergeMap((exportData) => {
                            if (!action.payload.disableAnonymizationNote) {
                                const anoIsActive =
                                    this.dataService.getData(
                                        dataServiceState,
                                    ).isStationAnonymizationActive;
                                if (anoIsActive) {
                                    const dialogData: DialogOkCancelData = {
                                        title: "Download data",
                                        content1: `You are currently displaying anonymised station names. Please note that FCL web\nsaves the original data and not the anonymised data to the JSON file.`,
                                        content2: "Would you like to proceed?",
                                        cancel: Constants.DIALOG_CANCEL,
                                        ok: Constants.DIALOG_SAVE,
                                    };
                                    const dialogRef: MatDialogRef<
                                        DialogOkCancelComponent,
                                        any
                                    > = this.dialog.open(
                                        DialogOkCancelComponent,
                                        {
                                            closeOnNavigation: true,
                                            data: dialogData,
                                        },
                                    );

                                    dialogRef
                                        .afterClosed()
                                        .pipe(take(1))
                                        .subscribe((result) => {
                                            if (
                                                result === Constants.DIALOG_OK
                                            ) {
                                                this.store.dispatch(
                                                    new ioActions.SaveFclDataMSA(
                                                        {
                                                            ...action.payload,
                                                            disableAnonymizationNote:
                                                                true,
                                                        },
                                                    ),
                                                );
                                            }
                                        });
                                    return EMPTY;
                                }
                            }

                            if (exportData) {
                                const blob = new Blob(
                                    [JSON.stringify(exportData)],
                                    { type: "application/json" },
                                );
                                let fileName: string = "data.json";
                                if (
                                    fileName !== undefined ||
                                    fileName !== null
                                ) {
                                    fileName = `${action.payload.fileName}.json`;
                                }

                                const url = window.URL.createObjectURL(blob);

                                Utils.openSaveDialog(url, fileName);
                                window.URL.revokeObjectURL(url);

                                this.store.dispatch(
                                    new tracingEffectActions.SetLastUnchangedJsonDataExtractMSA(),
                                );
                            }
                            return EMPTY;
                        }),
                        catchError((error) => {
                            if (error) {
                                this.alertService.error(
                                    `File could not be saved!, error: ${error}`,
                                );
                            }
                            return EMPTY;
                        }),
                    ),
                ),
            ),
        { dispatch: false },
    );

    saveGraphImage$ = createEffect(
        () =>
            this.actions$.pipe(
                ofType<ioActions.SaveGraphImageMSA>(
                    ioActions.IOActionTypes.SaveGraphImageMSA,
                ),
                mergeMap((action) => {
                    const canvas = action.payload.canvas;
                    const fileName = "graph.png";
                    try {
                        if (canvas.toBlob) {
                            canvas.toBlob((blob: any) => {
                                Utils.openSaveBlobDialog(blob, fileName);
                            });
                        } else {
                            Utils.openSaveDialog(
                                canvas.toDataURL("image/png"),
                                fileName,
                            );
                        }
                    } catch (error) {
                        this.alertService.error(
                            `Graph image could not be saved!, error: ${error}`,
                        );
                    }
                    return EMPTY;
                }),
            ),
        { dispatch: false },
    );
}
