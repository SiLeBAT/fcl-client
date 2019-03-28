import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import * as fromTracing from '../../../tracing/state/tracing.reducers';
import * as tracingActions from '../../../tracing/state/tracing.actions';

@Component({
    selector: 'fcl-toolbar-action-container',
    templateUrl: './toolbar-action-container.component.html',
    styleUrls: ['./toolbar-action-container.component.scss']
})
export class ToolbarActionContainerComponent implements OnInit {

    constructor(private store: Store<fromTracing.State>) { }

    ngOnInit() {
    }

    toggleRightSidebar(open: boolean) {
        this.store.dispatch(new tracingActions.ToggleRightSideBar(open));
    }
}
