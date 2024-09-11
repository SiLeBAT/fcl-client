import {Component} from '@angular/core';
import {Store, select} from '@ngrx/store';
import * as fromUser from '../../../user/state/user.reducer';
import * as userActions from '../../../user/state/user.actions';
import {Router} from '@angular/router';

@Component({
  selector: 'fcl-avatar-container',
  templateUrl: './avatar-container.component.html',
  styleUrls: ['./avatar-container.component.scss'],
})
export class AvatarContainerComponent {
  currentUser$ = this.store.pipe(select(fromUser.getCurrentUser));

  constructor(
    private router: Router,
    private store: Store<fromUser.State>
  ) {}

  onLogout() {
    this.store.dispatch(new userActions.LogoutUserMSA());
  }

  onProfile() {
    this.router.navigate(['/users/profile']).catch(() => {
      throw new Error('Unable to navigate.');
    });
  }
}
