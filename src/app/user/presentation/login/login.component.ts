import { Component, OnInit, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { LoginCredentials } from '../../models/user.model';

@Component({
    selector: 'fcl-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
    @Output() login = new EventEmitter<LoginCredentials>();
    loginForm: FormGroup;

    ngOnInit() {
        this.loginForm = new FormGroup({
            email: new FormControl(null, [Validators.required, Validators.email]),
            password: new FormControl(null, Validators.required)
        });
    }

    onLogin() {
        const credentials: LoginCredentials = {
            email: this.loginForm.value.email,
            password: this.loginForm.value.password
        };
        this.login.emit(credentials);
        this.loginForm.reset();
    }

    validateField(fieldName: string) {
        return this.loginForm.controls[fieldName].valid
               || this.loginForm.controls[fieldName].untouched;
    }
}
