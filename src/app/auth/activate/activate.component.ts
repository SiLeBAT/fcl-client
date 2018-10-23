import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { UserService } from '../services/user.service';
import { AlertService } from '../services/alert.service';
import { environment } from '../../../environments/environment';
import { SpinnerLoaderService } from '../../shared/spinner-loader/spinner-loader.service';

@Component({
  selector: 'app-activate',
  templateUrl: './activate.component.html',
  styleUrls: ['./activate.component.css']
})
export class ActivateComponent implements OnInit {
  private activateForm: FormGroup;
  tokenValid: boolean;
  appName: string = environment.appName;

  constructor(private activatedRoute: ActivatedRoute,
              private userService: UserService,
              private alertService: AlertService,
              private router: Router,
              private spinnerService: SpinnerLoaderService) { }

  ngOnInit() {
    const token = this.activatedRoute.snapshot.params['id'];

    this.spinnerService.show();
    this.userService.activateAccount(token)
      .subscribe((data) => {
        this.spinnerService.hide();
        const message = data['title'];
        this.alertService.success(message);
        this.tokenValid = true;
      }, (err: HttpErrorResponse) => {
        this.spinnerService.hide();
        this.alertService.error(err.error.title);
        this.tokenValid = false;
      });

  }

  continue() {
    this.router.navigate(['users/login']);
  }

}
