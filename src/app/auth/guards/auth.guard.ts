import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AlertService } from '../services/alert.service';

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService,
              private alertService: AlertService,
              private router: Router) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {

    if (this.authService.loggedIn()) {
      return true;
    }

    // not logged in so redirect to login page with the return url
    this.alertService.error('Not authorized, please login.');

    this.router.navigate(['/users/login']);
    return false;
  }
}
