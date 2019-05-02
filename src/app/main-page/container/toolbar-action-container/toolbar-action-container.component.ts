import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store, select } from '@ngrx/store';
import * as fromTracing from '../../../tracing/state/tracing.reducers';
import * as tracingActions from '../../../tracing/state/tracing.actions';
import { takeWhile } from 'rxjs/operators';
import { DataService } from '../../../tracing/services/data.service';
import { FclData } from './../../../tracing/util/datatypes';
import { AlertService } from '../../../shared/services/alert.service';

@Component({
    selector: 'fcl-toolbar-action-container',
    templateUrl: './toolbar-action-container.component.html',
    styleUrls: ['./toolbar-action-container.component.scss']
})
export class ToolbarActionContainerComponent implements OnInit, OnDestroy {
    tracingActive: boolean;
    private componentActive: boolean = true;

    constructor(
        private store: Store<fromTracing.State>,
        private dataService: DataService,
        private alertService: AlertService
    ) { }

    ngOnInit() {
        this.store.pipe(
            select(fromTracing.getTracingActive),
            takeWhile(() => this.componentActive)
          ).subscribe(
              (tracingActive: boolean) => {
                  this.tracingActive = tracingActive;
              },
              (error) => {
                  throw new Error(`error loading tracing state: ${error}`);
              }
          );
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

    ngOnDestroy() {
        this.componentActive = false;
    }
}
