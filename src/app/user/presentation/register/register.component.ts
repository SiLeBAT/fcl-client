import { Component, OnInit, ChangeDetectorRef, Output, EventEmitter, ViewEncapsulation } from '@angular/core';
import { FormGroup, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RegistrationCredentials } from '../../models/user.model';

export interface IHash {
    [details: string]: string;
}

@Component({
    selector: 'fcl-register',
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class RegisterComponent implements OnInit {

    private static readonly NAME_REGEXP = /^[^<>]*$/;

    @Output() register = new EventEmitter();
    registerForm: FormGroup;
    private pwStrength: number;

    constructor(
        private changeRef: ChangeDetectorRef
    ) {
        this.pwStrength = -1;
    }

    ngOnInit() {
        this.registerForm = new FormGroup({
            firstName: new FormControl(null, [
                Validators.required,
                this.nameValidator
            ]),
            lastName: new FormControl(null, [
                Validators.required,
                this.nameValidator
            ]),
            email: new FormControl(null, [
                Validators.required,
                Validators.email
            ]),
            password1: new FormControl(null, [
                Validators.required,
                Validators.minLength(8)
            ]),
            password2: new FormControl(null),
            dataProtection: new FormControl(null, Validators.requiredTrue),
            newsletter: new FormControl(false)
        }, this.passwordConfirmationValidator);
    }

    onRegister() {
        if (this.registerForm.valid) {
            const registrationCredentials: RegistrationCredentials = {
                email: this.registerForm.value.email,
                password: this.registerForm.value.password1,
                firstName: this.registerForm.value.firstName,
                lastName: this.registerForm.value.lastName,
                dataProtectionAgreed: this.registerForm.value.dataProtection,
                newsRegAgreed: this.registerForm.value.newsletter,
                newsMailAgreed: false
            };
            this.register.emit(registrationCredentials);
        }
    }

    validateField(fieldName: string) {
        return this.registerForm.controls[fieldName].valid
               || this.registerForm.controls[fieldName].untouched;
    }

    validatePwStrength() {
        return (this.pwStrength >= 0 && this.pwStrength < 2);
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

    private nameValidator(control: AbstractControl): ValidationErrors {
        return RegisterComponent.NAME_REGEXP.test(control.value || '') ?
            null : { illegalCharacters: true };
    }

    doStrengthChange(pwStrength: number) {
        this.pwStrength = pwStrength;
        this.changeRef.detectChanges();
    }

}
