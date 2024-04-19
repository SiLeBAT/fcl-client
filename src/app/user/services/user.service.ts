import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';

import {
    LoginCredentials,
    TokenizedUser,
    RegistrationRequestResponseDTO,
    RegistrationDetailsDTO,
    PasswordResetRequestResponseDTO,
    ResetRequestDTO,
    NewPasswordRequestDTO,
    PasswordResetResponseDTO,
    ActivationResponseDTO,
    TokenizedUserDTO,
    GdprConfirmationRequestDTO,
    NewsConfirmationResponseDTO
} from '../models/user.model';
import { DataRequestService } from '../../core/services/data-request.service';
import { MatDialog } from '@angular/material/dialog';
import { GdprAgreementComponent } from '../presentation/gdpr-agreement/gdpr-agreement.component';
import { InvalidRegistrationInput } from '../errors';
import { catchError } from 'rxjs/operators';
import { InvalidServerInputHttpErrorResponse } from '../../core/errors';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private currentUser: TokenizedUser | null = null;

    private URL = {
        login: '/v1/users/login',
        register: '/v1/users/registration',
        recovery: '/v1/users/reset-password-request',
        reset: '/v1/users/reset-password',
        activate: '/v1/users/verification',
        adminactivate: '/v1/users/activation',
        gdpragreement: '/v1/users/gdpr-agreement',
        newsconfirmation: '/v1/users/news-confirmation'
    };

    constructor(
        private dataService: DataRequestService,
        public dialog: MatDialog
    ) { }

    register(credentials: RegistrationDetailsDTO): Observable<RegistrationRequestResponseDTO> {
        return this.dataService.post<RegistrationRequestResponseDTO, RegistrationDetailsDTO>(this.URL.register, credentials)
            .pipe(catchError((e) => this.handleRegistrationError(e)));
    }

    recoverPassword(email: ResetRequestDTO): Observable<PasswordResetRequestResponseDTO> {
        return this.dataService.put<PasswordResetRequestResponseDTO, ResetRequestDTO>(this.URL.recovery, email);
    }

    resetPassword(newPw: NewPasswordRequestDTO, token: string): Observable<PasswordResetResponseDTO> {
        return this.dataService.patch<PasswordResetResponseDTO, NewPasswordRequestDTO>([this.URL.reset, token].join('/'), newPw);
    }

    activateAccount(token: string): Observable<ActivationResponseDTO> {
        return this.dataService.patch<ActivationResponseDTO, string | null>([this.URL.activate, token].join('/'), null);
    }

    adminActivateAccount(adminToken: string): Observable<ActivationResponseDTO> {
        return this.dataService.patch<ActivationResponseDTO, string | null>([this.URL.adminactivate, adminToken].join('/'), null);
    }

    login(credentials: LoginCredentials): Observable<TokenizedUserDTO> {
        return this.dataService.post<TokenizedUserDTO, LoginCredentials>(this.URL.login, credentials);
    }

    updateGDPRAgreement(user: GdprConfirmationRequestDTO): Observable<TokenizedUserDTO> {
        return this.dataService.put<TokenizedUserDTO, GdprConfirmationRequestDTO>(this.URL.gdpragreement, user);
    }

    confirmNewsletterSubscription(token: string): Observable<NewsConfirmationResponseDTO> {
        return this.dataService.patch<NewsConfirmationResponseDTO, string | null>([this.URL.newsconfirmation, token].join('/'), null);
    }

    logout() {
        localStorage.removeItem('currentUser');
        return new Observable<void>();
    }

    setCurrentUser(user: TokenizedUser) {
        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
    }

    getCurrentUser(): TokenizedUser | null {
        if (!this.currentUser) {
            const currentUserStr = localStorage.getItem('currentUser');
            if (currentUserStr) {
                this.currentUser = JSON.parse(currentUserStr);
            }
        }

        return this.currentUser;
    }

    openGDPRDialog(): Observable<boolean> {

        const dialogRef = this.dialog.open(GdprAgreementComponent, {
            disableClose: true,
            closeOnNavigation: true
        });

        return dialogRef.afterClosed();
    }

    private handleRegistrationError(error: unknown): never {
        if (error instanceof InvalidServerInputHttpErrorResponse) {
            throw new InvalidRegistrationInput(error);
        }
        throw error;
    }
}
