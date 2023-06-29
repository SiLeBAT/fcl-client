import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { Validators, FormControl, FormGroup } from '@angular/forms';

import { LoginCredentials } from '../../models/user.model';

interface LoginForm {
    email: FormControl<string | null>;
    password: FormControl<string | null>;
}

@Component({
    selector: 'fcl-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
    @Output() login = new EventEmitter<LoginCredentials>();
    loginForm: FormGroup<LoginForm>;

    ngOnInit() {
        this.loginForm = new FormGroup<LoginForm>({
            email: new FormControl<string | null>(null, [Validators.required, Validators.email]),
            password: new FormControl<string | null>(null, Validators.required)
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
