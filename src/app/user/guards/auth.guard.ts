import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AlertService } from '../../core/services/alert.service';
import { Store, select } from '@ngrx/store';
import * as fromUser from '../state/user.reducer';
import * as userActions from '../state/user.actions';
import { TokenizedUser } from '../models/user.model';
import { JwtHelperService } from '@auth0/angular-jwt';
import { map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {

    constructor(private alertService: AlertService,
                private router: Router,
                private store: Store<fromUser.State>) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        return this.store.pipe(
          select(fromUser.getCurrentUser)).pipe(
              map((currentUser: TokenizedUser) => {
                  if (currentUser) {
                      const helper = new JwtHelperService();
                      const isExpired = helper.isTokenExpired(currentUser.token);

                      if (isExpired) {
                          this.alertService.error('Not authorized, please login.');
                          this.store.dispatch(new userActions.LogoutUser());
                      }
                      return !isExpired;
                  }
                  return false;
              })
          );
    }
}
