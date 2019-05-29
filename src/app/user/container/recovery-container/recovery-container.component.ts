import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { UserService } from '../../services/user.service';
import { AlertService } from '../../../shared/services/alert.service';
import { SpinnerLoaderService } from '../../../shared/services/spinner-loader.service';
import { ResetRequestDTO, PasswordResetRequestResponseDTO } from '@app/user/models/user.model';

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

    recovery(email: ResetRequestDTO) {
        this.spinnerService.show();
        this.userService.recoverPassword(email)
          .subscribe((recoverResponse: PasswordResetRequestResponseDTO) => {
              this.spinnerService.hide();
              const message = `An email has been sent to ${recoverResponse.email} with further instructions.
              If you don't receive an email it could be that you have registered
              with a different email address.`;
              this.alertService.success(message);
              this.router.navigate(['users/login']).catch((err) => {
                  throw new Error(`Unable to navigate: ${err}`);
              });
          }, (err: HttpErrorResponse) => {
              this.spinnerService.hide();
              this.alertService.error('Unable to recover password.');
          });
    }
}
