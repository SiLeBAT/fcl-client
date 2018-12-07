import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
// import { Observable } from 'rxjs';
// import { tokenNotExpired } from 'angular2-jwt';
import { JwtHelperService } from '@auth0/angular-jwt';

import { User } from '../../models/user.model';

@Injectable()
export class AuthService {
    currentUser;

    constructor(private httpClient: HttpClient,
              private router: Router,
            private activatedRoute: ActivatedRoute) { }

    login(user: User) {
        return this.httpClient
        .post('/users/login', user);
    }

    logout() {
        const url = '/users/login';
        this.router.navigate([url]).catch((err) => {
            throw new Error(`Unable to navigate: ${err}`);
        });
        if (this.router.routerState.snapshot.url === url) {
            localStorage.removeItem('currentUser');
        }
    }

    loggedIn() {
        if (localStorage.getItem('currentUser')) {
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            const helper = new JwtHelperService();
            const isExpired = helper.isTokenExpired(currentUser.token);

            return !isExpired;
        }

        return false;
    }

    setCurrentUser(user) {
        this.currentUser = user;
    }

    getCurrentUser() {
        if (!this.currentUser) {
            this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
        }

        return this.currentUser;
    }

}
