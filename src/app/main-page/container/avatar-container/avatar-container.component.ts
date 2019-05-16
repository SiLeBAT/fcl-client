import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store, select } from '@ngrx/store';
import * as fromUser from '../../../user/state/user.reducer';
import { Observable } from 'rxjs';
import { User } from '../../../user/models/user.model';
import * as userActions from '../../../user/state/user.actions';
import { Router } from '@angular/router';

@Component({
    selector: 'fcl-avatar-container',
    templateUrl: './avatar-container.component.html',
    styleUrls: ['./avatar-container.component.scss']
})
export class AvatarContainerComponent implements OnInit {
    currentUser$ = this.store.pipe(
        select(fromUser.getCurrentUser)
    );

    constructor(private router: Router,
        private store: Store<fromUser.State>) { }

    ngOnInit() {
    }

    onLogout() {
        this.store.dispatch(new userActions.LogoutUser());
    }

    onProfile() {
        this.router.navigate(['/users/profile']).catch(() => {
            throw new Error('Unable to navigate.');
        });
    }
}
