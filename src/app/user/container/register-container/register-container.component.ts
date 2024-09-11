import {Component, OnInit} from '@angular/core';
import {
  RegistrationCredentials,
  RegistrationDetailsDTO,
  RegistrationRequestResponseDTO,
} from '../../models/user.model';
import {SpinnerLoaderService} from '../../../shared/services/spinner-loader.service';
import {UserService} from '../../services/user.service';
import {AlertService} from '../../../shared/services/alert.service';
import {Router} from '@angular/router';
import {HttpErrorResponse} from '@angular/common/http';
import {environment} from '../../../../environments/environment';
import {ValidationError} from '../../../core/model';
import {InvalidRegistrationInput} from '../../../user/errors';

@Component({
  selector: 'fcl-register-container',
  templateUrl: './register-container.component.html',
})
export class RegisterContainerComponent implements OnInit {
  private supportContact: string;
  serverValidationErrors: Partial<
    Record<keyof RegistrationCredentials, ValidationError[]>
  > = {};

  constructor(
    private spinnerService: SpinnerLoaderService,
    private alertService: AlertService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit() {
    this.supportContact = environment.supportContact;
  }

  register(credentials: RegistrationDetailsDTO) {
    this.spinnerService.show();
    this.userService.register(credentials).subscribe(
      (registerResponse: RegistrationRequestResponseDTO) => {
        this.spinnerService.hide();
        this.serverValidationErrors = {};
        this.alertService.success(
          `Please activate your account: An email has been sent to an ${registerResponse.email} with further instructions.`
        );
        this.router.navigate(['users/login']).catch(err => {
          throw new Error(`Unable to navigate: ${err}`);
        });
      },
      (err: HttpErrorResponse) => {
        this.spinnerService.hide();
        if (err instanceof InvalidRegistrationInput) {
          this.serverValidationErrors = err.errors;
          this.alertService.error(err.message || 'The registration failed.');
        } else {
          this.alertService.error(`Error during registration.
                        An email has been sent to an ${credentials.email} with further instructions.
                        If you don't receive an email please contact us directly per email to: ${this.supportContact}.`);
        }
      }
    );
  }
}
