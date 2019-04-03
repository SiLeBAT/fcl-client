import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { UserService } from '../../services/user.service';
import { AlertService } from '../../../shared/services/alert.service';
import { SpinnerLoaderService } from '../../../shared/services/spinner-loader.service';
import { TitleResponseDTO, NewPassword } from '../../models/user.model';

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

    reset(password: NewPassword) {
        const token = this.activatedRoute.snapshot.params['id'];
        this.spinnerService.show();
        this.userService.resetPassword(password, token)
        .subscribe((resetResponse: TitleResponseDTO) => {
            this.spinnerService.hide();
            const message = resetResponse.title;
            this.alertService.success(message);
            this.router.navigate(['users/login']).catch((err) => {
                throw new Error(`Unable to navigate: ${err}`);
            });
        }, (err: HttpErrorResponse) => {
            this.spinnerService.hide();
            const errMsg = err['error']['title'];
            this.alertService.error(errMsg);
        });
    }
}
