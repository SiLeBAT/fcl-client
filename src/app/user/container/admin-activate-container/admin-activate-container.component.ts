import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { UserService } from '../../services/user.service';
import { AlertService } from '../../../shared/services/alert.service';
import { environment } from '../../../../environments/environment';
import { SpinnerLoaderService } from '../../../shared/services/spinner-loader.service';
import { ActivationResponseDTO } from './../../models/user.model';

@Component({
    selector: 'fcl-admin-activate-container',
    templateUrl: './admin-activate-container.component.html'
})
export class AdminActivateContainerComponent implements OnInit {
    adminTokenValid: boolean;
    name: string;
    appName: string = environment.appName;

    constructor(private activatedRoute: ActivatedRoute,
        private userService: UserService,
        private alertService: AlertService,
        private spinnerService: SpinnerLoaderService) { }

    ngOnInit() {
        const adminToken = this.activatedRoute.snapshot.params['id'];

        this.spinnerService.show();
        this.userService.adminActivateAccount(adminToken)
            .subscribe((adminActivateResponse: ActivationResponseDTO) => {
                this.spinnerService.hide();
                const message = `Admin account activation! A confirmation is sent to ${adminActivateResponse.username}`;
                this.name = adminActivateResponse.username;
                this.alertService.success(message);
                this.adminTokenValid = true;
            }, () => {
                this.spinnerService.hide();
                this.alertService.error('Your admin account activation failed!');
                this.adminTokenValid = false;
            });
    }

}
