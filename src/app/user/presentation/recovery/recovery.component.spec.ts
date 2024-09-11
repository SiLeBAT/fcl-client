import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {RecoveryComponent} from './recovery.component';
import {MaterialModule} from '../../../shared/material.module';
import {SharedModule} from '../../../shared/shared.module';
import {ResetRequestDTO} from '../../models/user.model';
import {RouterTestingModule} from '@angular/router/testing';

describe('RecoveryComponent', () => {
  let component: RecoveryComponent;
  let fixture: ComponentFixture<RecoveryComponent>;

  beforeEach(async(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    TestBed.configureTestingModule({
      declarations: [RecoveryComponent],
      imports: [MaterialModule, SharedModule, RouterTestingModule],
    })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(RecoveryComponent);
        component = fixture.componentInstance;
      });
  }));

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render the component correctly', () => {
    expect(fixture).toMatchSnapshot();
  });

  it('should have an invalid recovery form when empty', () => {
    expect(component.recoveryForm.valid).toBeFalsy();
  });

  it('should have an invalid email field when being empty', () => {
    const emailField = component.recoveryForm.controls['email'];

    expect(emailField.valid).toBeFalsy();
  });

  it('should have an required validator on the email field', () => {
    let errors = {};
    const emailField = component.recoveryForm.controls['email'];
    errors = emailField.errors || {};

    expect(errors['required']).toBeTruthy();
  });

  it('should have an invalid email field with falsy email value', () => {
    const emailField = component.recoveryForm.controls['email'];
    emailField.setValue('test');
    const errors = emailField.errors || {};

    expect(errors['required']).toBeFalsy();
    expect(errors['email']).toBeTruthy();
  });

  it('should have a valid email field with valid email value', () => {
    const emailField = component.recoveryForm.controls['email'];
    emailField.setValue('test@test.com');
    const errors = emailField.errors || {};

    expect(errors['required']).toBeFalsy();
    expect(errors['email']).toBeFalsy();
  });

  it('should emit the email when submitting the recovery form', () => {
    const email = 'test@test.com';

    expect(component.recoveryForm.valid).toBeFalsy();

    component.recoveryForm.controls['email'].setValue(email);

    expect(component.recoveryForm.valid).toBeTruthy();

    let emailRequest: ResetRequestDTO;
    component.recovery.subscribe(value => (emailRequest = value));

    component.onRecovery();

    expect(emailRequest!.email).toBe(email);
  });
});
