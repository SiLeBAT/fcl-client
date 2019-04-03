import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';

import {
  LoginCredentials, LoginResponseDTO, TokenizedUser, RegistrationCredentials,
  Email, TitleResponseDTO, AdminActivateResponseDTO, NewPassword
} from '../models/user.model';
import { DataRequestService } from '../../core/services/data-request.service';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private currentUser: TokenizedUser;

    private URL = {
        login: '/users/login',
        register: '/users/register',
        recovery: '/users/recovery',
        reset: '/users/reset',
        activate: '/users/activate',
        adminactivate: '/users/adminactivate'
    };

    constructor(private dataService: DataRequestService) { }

    register(credentials: RegistrationCredentials): Observable<TitleResponseDTO> {
        return this.dataService.post<TitleResponseDTO, RegistrationCredentials>(this.URL.register, credentials);
    }

    recoverPassword(email: Email): Observable<TitleResponseDTO> {
        return this.dataService.post<TitleResponseDTO, Email>(this.URL.recovery, email);
    }

    resetPassword(newPw: NewPassword, token: String): Observable<TitleResponseDTO> {
        return this.dataService.post<TitleResponseDTO, NewPassword>([this.URL.reset, token].join('/'), newPw);
    }

    activateAccount(token: String): Observable<TitleResponseDTO> {
        return this.dataService.post<TitleResponseDTO, string>([this.URL.activate, token].join('/'), null);
    }

    adminActivateAccount(adminToken: String): Observable<AdminActivateResponseDTO> {
        return this.dataService.post<AdminActivateResponseDTO, string>([this.URL.adminactivate, adminToken].join('/'), null);
    }

    login(credentials: LoginCredentials): Observable<LoginResponseDTO> {
        return this.dataService.post<LoginResponseDTO, LoginCredentials>(this.URL.login, credentials);
    }

    logout() {
        localStorage.removeItem('currentUser');
        return new Observable<void>();
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

    setCurrentUser(user: TokenizedUser) {
        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
    }

    getCurrentUser(): TokenizedUser {
        if (!this.currentUser) {
            this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
        }

        return this.currentUser;
    }
}
