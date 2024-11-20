import { Component, Output, EventEmitter, Input } from "@angular/core";
import {
    Validators,
    FormControl,
    FormGroup,
    ValidatorFn,
    ValidationErrors,
} from "@angular/forms";
import { ValidationError } from "@app/core/model";
import { NewPasswordRequestDTO } from "../../../user/models/user.model";

interface ResetForm {
    password1: FormControl<string | null>;
    password2: FormControl<string | null>;
}

@Component({
    selector: "fcl-reset",
    templateUrl: "./reset.component.html",
    styleUrls: ["./reset.component.scss"],
})
export class ResetComponent {
    @Input() serverValidationErrors: ValidationError[] = [];
    // eslint-disable-next-line @angular-eslint/no-output-native
    @Output() reset = new EventEmitter<NewPasswordRequestDTO>();

    resetForm = new FormGroup<ResetForm>(
        {
            password1: new FormControl<string | null>(null, [
                Validators.required,
            ]),
            password2: new FormControl<string | null>(null),
        },
        this.passwordConfirmationValidator as ValidatorFn,
    );

    validateField(fieldName: string) {
        return (
            this.resetForm.controls[fieldName].valid ||
            this.resetForm.controls[fieldName].untouched
        );
    }

    onReset() {
        const password: NewPasswordRequestDTO = {
            password: this.resetForm.value.password1 ?? "",
        };
        this.reset.emit(password);
    }

    private passwordConfirmationValidator(
        fg: FormGroup<ResetForm>,
    ): ValidationErrors | null {
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
