import {Component} from '@angular/core';
import {environment} from '../../../../environments/environment';
import {Store, select} from '@ngrx/store';
import * as fromTracing from '../../../tracing/state/tracing.reducers';
import * as TracingSelectors from '../../../tracing/state/tracing.selectors';
import * as fromMainPage from '../../state/main-page.reducer';
import * as fromUser from '../../../user/state/user.reducer';
import * as tracingActions from '../../../tracing/state/tracing.actions';

@Component({
  selector: 'fcl-page-header-container',
  templateUrl: './page-header-container.component.html',
  styleUrls: ['./page-header-container.component.scss'],
})
export class PageHeaderContainerComponent {
  appName = environment.appName;
  tracingActive$ = this.store.pipe(select(TracingSelectors.getTracingActive));
  dashboardActive$ = this.store.pipe(select(fromMainPage.getDashboardActive));
  loginActive$ = this.store.pipe(select(fromUser.getLoginActive));
  currentUser$ = this.store.pipe(select(fromUser.getCurrentUser));

  constructor(private store: Store<fromTracing.State>) {}

  toggleRightSideBar(open: boolean) {
    this.store.dispatch(
      new tracingActions.ShowConfigurationSideBarSOA({
        showConfigurationSideBar: open,
      })
    );
  }
}
