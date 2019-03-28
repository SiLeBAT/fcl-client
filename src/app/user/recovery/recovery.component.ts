import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { UserService } from '../services/user.service';
import { AlertService } from '../../shared/services/alert.service';
import { SpinnerLoaderService } from '../../shared/services/spinner-loader.service';
import { Email, TitleResponseDTO } from '../models/user.model';

@Component({
    selector: 'fcl-revovery',
    templateUrl: './recovery.component.html',
    styleUrls: ['./recovery.component.scss']
})
export class RecoveryComponent implements OnInit {
    recoveryForm: FormGroup;
    loading = false;

    constructor(
    private userService: UserService,
    private alertService: AlertService,
    private router: Router,
    private spinnerService: SpinnerLoaderService) {}

    ngOnInit() {
        this.recoveryForm = new FormGroup({
            email: new FormControl(null, [
                Validators.required,
                Validators.email
            ])
        });
    }

    recovery() {
        this.loading = true;

        const email: Email = {
            email: this.recoveryForm.value.email
        };

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
              this.loading = false;
          });

        this.recoveryForm.reset();
    }

    validateField(fieldName: string) {
        return this.recoveryForm.controls[fieldName].valid
      || this.recoveryForm.controls[fieldName].untouched;
    }

}
