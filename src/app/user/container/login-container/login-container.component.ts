import { Component, OnInit, OnDestroy } from '@angular/core';
import { LoginCredentials, TokenizedUser } from '../../models/user.model';
import { Store, select } from '@ngrx/store';
import * as fromUser from '../../state/user.reducer';
import * as userActions from '../../state/user.actions';
import { takeWhile } from 'rxjs/operators';
import { Router } from '@angular/router';

@Component({
    selector: 'fcl-login-container',
    templateUrl: './login-container.component.html'
})
export class LoginContainerComponent implements OnInit, OnDestroy {
    private componentActive = true;

    constructor(private store: Store<fromUser.State>,
                private router: Router) { }

    ngOnInit() {
        this.store
            .pipe(
                select(fromUser.getCurrentUser),
                takeWhile(() => this.componentActive)
            )
            .subscribe((currentUser: TokenizedUser) => {
                if (currentUser) {
                    this.router.navigate(['/users/profile']).catch(err => {
                        throw new Error(`Unable to navigate: ${err}`);
                    });
                }
            }, (error => {
                throw new Error(`error getting current user: ${error}`);
            }));
    }

    login(credentials: LoginCredentials) {
        this.store.dispatch(new userActions.LoginUser(credentials));
    }

    ngOnDestroy() {
        this.componentActive = false;
    }
}
