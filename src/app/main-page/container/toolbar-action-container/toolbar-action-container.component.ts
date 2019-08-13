import { Component, OnInit } from '@angular/core';
import { Store, select } from '@ngrx/store';
import * as fromTracing from '@app/tracing/state/tracing.reducers';
import * as TracingSelectors from '@app/tracing/state/tracing.selectors';
import * as tracingActions from '@app/tracing/state/tracing.actions';
import * as tracingIOActions from '@app/tracing/io/io.actions';
import * as fromEditor from '../../../graph-editor/state/graph-editor.reducer';
import * as fromUser from '../../../user/state/user.reducer';
import { FclData } from '@app/tracing/data.model';
import { AlertService } from '@app/shared/services/alert.service';
import { IOService } from '@app/tracing/io/io.service';

@Component({
    selector: 'fcl-toolbar-action-container',
    templateUrl: './toolbar-action-container.component.html',
    styleUrls: ['./toolbar-action-container.component.scss']
})
export class ToolbarActionContainerComponent implements OnInit {
    tracingActive$ = this.store.pipe(
        select(TracingSelectors.getTracingActive)
    );
    graphEditorActive$ = this.store.pipe(
        select(fromEditor.isActive)
    );
    currentUser$ = this.store.pipe(
        select(fromUser.getCurrentUser)
    );

    constructor(
        private store: Store<fromTracing.State>,
        private alertService: AlertService,
        private ioService: IOService
    ) { }

    ngOnInit() {
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

}
