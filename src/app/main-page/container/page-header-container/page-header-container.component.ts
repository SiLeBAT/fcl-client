import { Component, OnInit } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Store } from '@ngrx/store';
import * as fromTracing from '../../../tracing/state/tracing.reducers';
import * as tracingActions from '../../../tracing/state/tracing.actions';

@Component({
    selector: 'fcl-page-header-container',
    templateUrl: './page-header-container.component.html',
    styleUrls: ['./page-header-container.component.scss']
})
export class PageHeaderContainerComponent implements OnInit {
    appName = environment.appName;

    constructor(private store: Store<fromTracing.State>) { }

    ngOnInit() {
    }

    toggleLeftSideBar(open: boolean) {
        this.store.dispatch(new tracingActions.ToggleLeftSideBar(open));
    }
}
