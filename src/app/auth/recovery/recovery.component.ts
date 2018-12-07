import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { UserService } from '../services/user.service';
import { AlertService } from '../services/alert.service';
import { SpinnerLoaderService } from '../../shared/spinner-loader/spinner-loader.service';

@Component({
  // tslint:disable-next-line:component-selector
    selector: 'app-revovery',
    templateUrl: './recovery.component.html',
    styleUrls: ['./recovery.component.css']
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

        const email = this.recoveryForm.value.email;

        this.spinnerService.show();
        this.userService.recoveryPassword(email)
          .subscribe((data) => {
              this.spinnerService.hide();
              const message = data['title'];
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
