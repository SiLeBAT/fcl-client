import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { UserService } from '../../services/user.service';
import { AlertService } from '../../../shared/services/alert.service';
import { SpinnerLoaderService } from '../../../shared/services/spinner-loader.service';
import { TitleResponseDTO, Email } from '../../models/user.model';

@Component({
    selector: 'fcl-recovery-container',
    templateUrl: './recovery-container.component.html'
})
export class RecoveryContainerComponent implements OnInit {

    constructor(
        private userService: UserService,
        private alertService: AlertService,
        private router: Router,
        private spinnerService: SpinnerLoaderService) { }

    ngOnInit() {
    }

    recovery(email: Email) {
        this.spinnerService.show();
        this.userService.recoverPassword(email)
          .subscribe((recoverResponse: TitleResponseDTO) => {
              this.spinnerService.hide();
              const message = recoverResponse.title;
              this.alertService.success(message);
              this.router.navigate(['users/login']).catch((err) => {
                  throw new Error(`Unable to navigate: ${err}`);
              });
          }, (err: HttpErrorResponse) => {
              this.spinnerService.hide();
              const errObj = JSON.parse(err.error);
              this.alertService.error(errObj.title);
          });
    }
}
