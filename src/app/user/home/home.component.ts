import { Component, OnInit } from '@angular/core';

import { TokenizedUser } from '../models/user.model';
import { Store, select } from '@ngrx/store';
import * as fromUser from '../state/user.reducer';
import * as userActions from '../state/user.actions';

@Component({
  // tslint:disable-next-line:component-selector
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
    currentUser: TokenizedUser;

    constructor(private store: Store<fromUser.State>) { }

    ngOnInit() {
        this.store.pipe(
          select(fromUser.getCurrentUser)
        ).subscribe(
          (currentUser: TokenizedUser) => this.currentUser = currentUser
        );
    }

    logout() {
        this.store.dispatch(new userActions.LogoutUser());
    }

}
