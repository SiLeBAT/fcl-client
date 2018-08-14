import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormControl, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { UserService } from '../services/user.service';
import { AlertService } from '../services/alert.service';
import { User } from '../../models/user.model';

export interface IHash {
  [details: string]: string;
}

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  public registerForm: FormGroup;
  loading = false;
  selected = '';
  private pwStrength: number;

  constructor(
    private userService: UserService,
    private alertService: AlertService,
    private router: Router,
    private changeRef: ChangeDetectorRef) {
      this.pwStrength = -1;
    }

  ngOnInit() {
    this.registerForm = new FormGroup({
      institution: new FormControl(null, Validators.required),
      firstName: new FormControl(null, Validators.required),
      lastName: new FormControl(null, Validators.required),
      email: new FormControl(null, [
        Validators.required,
        Validators.email
      ]),
      password1: new FormControl(null, [Validators.required, Validators.minLength(8)]),
      password2: new FormControl(null),
    }, this.passwordConfirmationValidator);
  }


  register() {
    if (this.registerForm.valid) {
      const user = new User(
        this.registerForm.value.email,
        this.registerForm.value.password1,
        this.registerForm.value.firstName,
        this.registerForm.value.lastName,
      );

      this.userService.create(user)
        .subscribe((data) => {
          this.alertService.success(data['title']);
          this.router.navigate(['users/login']);
        }, (err: HttpErrorResponse) => {
          this.alertService.error(err.error.title);
        });

    }
  }

  validateField(fieldName: string) {
    return this.registerForm.controls[fieldName].valid
      || this.registerForm.controls[fieldName].untouched;
  }

  validatePwStrength() {
    return (this.pwStrength >= 0 && this.pwStrength < 2);
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

  doStrengthChange(pwStrength: number) {
    this.pwStrength = pwStrength;
    this.changeRef.detectChanges();
  }
}
