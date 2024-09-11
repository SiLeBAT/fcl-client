import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {SpinnerLoaderService} from '../../shared/services/spinner-loader.service';
import {UserService} from '../services/user.service';
import {AlertService} from '../../shared/services/alert.service';

import * as userActions from './user.actions';
import {map, catchError, exhaustMap, mergeMap, tap} from 'rxjs/operators';
import {of} from 'rxjs';
import {Router} from '@angular/router';
import {TokenizedUserDTO} from '../models/user.model';
import {ResetTracingStateSOA} from '@app/tracing/state/tracing.actions';

@Injectable()
export class UserEffects {
  constructor(
    private actions$: Actions,
    private spinnerService: SpinnerLoaderService,
    private userService: UserService,
    private alertService: AlertService,
    private router: Router
  ) {}

  loginUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(userActions.UserActionTypes.LoginUserSSA),
      tap(item => this.spinnerService.show()),
      exhaustMap((action: userActions.LoginUserSSA) =>
        this.userService.login(action.payload).pipe(
          map((loginResponse: TokenizedUserDTO) => {
            this.spinnerService.hide();
            if (loginResponse && loginResponse.token) {
              this.spinnerService.hide();
              this.userService.setCurrentUser(loginResponse);
              this.router.navigate(['/dashboard']).catch(err => {
                throw new Error(`Unable to navigate: ${err}`);
              });
              return new userActions.UpdateUserSOA({
                currentUser: loginResponse,
              });
            } else {
              this.alertService.error('Login unsuccessful');
              return new userActions.UpdateUserSOA({currentUser: null});
            }
          }),
          catchError(() => {
            this.spinnerService.hide();
            return of(new userActions.UpdateUserSOA({currentUser: null}));
          })
        )
      )
    )
  );

  logoutUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(userActions.UserActionTypes.LogoutUserMSA),
      mergeMap(() => {
        this.router.navigate(['users/login']).catch(() => {
          throw new Error('Unable to navigate.');
        });

        this.userService.logout();
        return [
          new userActions.UpdateUserSOA({currentUser: null}),
          new ResetTracingStateSOA(),
        ];
      })
    )
  );
}
