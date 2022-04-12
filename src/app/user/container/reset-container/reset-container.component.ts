import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { UserService } from '../../services/user.service';
import { AlertService } from '../../../shared/services/alert.service';
import { SpinnerLoaderService } from '../../../shared/services/spinner-loader.service';
import { NewPasswordRequestDTO, PasswordResetResponseDTO } from '@app/user/models/user.model';

@Component({
    selector: 'fcl-reset-container',
    templateUrl: './reset-container.component.html'
})
export class ResetContainerComponent implements OnInit {

    constructor(
        private userService: UserService,
        private alertService: AlertService,
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private spinnerService: SpinnerLoaderService) { }

    ngOnInit() {
    }

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
            }, () => {
                this.spinnerService.hide();
                this.alertService.error(`Error during password reset, the token is not valid.
            Please receive a new 'Password-Reset' link with the option 'Password forgotten?'.`);
            });
    }
}
