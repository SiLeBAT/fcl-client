import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { LoginCredentials } from '../../models/user.model';

@Component({
    selector: 'fcl-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
    @Output() login = new EventEmitter();
    loginForm: FormGroup;

    constructor() {}

    ngOnInit() {
        this.loginForm = new FormGroup({
            email: new FormControl(null, [Validators.required, Validators.email]),
            password: new FormControl(null, Validators.required)
        });
    }

    getEmailErrorMessage() {
        return this.loginForm.controls.email.hasError('required')
            ? 'You must enter a valid email'
            : this.loginForm.controls.email.hasError('email')
            ? 'Not a valid email'
            : '';
    }

    getPasswordErrorMessage() {
        return this.loginForm.controls.password.hasError('required') ? 'Password is required' : '';
    }

    onLogin() {
        const credentials: LoginCredentials = {
            email: this.loginForm.value.email,
            password: this.loginForm.value.password
        };
        this.login.emit(credentials);
        this.loginForm.reset();
    }
}
