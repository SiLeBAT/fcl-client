import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { Credentials, TokenizedUser } from '../models/user.model';
import { Store, select } from '@ngrx/store';
import * as fromUser from '../state/user.reducer';
import * as userActions from '../state/user.actions';
import { takeWhile } from 'rxjs/operators';

@Component({
    selector: 'fcl-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
    loginForm: FormGroup;
    returnUrl: string;
    private componentActive = true;

    constructor(private router: Router, private store: Store<fromUser.State>) {}

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
            });

        this.loginForm = new FormGroup({
            email: new FormControl(null, [Validators.required, Validators.email]),
            password: new FormControl(null, Validators.required)
        });
    }

    getEmailErrorMessage() {
        return this.loginForm.controls.email.hasError('required')
            ? 'You must enter a valid email'
            : this.loginForm.controls.email.hasError('email')
            ? 'Not a valid email'
            : '';
    }

    getPasswordErrorMessage() {
        return this.loginForm.controls.password.hasError('required') ? 'Password is required' : '';
    }

    login() {
        const credentials: Credentials = {
            email: this.loginForm.value.email,
            password: this.loginForm.value.password
        };
        this.store.dispatch(new userActions.LoginUser(credentials));
        this.loginForm.reset();
    }

    ngOnDestroy() {
        this.componentActive = false;
    }
}
