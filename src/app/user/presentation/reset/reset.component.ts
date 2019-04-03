import { Component, OnInit, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { NewPassword } from '../../models/user.model';

@Component({
    selector: 'fcl-reset',
    templateUrl: './reset.component.html',
    styleUrls: ['./reset.component.scss']
})
export class ResetComponent implements OnInit {
    @Output() reset = new EventEmitter();
    resetForm: FormGroup;
    private pwStrength: number;

    constructor(private changeRef: ChangeDetectorRef) {
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

    onReset() {
        const password: NewPassword = {
            newPw: this.resetForm.value.password1
        };
        this.reset.emit(password);

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
