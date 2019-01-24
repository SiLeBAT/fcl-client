import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { SpinnerLoaderService } from '../../core/services/spinner-loader.service';
import { UserService } from '../services/user.service';
import { AlertService } from '../../core/services/alert.service';

import * as userActions from './user.actions';
import { map, catchError, exhaustMap, mergeMap, withLatestFrom, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { Router } from '@angular/router';
import { LoginResponseDTO } from '../models/user.model';

@Injectable()
export class UserEffects {

    constructor(private actions$: Actions,
      private spinnerService: SpinnerLoaderService,
      private userService: UserService,
      private alertService: AlertService,
      private router: Router
    ) { }

    @Effect()
    loginUser$$ = this.actions$.pipe(
      ofType(userActions.UserActionTypes.LoginUser),
      tap(item => this.spinnerService.show()),
      exhaustMap((action: userActions.LoginUser) => this.userService.login(action.payload).pipe(
        map((loginResponse: LoginResponseDTO) => {
            this.spinnerService.hide();
            if (loginResponse.user && loginResponse.user.token) {
                this.alertService.success(loginResponse.title);
                this.spinnerService.hide();
                this.userService.setCurrentUser(loginResponse.user);
                this.router.navigate(['/users/main']).catch((err) => {
                    throw new Error(`Unable to navigate: ${err}`);
                });
                return new userActions.LoginUserSuccess(loginResponse.user);
            } else {
                this.alertService.error(loginResponse.title);
                return new userActions.LoginUserFailure();
            }

        }),
        catchError(() => {
            this.spinnerService.hide();
            return of(new userActions.LoginUserFailure());
        })
      ))
    );

    @Effect()
    logoutUser$ = this.actions$.pipe(
        ofType(userActions.UserActionTypes.LogoutUser),
        mergeMap(() => {
            this.router.navigate(['users/login']).catch(() => {
                throw new Error('Unable to navigate.');
            });
            return this.userService.logout();
        })
    );
}
