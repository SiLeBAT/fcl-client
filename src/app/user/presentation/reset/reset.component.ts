import { Component, OnInit, Output, EventEmitter, Input, ElementRef } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ValidationError } from '@app/core/model';
import { NewPasswordRequestDTO } from '../../../user/models/user.model';

@Component({
    selector: 'fcl-reset',
    templateUrl: './reset.component.html',
    styleUrls: ['./reset.component.scss']
})
export class ResetComponent implements OnInit {

    @Input() serverValidationErrors: ValidationError[] = [];
    // eslint-disable-next-line @angular-eslint/no-output-native
    @Output() reset = new EventEmitter<NewPasswordRequestDTO>();

    resetForm: FormGroup;

    constructor(public elementRef: ElementRef) {}

    ngOnInit() {
        this.resetForm = new FormGroup({
            password1: new FormControl(null, [
                Validators.required
            ]),
            password2: new FormControl(null)
        }, this.passwordConfirmationValidator);
    }

    validateField(fieldName: string) {
        return this.resetForm.controls[fieldName].valid
      || this.resetForm.controls[fieldName].untouched;
    }

    onReset() {
        const password: NewPasswordRequestDTO = {
            password: this.resetForm.value.password1
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
