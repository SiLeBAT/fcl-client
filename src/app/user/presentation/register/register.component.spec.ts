import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterComponent } from './register.component';
import { MaterialModule } from '../../../shared/material.module';
import { SharedModule } from '../../../shared/shared.module';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RegistrationCredentials } from '../../models/user.model';

describe('RegisterComponent', () => {

    let component: RegisterComponent;
    let fixture: ComponentFixture<RegisterComponent>;

    beforeEach(async(() => {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        TestBed.configureTestingModule({
            declarations: [
                RegisterComponent
            ],
            imports: [
                MaterialModule,
                SharedModule,
                RouterTestingModule,
                NoopAnimationsModule
            ]
        }).compileComponents()
            .then(() => {
                fixture = TestBed.createComponent(RegisterComponent);
                component = fixture.componentInstance;
            });
    }));

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should render the component correctly', () => {
        expect(fixture).toMatchSnapshot();
    });

    it('should have an invalid registration form when empty', () => {
        expect(component.registerForm.valid).toBeFalsy();
    });

    it('should have required validators on the form fields', () => {
        const firstNameField = component.registerForm.controls['firstName'];
        const lastNameField = component.registerForm.controls['lastName'];
        const emailField = component.registerForm.controls['email'];
        const password1Field = component.registerForm.controls['password1'];
        const firstNameErrors = firstNameField.errors || {};
        const lastNameErrors = lastNameField.errors || {};
        const emailErrors = emailField.errors || {};
        const passwordErrors = password1Field.errors || {};

        expect(firstNameErrors['required']).toBeTruthy();
        expect(lastNameErrors['required']).toBeTruthy();
        expect(emailErrors['required']).toBeTruthy();
        expect(passwordErrors['required']).toBeTruthy();
    });

    it('should have an invalid first name field when being empty', () => {
        const frstNameField = component.registerForm.controls['firstName'];

        expect(frstNameField.valid).toBeFalsy();
    });

    it('should have an invalid last name field when being empty', () => {
        const lastNameField = component.registerForm.controls['lastName'];

        expect(lastNameField.valid).toBeFalsy();
    });

    it('should have an invalid email field when being empty', () => {
        const emailField = component.registerForm.controls['email'];

        expect(emailField.valid).toBeFalsy();
    });

    it('should have an invalid password field when being empty', () => {
        const password1Field = component.registerForm.controls['password1'];

        expect(password1Field.valid).toBeFalsy();
    });

    it('should have an invalid status with two different passwords', () => {
        const password1Field = component.registerForm.controls['password1'];
        const password2Field = component.registerForm.controls['password2'];
        password1Field.setValue('test');
        password2Field.setValue('testt');
        const errors = password2Field.errors || {};

        expect(errors['validatePasswordConfirm']).toBeTruthy();
    });

    it('should emit the registratin credentials when submitting the registration form', () => {
        const email = 'test@test';
        const password = 'testtest';
        const firstName = 'test';
        const lastName = 'test;';

        expect(component.registerForm.valid).toBeFalsy();

        component.registerForm.controls['email'].setValue(email);
        component.registerForm.controls['password1'].setValue(password);
        component.registerForm.controls['password2'].setValue(password);
        component.registerForm.controls['firstName'].setValue(firstName);
        component.registerForm.controls['lastName'].setValue(lastName);
        component.registerForm.controls['dataProtection'].setValue(true);

        expect(component.registerForm.valid).toBeTruthy();

        let registerRequest: RegistrationCredentials;
        component.register.subscribe((value) => registerRequest = value);

        component.onRegister();

        expect(registerRequest!.email).toBe(email);
        expect(registerRequest!.password).toBe(password);
        expect(registerRequest!.firstName).toBe(firstName);
        expect(registerRequest!.lastName).toBe(lastName);
    });
});
