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
        login: '/api/v1/users/login',
        register: '/api/v1/users/register',
        recovery: '/api/v1/users/recovery',
        reset: '/api/v1/users/reset',
        activate: '/api/v1/users/activate',
        adminactivate: '/api/v1/users/adminactivate'
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
