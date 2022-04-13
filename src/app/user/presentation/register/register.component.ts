import {
    Component, OnInit, Output, EventEmitter,
    Input, ChangeDetectionStrategy, OnChanges, SimpleChanges
} from '@angular/core';
import { FormGroup, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ServerInputValidationError } from '../../../core/model';
import { CODE_TO_FIELD_Map } from '../../../user/consts/error-codes.const';
import { RegistrationCredentials } from '../../models/user.model';

export interface IHash {
    [details: string]: string;
}
@Component({
    selector: 'fcl-register',
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegisterComponent implements OnInit, OnChanges {

    @Input() serverValidationErrors: ServerInputValidationError[] = [];

    @Output() register = new EventEmitter();
    registerForm: FormGroup;

    _lastSubmittedCredentials: RegistrationCredentials | null = null;

    constructor() {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.serverValidationErrors !== undefined) {
            if (this.registerForm) {
                const controls = Object.values(this.registerForm.controls);
                controls.forEach(c => c.updateValueAndValidity());
            }
        }
    }

    ngOnInit() {
        this.registerForm = new FormGroup({
            firstName: new FormControl(null, [
                Validators.required,
                (control: AbstractControl) => this.getServerValidationErrorsOfField(control, 'firstName')
            ]),
            lastName: new FormControl(null, [
                Validators.required,
                (control: AbstractControl) => this.getServerValidationErrorsOfField(control, 'lastName')
            ]),
            email: new FormControl(null, [
                Validators.required,
                Validators.email,
                (control: AbstractControl) => this.getServerValidationErrorsOfField(control, 'email')
            ]),
            password1: new FormControl(null, [
                Validators.required,
                (control: AbstractControl) => this.getServerValidationErrorsOfField(control, 'password')
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
            this._lastSubmittedCredentials = registrationCredentials;
            this.register.emit(registrationCredentials);
        }
    }

    validateField(fieldName: string) {
        return this.registerForm.controls[fieldName].valid
               || this.registerForm.controls[fieldName].untouched;
    }

    private passwordConfirmationValidator(fg: FormGroup): ValidationErrors {
        const pw1 = fg.controls.password1;
        const pw2 = fg.controls.password2;

        if (pw1.value !== pw2.value) {
            pw2.setErrors({ validatePasswordConfirm: true });
        } else {
            pw2.setErrors(null);
        }
        return null;
    }

    private getServerValidationErrorsOfField(control: AbstractControl, fieldName: keyof RegistrationCredentials): ValidationErrors {
        let result: ValidationErrors = null;
        if (this.serverValidationErrors.length > 0) {
            if (control.value !== this._lastSubmittedCredentials[fieldName]) {
                // delete related server errors
                this.serverValidationErrors = this.serverValidationErrors.filter(e => CODE_TO_FIELD_Map[e.code] !== fieldName);
            } else {
                const errors = this.serverValidationErrors.filter(e => CODE_TO_FIELD_Map[e.code] === fieldName);
                if (errors.length > 0) {
                    result = { serverValidationErrors: errors };
                }
            }
        }

        return result;
    }
}
