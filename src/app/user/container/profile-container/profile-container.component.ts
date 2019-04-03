import { Component, OnInit, OnDestroy } from '@angular/core';
import { TokenizedUser } from '../../models/user.model';
import * as userActions from '../../../user/state/user.actions';
import * as fromUser from '../../../user/state/user.reducer';
import { Store, select } from '@ngrx/store';
import { takeWhile } from 'rxjs/operators';
import * as _ from 'lodash';

@Component({
    selector: 'fcl-profile-container',
    templateUrl: './profile-container.component.html',
    styleUrls: ['./profile-container.component.scss']
})
export class ProfileContainerComponent implements OnInit, OnDestroy {
    currentUser: TokenizedUser | null;
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

    ngOnDestroy() {
        this.componentActive = false;
    }

}
