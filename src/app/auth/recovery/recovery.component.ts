import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { UserService } from '../services/user.service';
import { AlertService } from '../services/alert.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-revovery',
  templateUrl: './recovery.component.html',
  styleUrls: ['./recovery.component.css']
})
export class RecoveryComponent implements OnInit {
  public recoveryForm: FormGroup;
  loading = false;

  constructor(
    private userService: UserService,
    private alertService: AlertService,
    private router: Router) {}

  ngOnInit() {
    this.recoveryForm = new FormGroup({
      email: new FormControl(null, [
        Validators.required,
        Validators.email
      ])
    });
  }

  recovery() {
    console.log('Recovery clicked');

    this.loading = true;

        const email = this.recoveryForm.value.email;

        this.userService.recoveryPassword(email)
          .subscribe((data) => {
            const message = data['title'];
            this.alertService.success(message);
            this.router.navigate(['users/login']);
          }, (err: HttpErrorResponse) => {
            const errObj = JSON.parse(err.error);
            this.alertService.error(errObj.title);
            this.loading = false;
          });

        this.recoveryForm.reset();
  }

}
