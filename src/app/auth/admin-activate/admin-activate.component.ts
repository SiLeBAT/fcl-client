import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Component, OnInit } from '@angular/core';

import { UserService } from '../services/user.service';
import { AlertService } from '../services/alert.service';
import { environment } from '../../../environments/environment';
import { SpinnerLoaderService } from '../../shared/spinner-loader/spinner-loader.service';

@Component({
  // tslint:disable-next-line:component-selector
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
              private spinnerService: SpinnerLoaderService) { }

    ngOnInit() {
        const adminToken = this.activatedRoute.snapshot.params['id'];

        this.spinnerService.show();
        this.userService.adminActivateAccount(adminToken)
      .subscribe((data) => {
          this.spinnerService.hide();
          const message = data['title'];
          this.name = data['obj'];
          this.alertService.success(message);
          this.adminTokenValid = true;
      }, (err: HttpErrorResponse) => {
          this.spinnerService.hide();
          this.alertService.error(err.error.title);
          this.adminTokenValid = false;
      });

    }

}
