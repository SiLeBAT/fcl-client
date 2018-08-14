import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { UserService } from '../services/user.service';
import { AlertService } from '../services/alert.service';
import { environment } from '../../../environments/environment';


@Component({
  selector: 'app-admin-activate',
  templateUrl: './admin-activate.component.html',
  styleUrls: ['./admin-activate.component.css']
})
export class AdminActivateComponent implements OnInit {

  adminTokenValid: boolean;
  name: string;
  appName: string = environment.appName;

  constructor(private activatedRoute: ActivatedRoute,
              private userService: UserService,
              private alertService: AlertService,
              private router: Router) { }

  ngOnInit() {
    const adminToken = this.activatedRoute.snapshot.params['id'];

    this.userService.adminActivateAccount(adminToken)
      .subscribe((data) => {
        const message = data['title'];
        this.name = data['obj'];
        this.alertService.success(message);
        this.adminTokenValid = true;
      }, (err: HttpErrorResponse) => {
        const errObj = JSON.parse(err.error);
        this.alertService.error(errObj.title);
        this.adminTokenValid = false;
      });

  }

}
