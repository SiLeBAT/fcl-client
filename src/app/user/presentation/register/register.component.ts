import {
    Component, OnInit, Output, EventEmitter,
    Input} from '@angular/core';
import { FormGroup, FormControl, Validators, ValidationErrors } from '@angular/forms';
import { ValidationError } from '@app/core/model';
import { RegistrationCredentials } from '../../models/user.model';

@Component({
    selector: 'fcl-register',
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {

    @Input() serverValidationErrors: Partial<Record<keyof RegistrationCredentials, ValidationError[]>> = {};

    @Output() register = new EventEmitter<RegistrationCredentials>();
    registerForm: FormGroup;

    ngOnInit() {
        this.registerForm = new FormGroup({
            firstName: new FormControl(null, Validators.required),
            lastName: new FormControl(null, Validators.required),
            email: new FormControl(null, [
                Validators.required,
                Validators.email
            ]),
            password1: new FormControl(null, Validators.required),
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
}
