import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import * as fromMainPage from '../../state/main-page.reducer';
import * as mainPageActions from '../../state/main-page.actions';
import { Store } from '@ngrx/store';

@Component({
    selector: 'fcl-dashboard-container',
    templateUrl: './dashboard-container.component.html',
    styleUrls: ['./dashboard-container.component.scss']
})
export class DashboardContainerComponent implements OnInit, OnDestroy {

    constructor(
        private router: Router,
        private store: Store<fromMainPage.MainPageState>
    ) {
        this.store.dispatch(new mainPageActions.DashboardActivated({ isActivated: true }));
    }

    ngOnInit() {
    }

    onTracingView() {
        this.router.navigate(['/tracing']).catch(err => {
            throw new Error(`Unable to navigate: ${err}`);
        });

    }

    ngOnDestroy() {
        this.store.dispatch(new mainPageActions.DashboardActivated({ isActivated: false }));
    }
}
