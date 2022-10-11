import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed, async } from '@angular/core/testing';
import { UserService } from './user.service';
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
    TokenizedUserDTO
} from '../models/user.model';
import { MatDialog } from '@angular/material/dialog';

describe('UserService', () => {

    let userService: UserService;
    let httpTestingController: HttpTestingController;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [
                HttpClientTestingModule
            ],
            providers: [
                { provide: MatDialog, useValue: {} },
                UserService
            ]
        });
        userService = TestBed.inject(UserService);
        httpTestingController = TestBed.inject(HttpTestingController);
    }));

    afterEach(() => {
        if (httpTestingController) {
            httpTestingController.verify();
        }
    });

    it('should instantiate the user service', () => {
        expect(userService).toBeTruthy();
    });

    it('should instantiate the httpTestingController', () => {
        expect(httpTestingController).toBeTruthy();
    });

    it('should login correctly', () => {
        const expectedResponse: TokenizedUserDTO = {
            email: 'test',
            firstName: 'test',
            lastName: 'test',
            instituteId: 'test',
            token: 'test',
            gdprAgreementRequested: false
        };

        const loginCredentials: LoginCredentials = {
            email: 'test',
            password: 'test'
        };
        userService.login(loginCredentials)
            .subscribe((currentResponse: TokenizedUserDTO) => {
                expect(currentResponse).toMatchObject(expectedResponse);
            });

        const request = httpTestingController.expectOne('/v1/users/login');

        expect(request.request.method).toEqual('POST');

        request.flush(expectedResponse);
    });

    it('should register correctly', () => {
        const expectedResponse: RegistrationRequestResponseDTO = {
            registerRequest: true,
            email: 'test'
        };

        const registrationCredentials: RegistrationDetailsDTO = {
            email: 'test',
            password: 'test',
            firstName: 'test',
            lastName: 'test',
            instituteId: 'test',
            dataProtectionAgreed: true,
            newsRegAgreed: true,
            newsMailAgreed: true
        };

        userService.register(registrationCredentials)
            .subscribe((currentResponse: RegistrationRequestResponseDTO) => {
                expect(currentResponse).toMatchObject(expectedResponse);
            });

        const request = httpTestingController.expectOne('/v1/users/registration');

        expect(request.request.method).toEqual('POST');

        request.flush(expectedResponse);
    });

    it('should recover the password correctly', () => {
        const expectedResponse: PasswordResetRequestResponseDTO = {
            passwordResetRequest: true,
            email: 'test'
        };

        const resetRequest: ResetRequestDTO = {
            email: 'test'
        };

        userService.recoverPassword(resetRequest)
            .subscribe((currentResponse: PasswordResetRequestResponseDTO) => {
                expect(currentResponse).toMatchObject(expectedResponse);
            });

        const request = httpTestingController.expectOne('/v1/users/reset-password-request');

        expect(request.request.method).toEqual('PUT');

        request.flush(expectedResponse);
    });

    it('should reset the password correctly', () => {
        const expectedResponse: PasswordResetResponseDTO = {
            passwordReset: true
        };
        const token = 'test';

        const resetRequest: NewPasswordRequestDTO = {
            password: 'test'
        };

        userService.resetPassword(resetRequest, token)
            .subscribe((currentResponse: PasswordResetResponseDTO) => {
                expect(currentResponse).toMatchObject(expectedResponse);
            });

        const request = httpTestingController.expectOne(['/v1/users/reset-password', token].join('/'));

        expect(request.request.method).toEqual('PATCH');

        request.flush(expectedResponse);
    });

    it('should activate the account correctly', () => {
        const expectedResponse: ActivationResponseDTO = {
            activation: true,
            username: 'test'
        };
        const token = 'test';

        userService.activateAccount(token)
            .subscribe((currentResponse: ActivationResponseDTO) => {
                expect(currentResponse).toMatchObject(expectedResponse);
            });

        const request = httpTestingController.expectOne(['/v1/users/verification', token].join('/'));

        expect(request.request.method).toEqual('PATCH');

        request.flush(expectedResponse);
    });

    it('should admin activate the account correctly', () => {
        const expectedResponse: ActivationResponseDTO = {
            activation: true,
            username: 'test'
        };
        const token = 'test';

        userService.adminActivateAccount(token)
            .subscribe((currentResponse: ActivationResponseDTO) => {
                expect(currentResponse).toMatchObject(expectedResponse);
            });

        const request = httpTestingController.expectOne(['/v1/users/activation', token].join('/'));

        expect(request.request.method).toEqual('PATCH');

        request.flush(expectedResponse);
    });

    it('should logout the user', () => {
        const mockUser: TokenizedUser = {
            firstName: 'test',
            lastName: 'test',
            email: 'test',
            token: 'test',
            gdprAgreementRequested: false
        };
        localStorage.setItem('currentUser', JSON.stringify(mockUser));

        expect(localStorage.getItem('currentUser')).not.toBeNull();

        userService.logout();
        const result = localStorage.getItem('currentUser');

        expect(result).toBeNull();
    });

    it('should set and get the current user', () => {
        const mockUser: TokenizedUser = {
            firstName: 'test',
            lastName: 'test',
            email: 'test',
            token: 'test',
            gdprAgreementRequested: false
        };
        userService.setCurrentUser(mockUser);
        const result = userService.getCurrentUser();

        expect(result).toMatchObject(mockUser);
    });
});
