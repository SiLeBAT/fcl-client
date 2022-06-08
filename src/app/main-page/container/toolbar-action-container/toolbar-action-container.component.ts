import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Store, select } from '@ngrx/store';
import * as fromTracing from '@app/tracing/state/tracing.reducers';
import * as TracingSelectors from '@app/tracing/state/tracing.selectors';
import * as tracingActions from '@app/tracing/state/tracing.actions';
import * as tracingIOActions from '@app/tracing/io/io.actions';
import * as fromEditor from '../../../graph-editor/state/graph-editor.reducer';
import * as fromUser from '../../../user/state/user.reducer';
import { FclData, GraphSettings, DataServiceData, GraphType, MapType, DataServiceInputState } from '@app/tracing/data.model';
import { AlertService } from '@app/shared/services/alert.service';
import { IOService } from '@app/tracing/io/io.service';
import { DataService } from './../../../tracing/services/data.service';
import { Utils as UIUtils } from './../../../tracing/util/ui-utils';
import { Observable, combineLatest } from 'rxjs';
import { takeWhile } from 'rxjs/operators';
import { Constants } from '@app/tracing/util/constants';
import { ExampleMenuComponent } from '@app/main-page/presentation/example-menu/example-menu.component';
import { ExampleData } from '@app/main-page/model/types';

@Component({
    selector: 'fcl-toolbar-action-container',
    templateUrl: './toolbar-action-container.component.html',
    styleUrls: ['./toolbar-action-container.component.scss']
})
export class ToolbarActionContainerComponent implements OnInit, OnDestroy {
    @ViewChild(ExampleMenuComponent) exampleMenuComponent: ExampleMenuComponent;

    tracingActive$ = this.store.pipe(
        select(TracingSelectors.getTracingActive)
    );
    graphEditorActive$ = this.store.pipe(
        select(fromEditor.isActive)
    );
    currentUser$ = this.store.pipe(
        select(fromUser.getCurrentUser)
    );
    fileName$ = this.store.pipe(
        select(TracingSelectors.selectSourceFileName)
    );

    graphSettings: GraphSettings;
    hasGisInfo = false;

    availableMapTypes: MapType[] = [];
    // the following code is commented because
    // the Black & White Map might be deactivatd only temporaryly
    // private mapTypes: MapType[] = [ MapType.MAPNIK, MapType.BLACK_AND_WHITE, MapType.SHAPE_FILE];
    private mapTypes: MapType[] = [ MapType.MAPNIK, MapType.SHAPE_FILE];

    private componentActive: boolean = true;

    constructor(
        private store: Store<fromTracing.State>,
        private alertService: AlertService,
        private ioService: IOService,
        private dataService: DataService
    ) { }

    ngOnInit() {
        const graphSettings$: Observable<GraphSettings> = this.store
            .pipe(
                select(TracingSelectors.getGraphSettings)
            );

        const dataServiceInputState$: Observable<DataServiceInputState> = this.store
            .pipe(
                select(TracingSelectors.selectDataServiceInputState)
            );

        combineLatest([
            graphSettings$,
            dataServiceInputState$
        ]).pipe(
            takeWhile(() => this.componentActive)
        ).subscribe(
            ([graphSettings, dataServiceInputState]) => {
                this.availableMapTypes = this.mapTypes.filter(
                    mapType => mapType !== MapType.SHAPE_FILE || graphSettings.shapeFileData
                );
                this.graphSettings = graphSettings;

                const dataServiceData: DataServiceData = this.dataService.getData(dataServiceInputState);
                this.hasGisInfo = UIUtils.hasVisibleStationsWithGisInfo(dataServiceData.stations);
            },
            error => {
                throw new Error(`error loading data: ${error}`);
            }
        );

    }

    loadModelFile(fileList: FileList) {
        this.store.dispatch(new tracingIOActions.LoadFclDataMSA({ dataSource: fileList }));
    }

    loadExampleDataFile(exampleData: ExampleData) {
        this.ioService.getFclData(exampleData.path)
            .then((data: FclData) => {
                this.store.dispatch(new tracingActions.LoadFclDataSuccess({ fclData: data }));

            })
            .catch(error => {
                this.alertService.error(`error during loading of example data: ${error}`);
            });
    }

    setGraphType(graphType: GraphType) {
        this.store.dispatch(new tracingActions.SetGraphTypeSOA({ graphType: graphType }));
    }

    setMapType(mapType: MapType) {
        this.store.dispatch(new tracingActions.SetMapTypeSOA({ mapType: mapType }));
    }

    loadShapeFile(fileList: FileList) {
        this.store.dispatch(new tracingIOActions.LoadShapeFileMSA({ dataSource: fileList }));
    }

    ngOnDestroy() {
        this.componentActive = false;
    }
}
