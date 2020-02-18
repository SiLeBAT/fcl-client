import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store, select } from '@ngrx/store';
import * as fromTracing from '@app/tracing/state/tracing.reducers';
import * as TracingSelectors from '@app/tracing/state/tracing.selectors';
import * as tracingActions from '@app/tracing/state/tracing.actions';
import * as tracingIOActions from '@app/tracing/io/io.actions';
import * as fromEditor from '../../../graph-editor/state/graph-editor.reducer';
import * as fromUser from '../../../user/state/user.reducer';
import { FclData, GraphSettings, BasicGraphState, DataServiceData, GraphType } from '@app/tracing/data.model';
import { AlertService } from '@app/shared/services/alert.service';
import { IOService } from '@app/tracing/io/io.service';
import { DataService } from './../../../tracing/services/data.service';
import { Utils as UIUtils } from './../../../tracing/util/ui-utils';
import { Observable, combineLatest } from 'rxjs';
import { takeWhile } from 'rxjs/operators';

@Component({
    selector: 'fcl-toolbar-action-container',
    templateUrl: './toolbar-action-container.component.html',
    styleUrls: ['./toolbar-action-container.component.scss']
})
export class ToolbarActionContainerComponent implements OnInit, OnDestroy {
    tracingActive$ = this.store.pipe(
        select(TracingSelectors.getTracingActive)
    );
    graphEditorActive$ = this.store.pipe(
        select(fromEditor.isActive)
    );
    currentUser$ = this.store.pipe(
        select(fromUser.getCurrentUser)
    );

    graphSettings: GraphSettings;
    hasGisInfo = false;

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

        const basicGraphData$: Observable<BasicGraphState> = this.store
            .pipe(
                select(TracingSelectors.getBasicGraphData)
        );

        combineLatest([
            graphSettings$,
            basicGraphData$
        ]).pipe(
            takeWhile(() => this.componentActive)
        ).subscribe(
            ([graphSettings, basicGraphData]) => {
                this.graphSettings = graphSettings;

                const dataServiceData: DataServiceData = this.dataService.getData(basicGraphData);
                this.hasGisInfo = UIUtils.hasVisibleStationsWithGisInfo(dataServiceData.stations);
            },
            error => {
                throw new Error(`error loading data: ${error}`);
            }
        );

    }

    toggleRightSidebar(open: boolean) {
        this.store.dispatch(new tracingActions.ShowDataTableSOA({ showDataTable: open }));
    }

    loadData(fileList: FileList) {
        this.store.dispatch(new tracingIOActions.LoadFclDataMSA({ dataSource: fileList }));
    }

    loadExampleData() {
        this.ioService.getData('../../../../assets/data/bbk.json')
            .then((data: FclData) => {
                this.store.dispatch(new tracingActions.LoadFclDataSuccess({ fclData: data }));

            })
            .catch(error => {
                this.alertService.error(`error during loading of example data: ${error}`);
            });
    }

    setGraphType(graphType: GraphType) {
        this.store.dispatch(new tracingActions.SetGraphTypeSOA(graphType));
    }

    ngOnDestroy() {
        this.componentActive = false;
    }
}
