import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {LoginComponent} from './login.component';
import {MaterialModule} from '../../../shared/material.module';
import {SharedModule} from '../../../shared/shared.module';
import {LoginCredentials} from '../../models/user.model';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    TestBed.configureTestingModule({
      declarations: [LoginComponent],
      imports: [MaterialModule, SharedModule],
    })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(LoginComponent);
        component = fixture.componentInstance;
      });
  }));

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render the component correctly', () => {
    expect(fixture).toMatchSnapshot();
  });

  it('should have an invalid login form when empty', () => {
    expect(component.loginForm.valid).toBeFalsy();
  });

  it('should have an invalid email field when being empty', () => {
    const emailField = component.loginForm.controls['email'];

    expect(emailField.valid).toBeFalsy();
  });

  it('should have an required validator on the email field', () => {
    let errors = {};
    const emailField = component.loginForm.controls['email'];
    errors = emailField.errors || {};

    expect(errors['required']).toBeTruthy();
  });

  it('should have an invalid email field with falsy email value', () => {
    const emailField = component.loginForm.controls['email'];
    emailField.setValue('test');
    const errors = emailField.errors || {};

    expect(errors['required']).toBeFalsy();
    expect(errors['email']).toBeTruthy();
  });

  it('should have a valid email field with valid email value', () => {
    const emailField = component.loginForm.controls['email'];
    emailField.setValue('test@test.com');
    const errors = emailField.errors || {};

    expect(errors['required']).toBeFalsy();
    expect(errors['email']).toBeFalsy();
  });

  it('should have an invalid password field when being empty', () => {
    const passwordField = component.loginForm.controls['password'];

    expect(passwordField.valid).toBeFalsy();
  });

  it('should have an required validator on the password field', () => {
    let errors = {};
    const passwordField = component.loginForm.controls['password'];
    errors = passwordField.errors || {};

    expect(errors['required']).toBeTruthy();
  });

  it('should have a valid password field with password value', () => {
    const passwordField = component.loginForm.controls['password'];
    passwordField.setValue('test');
    const errors = passwordField.errors || {};

    expect(errors['required']).toBeFalsy();
  });

  it('should emit the login credentials when submitting the login form', () => {
    const email = 'test@test.com';
    const password = 'test';

    expect(component.loginForm.valid).toBeFalsy();

    component.loginForm.controls['email'].setValue(email);
    component.loginForm.controls['password'].setValue(password);

    expect(component.loginForm.valid).toBeTruthy();

    let credentials: LoginCredentials;
    component.login.subscribe(value => (credentials = value));

    component.onLogin();

    expect(credentials!.email).toBe(email);
    expect(credentials!.password).toBe(password);
  });
});
