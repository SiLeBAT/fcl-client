import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '../services/auth.service';
import { AlertService } from '../services/alert.service';
import { User } from '../../models/user.model';
import { SpinnerLoaderService } from '../../shared/spinner-loader/spinner-loader.service';

@Component({
  // tslint:disable-next-line:component-selector
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
    loginForm: FormGroup;
    loading = false;
    returnUrl: string;

    constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private alertService: AlertService,
    private spinnerService: SpinnerLoaderService
  ) {}

    ngOnInit() {
    // reset login status
        this.authService.logout();

    // get return url from route parameters or default to '/'
        this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/main';

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
        this.loading = true;

        const user = new User(
      this.loginForm.value.email,
      this.loginForm.value.password
    );

        this.spinnerService.show();

        this.authService.login(user).subscribe(
      data => {
          this.spinnerService.hide();
          this.loginForm.reset();
          if (!data['obj']['token']) {
              this.alertService.error(data['title']);
          } else {
              this.alertService.success(data['title']);
              const currentUser = data['obj'];
              if (currentUser && currentUser.token) {
            // store user details and jwt token in local storage to keep user logged in between page refreshes
                  localStorage.setItem('currentUser', JSON.stringify(currentUser));
                  this.authService.setCurrentUser(currentUser);
              }
              this.router.navigate([this.returnUrl]).catch((err) => {
                  throw new Error(`Unable to navigate: ${err}`);
              });
          }
      },
      () => {
          this.spinnerService.hide();
          this.loginForm.reset();
          this.loading = false;
      }
    );
    }
}
