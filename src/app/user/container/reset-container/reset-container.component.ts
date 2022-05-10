import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { AlertService } from '../../../shared/services/alert.service';
import { SpinnerLoaderService } from '../../../shared/services/spinner-loader.service';
import { NewPasswordRequestDTO, PasswordResetResponseDTO } from '../../../user/models/user.model';
import { InvalidServerInputHttpErrorResponse } from '../../../core/errors';
import { ValidationError } from '@app/core/model';

@Component({
    selector: 'fcl-reset-container',
    templateUrl: './reset-container.component.html'
})
export class ResetContainerComponent {

    serverValidationErrors: ValidationError[] = [];

    constructor(
        private userService: UserService,
        private alertService: AlertService,
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private spinnerService: SpinnerLoaderService) { }

    reset(password: NewPasswordRequestDTO) {
        const token = this.activatedRoute.snapshot.params['id'];
        this.spinnerService.show();
        this.userService.resetPassword(password, token)
            .subscribe((resetResponse: PasswordResetResponseDTO) => {
                this.spinnerService.hide();
                this.alertService.success('Please login with your new password');
                this.router.navigate(['users/login']).catch((err) => {
                    throw new Error(`Unable to navigate: ${err}`);
                });
            }, (err) => {
                this.spinnerService.hide();
                if (err instanceof InvalidServerInputHttpErrorResponse) {
                    this.serverValidationErrors = err.errors;
                    this.alertService.error('The password could not be updated. The password is not compliant with the password rules.');
                } else {
                    this.alertService.error(`Error during password reset, the token is not valid.
                    Please receive a new 'Password-Reset' link with the option 'Password forgotten?'.`);
                }
            });
    }
}
