import { Component, OnInit, OnDestroy, ViewChild } from "@angular/core";
import { Store, select } from "@ngrx/store";
import * as fromTracing from "@app/tracing/state/tracing.reducers";
import * as tracingSelectors from "@app/tracing/state/tracing.selectors";
import * as tracingActions from "@app/tracing/state/tracing.actions";
import * as tracingIOActions from "@app/tracing/io/io.actions";
import * as fromEditor from "../../../graph-editor/state/graph-editor.reducer";
import * as fromUser from "../../../user/state/user.reducer";
import * as _ from "lodash";
import {
    GraphSettings,
    DataServiceData,
    GraphType,
    MapType,
    DataServiceInputState,
    AvailableMaps,
    MapSettings,
} from "@app/tracing/data.model";
import { DataService } from "./../../../tracing/services/data.service";
import { Utils as UIUtils } from "./../../../tracing/util/ui-utils";
import { Observable, combineLatest } from "rxjs";
import { take, takeWhile } from "rxjs/operators";
import { ExampleData, ModelFileType } from "@app/main-page/model/types";
import { MainPageService } from "@app/main-page/services/main-page.service";
import {
    MatLegacyDialog as MatDialog,
    MatLegacyDialogRef as MatDialogRef,
} from "@angular/material/legacy-dialog";
import {
    DialogOkCancelComponent,
    DialogOkCancelData,
} from "@app/tracing/dialog/dialog-ok-cancel/dialog-ok-cancel.component";
import { Constants } from "@app/tracing/util/constants";
import { ToolbarActionComponent } from "@app/main-page/presentation/toolbar-action/toolbar-action.component";
import { IOService } from "@app/tracing/io/io.service";
import { MAP_CONSTANTS } from "@app/tracing/util/map-constants";
import { ShowDataImportWarningsMSA } from "@app/tracing/tracing.actions";

@Component({
    selector: "fcl-toolbar-action-container",
    templateUrl: "./toolbar-action-container.component.html",
    styleUrls: ["./toolbar-action-container.component.scss"],
})
export class ToolbarActionContainerComponent implements OnInit, OnDestroy {
    @ViewChild(ToolbarActionComponent)
    toolbarActionComponent: ToolbarActionComponent;

    isModelLoaded$ = this.store.select(tracingSelectors.selectIsModelLoaded);
    tracingActive$ = this.store.select(tracingSelectors.getTracingActive);
    graphEditorActive$ = this.store.select(fromEditor.isActive);
    currentUser$ = this.store.select(fromUser.getCurrentUser);
    fileName$ = this.store.select(tracingSelectors.selectSourceFileName);
    dataImportHasWarnings$ = this.store.select(
        tracingSelectors.selectImportHasWarnings,
    );

    graphSettings: GraphSettings;
    hasGisInfo = false;
    availableMaps: AvailableMaps;

    private componentActive: boolean = true;

    constructor(
        private store: Store<fromTracing.State>,
        private mainPageService: MainPageService,
        private dataService: DataService,
        private ioService: IOService,
        public dialog: MatDialog,
    ) {}

    ngOnInit() {
        const graphSettings$: Observable<GraphSettings> = this.store.pipe(
            select(tracingSelectors.getGraphSettings),
        );

        const dataServiceInputState$: Observable<DataServiceInputState> =
            this.store.pipe(
                select(tracingSelectors.selectDataServiceInputState),
            );

        this.availableMaps = {
            tiles: MAP_CONSTANTS.tiles,
            types: [],
            mapTypeLabels: MAP_CONSTANTS.mapTypeLabels,
            tileServerLabels: MAP_CONSTANTS.tileServerLabels,
        };

        combineLatest([graphSettings$, dataServiceInputState$])
            .pipe(takeWhile(() => this.componentActive))
            .subscribe(
                ([graphSettings, dataServiceInputState]) => {
                    this.graphSettings = graphSettings;
                    this.availableMaps.types = this.graphSettings.shapeFileData
                        ? MAP_CONSTANTS.types.filter(
                              (item) => item !== MapType.TILES_ONLY,
                          )
                        : [];

                    const dataServiceData: DataServiceData =
                        this.dataService.getData(dataServiceInputState);
                    this.hasGisInfo = UIUtils.hasVisibleStationsWithGisInfo(
                        dataServiceData.stations,
                    );
                },
                (error) => {
                    throw new Error(`error loading data: ${error}`);
                },
            );
    }

