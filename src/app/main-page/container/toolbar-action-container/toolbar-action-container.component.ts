import { Component, OnInit } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Observable } from 'rxjs';
import * as fromTracing from '@app/tracing/state/tracing.reducers';
import * as tracingActions from '@app/tracing/state/tracing.actions';
import * as fromEditor from '../../../graph-editor/state/graph-editor.reducer';
import * as fromUser from '../../../user/state/user.reducer';
import { DataService } from '@app/tracing/services/data.service';
import { FclData } from '@app/tracing/util/datatypes';
import { AlertService } from '@app/shared/services/alert.service';
import { User } from '../../../user/models/user.model';

@Component({
    selector: 'fcl-toolbar-action-container',
    templateUrl: './toolbar-action-container.component.html',
    styleUrls: ['./toolbar-action-container.component.scss']
})
export class ToolbarActionContainerComponent implements OnInit {
    tracingActive$ = this.store.pipe(
        select(fromTracing.getTracingActive)
    );
    graphEditorActive$ = this.store.pipe(
        select(fromEditor.isActive)
    );
    currentUser$ = this.store.pipe(
        select(fromUser.getCurrentUser)
    );

    constructor(
        private store: Store<fromTracing.State>,
        private dataService: DataService,
        private alertService: AlertService
    ) { }

    ngOnInit() {
    }

    toggleRightSidebar(open: boolean) {
        this.store.dispatch(new tracingActions.ToggleRightSideBar(open));
    }

    loadData(fileList: FileList) {
        this.store.dispatch(new tracingActions.LoadFclData(fileList));
    }

    loadExampleData() {
        this.dataService.setDataSource('../../../../assets/data/bbk.json');
        this.dataService
            .getData()
            .then((data: FclData) => {
                this.store.dispatch(new tracingActions.LoadFclDataSuccess(data));

            })
            .catch(error => {
                this.alertService.error(`error during loading of example data: ${error}`);
            });
    }

}
