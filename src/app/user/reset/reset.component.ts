import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { UserService } from '../services/user.service';
import { AlertService } from '../../shared/services/alert.service';
import { SpinnerLoaderService } from '../../shared/services/spinner-loader.service';
import { NewPassword, TitleResponseDTO } from '../models/user.model';

@Component({
    selector: 'fcl-reset',
    templateUrl: './reset.component.html',
    styleUrls: ['./reset.component.scss']
})
export class ResetComponent implements OnInit {
    resetForm: FormGroup;
    loading = false;
    private pwStrength: number;

    constructor(
    private userService: UserService,
    private alertService: AlertService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private changeRef: ChangeDetectorRef,
    private spinnerService: SpinnerLoaderService) {
        this.pwStrength = -1;
    }

    ngOnInit() {
        this.resetForm = new FormGroup({
            password1: new FormControl(null, Validators.required),
            password2: new FormControl(null, [Validators.required, Validators.minLength(8)])
        }, this.passwordConfirmationValidator);
    }

    validateField(fieldName: string) {
        return this.resetForm.controls[fieldName].valid
      || this.resetForm.controls[fieldName].untouched;
    }

    validatePwStrength() {
        return (this.pwStrength >= 0 && this.pwStrength < 2);
    }

    doStrengthChange(pwStrength: number) {
        this.pwStrength = pwStrength;
        this.changeRef.detectChanges();
    }

    reset() {
        this.loading = true;

        const password: NewPassword = {
            newPw: this.resetForm.value.password1
        };
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
            this.loading = false;
        });
    }

    private passwordConfirmationValidator(fg: FormGroup) {
        const pw1 = fg.controls.password1;
        const pw2 = fg.controls.password2;

        if (pw1.value !== pw2.value) {
            pw2.setErrors({ validatePasswordConfirm: true });
        } else {
            pw2.setErrors(null);
        }
        return null;
    }

}
