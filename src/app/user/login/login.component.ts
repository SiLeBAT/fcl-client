import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { Credentials, TokenizedUser } from '../models/user.model';
import { Store, select } from '@ngrx/store';
import * as fromUser from '../state/user.reducer';
import * as userActions from '../state/user.actions';

@Component({
  // tslint:disable-next-line:component-selector
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
    loginForm: FormGroup;
    returnUrl: string;

    constructor(
      private router: Router,
      private store: Store<fromUser.State>
    ) {}

    ngOnInit() {
        this.store.pipe(
          select(fromUser.getCurrentUser)
        ).subscribe(
          (currentUser: TokenizedUser) => {
              if (currentUser) {
                  this.router.navigate(['/users/main']).catch((err) => {
                      throw new Error(`Unable to navigate: ${err}`);
                  });

              }
          }
        );

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
        return this.loginForm.controls.password.hasError('required')
      ? 'Password is required'
      : '';
    }

    login() {
        const credentials: Credentials = {
            email: this.loginForm.value.email,
            password: this.loginForm.value.password
        };
        this.store.dispatch(new userActions.LoginUser(credentials));
        this.loginForm.reset();
    }
}