    onSelectModelFileOpenMenu() {
        this.checkConditionsAndLoadFile(() => {
            this.toolbarActionComponent.openSelectModelFileMenu();
        });
    }

    loadModelFile(fileList: FileList) {
        this.loadFile(fileList);
    }

    onLoadExampleDataFile(exampleData: ExampleData) {
        this.checkConditionsAndLoadFile(() => this.loadFile(exampleData.path));
    }

    setGraphType(graphType: GraphType) {
        this.store.dispatch(
            new tracingActions.SetGraphTypeSOA({ graphType: graphType }),
        );
    }

    setMapSettings(mapSettings: MapSettings) {
        this.store.dispatch(
            new tracingActions.SetMapSettingsSOA({ mapSettings: mapSettings }),
        );
    }

    onLoadShapeFile(fileList: FileList) {
        this.store.dispatch(
            new tracingIOActions.LoadShapeFileMSA({ dataSource: fileList }),
        );
    }

    onDownloadFile(fileName: string) {
        this.mainPageService.onSave(fileName);
    }

    onSaveImage() {
        this.mainPageService.onSaveImage();
    }

    onOpenRoaLayout() {
        this.mainPageService.onROALayout();
    }

    onOpenWarningsDialog() {
        this.store.dispatch(new ShowDataImportWarningsMSA());
    }

    ngOnDestroy() {
        this.componentActive = false;
    }

    private checkConditionsAndLoadFile(loadFun: () => void): void {
        combineLatest([
            this.store.select(tracingSelectors.getFclData),
            this.store.select(tracingSelectors.getLastUnchangedJsonDataExtract),
        ])
            .pipe(
                take(1),
                takeWhile(() => this.componentActive),
            )
            .subscribe(
                ([fclData, lastUnchangedJsonDataExtract]) => {
                    if (_.isEmpty(lastUnchangedJsonDataExtract)) {
                        loadFun();
                    } else {
                        this.ioService
                            .hasDataChanged(
                                fclData,
                                lastUnchangedJsonDataExtract,
                            )
                            .then((dataHasChanged: boolean) => {
                                if (dataHasChanged) {
                                    const dialogRef: MatDialogRef<
                                        DialogOkCancelComponent,
                                        any
                                    > = this.openConfirmDiscardChangesDialog();

                                    if (dialogRef !== null) {
                                        dialogRef
                                            .afterClosed()
                                            // eslint-disable-next-line rxjs/no-nested-subscribe
                                            .subscribe((result) => {
                                                if (
                                                    result ===
                                                    Constants.DIALOG_OK
                                                ) {
                                                    loadFun();
                                                }
                                            });
                                    }
                                } else {
                                    loadFun();
                                }
                            });
                    }
                },
                (error) => {
                    throw new Error(
                        `error checking conditions and loading data file: ${error}`,
                    );
                },
            );
    }

    private loadFile(dataSource: string | FileList) {
        this.store.dispatch(
            new tracingIOActions.LoadFclDataMSA({ dataSource: dataSource }),
        );
    }

    private openConfirmDiscardChangesDialog(): MatDialogRef<
        DialogOkCancelComponent,
        any
    > {
        const dialogData: DialogOkCancelData = {
            title: "Save / Discard Data Changes?",
            content1: `Do you want to save the changes you made to "${this.toolbarActionComponent.getFileNameWoExt()}" ?`,
            content2: "Your changes will be lost, if you do not save them.",
            cancel: Constants.DIALOG_CANCEL,
            ok: Constants.DIALOG_DONT_SAVE,
        };
        const dialogRef: MatDialogRef<DialogOkCancelComponent, any> =
            this.dialog.open(DialogOkCancelComponent, {
                closeOnNavigation: true,
                data: dialogData,
            });

        return dialogRef;
    }
}
