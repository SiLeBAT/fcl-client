import { Component, OnInit } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Store, select } from '@ngrx/store';
import * as fromTracing from '../../../tracing/state/tracing.reducers';
import * as fromUser from '../../../user/state/user.reducer';
import * as tracingActions from '../../../tracing/state/tracing.actions';
import { Observable } from 'rxjs/Rx';
import { User } from '../../../user/models/user.model';

@Component({
    selector: 'fcl-page-header-container',
    templateUrl: './page-header-container.component.html',
    styleUrls: ['./page-header-container.component.scss']
})
export class PageHeaderContainerComponent implements OnInit {
    appName = environment.appName;
    tracingActive$: Observable<boolean>;
    currentUser$: Observable<User | null>;

    constructor(private store: Store<fromTracing.State>) { }

    ngOnInit() {
        this.tracingActive$ = this.store.pipe(
            select(fromTracing.getTracingActive)
        );
        this.currentUser$ = this.store.pipe(
            select(fromUser.getCurrentUser)
        );

    }

    toggleLeftSideBar(open: boolean) {
        this.store.dispatch(new tracingActions.ToggleLeftSideBar(open));
    }
}
