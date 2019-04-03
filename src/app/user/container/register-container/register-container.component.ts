import { Component, OnInit } from '@angular/core';
import { RegistrationCredentials, TitleResponseDTO } from '../../models/user.model';
import { SpinnerLoaderService } from '../../../shared/services/spinner-loader.service';
import { UserService } from '../../services/user.service';
import { AlertService } from '../../../shared/services/alert.service';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
    selector: 'fcl-register-container',
    templateUrl: './register-container.component.html'
})
export class RegisterContainerComponent implements OnInit {

    constructor(private spinnerService: SpinnerLoaderService,
                private alertService: AlertService,
                private userService: UserService,
                private router: Router) { }

    ngOnInit() {
    }

    register(credentails: RegistrationCredentials) {
        this.spinnerService.show();
        this.userService.register(credentails)
        .subscribe((registerResponse: TitleResponseDTO) => {
            this.spinnerService.hide();
            this.alertService.success(registerResponse.title);
            this.router.navigate(['users/login']).catch((err) => {
                throw new Error(`Unable to navigate: ${err}`);
            });
        }, (err: HttpErrorResponse) => {
            this.spinnerService.hide();
            this.alertService.error(err.error.title);
        });

    }
}
