import { Component, OnInit } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';

import { UserService } from '../../services/user.service';
import { AlertService } from '../../../shared/services/alert.service';
import { SpinnerLoaderService } from '../../../shared/services/spinner-loader.service';
import { ActivationResponseDTO } from '@app/user/models/user.model';

@Component({
    selector: 'fcl-activate-container',
    templateUrl: './activate-container.component.html'
})
export class ActivateContainerComponent implements OnInit {
    tokenValid: boolean;
    appName: string = environment.appName;

    constructor(private activatedRoute: ActivatedRoute,
        private userService: UserService,
        private alertService: AlertService,
        private spinnerService: SpinnerLoaderService) { }

    ngOnInit() {
        const token = this.activatedRoute.snapshot.params['id'];

        this.spinnerService.show();
        this.userService.activateAccount(token)
            .subscribe((activationResponse: ActivationResponseDTO) => {
                this.spinnerService.hide();
                const message = 'Account activation successful!';
                this.alertService.success(message);
                this.tokenValid = true;
            }, () => {
                this.spinnerService.hide();
                this.alertService.error('Your account activation failed!');
                this.tokenValid = false;
            });
    }

}
