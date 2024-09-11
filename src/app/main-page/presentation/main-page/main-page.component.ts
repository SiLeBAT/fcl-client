import {Component} from '@angular/core';

import {environment} from '../../../../environments/environment';
import {UserService} from '../../../user/services/user.service';
import {MainPageService} from '../../services/main-page.service';
import {Store} from '@ngrx/store';
import * as fromUser from '../../../user/state/user.reducer';
import * as userActions from '../../../user/state/user.actions';

@Component({
  selector: 'fcl-main-page',
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.scss'],
})
export class MainPageComponent {
  private isActive = false;
  appName: string = environment.appName;
  supportContact: string = environment.supportContact;

  constructor(
    public userService: UserService,
    public mainPageService: MainPageService,
    private store: Store<fromUser.State>
  ) {}

  logout() {
    this.store.dispatch(new userActions.LogoutUserMSA());
  }

  getDisplayMode() {
    let displayMode;
    if (this.isActive) {
      displayMode = 'block';
    } else {
      displayMode = 'none';
    }

    return displayMode;
  }
}
