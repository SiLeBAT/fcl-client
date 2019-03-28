import { Component, OnInit, OnDestroy } from '@angular/core';

import { TokenizedUser } from '../models/user.model';
import { Store, select } from '@ngrx/store';
import * as fromUser from '../state/user.reducer';
import * as userActions from '../state/user.actions';
import { takeWhile } from 'rxjs/operators';

@Component({
    selector: 'fcl-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {
    currentUser: TokenizedUser;
    private componentActive = true;

    constructor(private store: Store<fromUser.State>) { }

    ngOnInit() {
        this.store.pipe(
            select(fromUser.getCurrentUser),
            takeWhile(() => this.componentActive)
        ).subscribe(
            (currentUser: TokenizedUser) => this.currentUser = currentUser
        );
    }

    logout() {
        this.store.dispatch(new userActions.LogoutUser());
    }

    ngOnDestroy(): void {
        this.componentActive = false;
    }
}
