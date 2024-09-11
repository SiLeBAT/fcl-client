import {Component, Output, EventEmitter, Input} from '@angular/core';
import {
  Validators,
  ValidationErrors,
  FormControl,
  FormGroup,
  ValidatorFn,
} from '@angular/forms';
import {ValidationError} from '@app/core/model';
import {RegistrationCredentials} from '../../models/user.model';

interface RegisterForm {
  firstName: FormControl<string | null>;
  lastName: FormControl<string | null>;
  email: FormControl<string | null>;
  password1: FormControl<string | null>;
  password2: FormControl<string | null>;
  dataProtection: FormControl<boolean | null>;
  newsletter: FormControl<boolean | null>;
}

@Component({
  selector: 'fcl-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  @Input() serverValidationErrors: Partial<
    Record<keyof RegistrationCredentials, ValidationError[]>
  > = {};

  @Output() register = new EventEmitter<RegistrationCredentials>();

  registerForm = new FormGroup<RegisterForm>(
    {
      firstName: new FormControl<string | null>(null, Validators.required),
      lastName: new FormControl<string | null>(null, Validators.required),
      email: new FormControl<string | null>(null, [
        Validators.required,
        Validators.email,
      ]),
      password1: new FormControl<string | null>(null, Validators.required),
      password2: new FormControl<string | null>(null),
      dataProtection: new FormControl<boolean | null>(
        null,
        Validators.requiredTrue
      ),
      newsletter: new FormControl<boolean | null>(false),
    },
    this.passwordConfirmationValidator as ValidatorFn
  );

  onRegister() {
    if (this.registerForm.valid) {
      const registrationCredentials: RegistrationCredentials = {
        email: this.registerForm.value.email ?? '',
        password: this.registerForm.value.password1 ?? '',
        firstName: this.registerForm.value.firstName ?? '',
        lastName: this.registerForm.value.lastName ?? '',
        dataProtectionAgreed: this.registerForm.value.dataProtection ?? false,
        newsRegAgreed: this.registerForm.value.newsletter ?? false,
        newsMailAgreed: false,
      };
      this.register.emit(registrationCredentials);
    }
  }

  validateField(fieldName: string): boolean {
    return (
      this.registerForm.controls[fieldName]?.valid ||
      this.registerForm.controls[fieldName]?.untouched
    );
  }

  private passwordConfirmationValidator(
    fg: FormGroup<RegisterForm>
  ): ValidationErrors | null {
    const pw1 = fg.controls.password1;
    const pw2 = fg.controls.password2;

    if (pw1.value !== pw2.value) {
      pw2.setErrors({validatePasswordConfirm: true});
    } else {
      pw2.setErrors(null);
    }
    return null;
  }
}
