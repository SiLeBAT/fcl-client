import { Component, OnInit } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { ActivatedRoute } from '@angular/router';

import { UserService } from '../../services/user.service';
import { AlertService } from '../../../shared/services/alert.service';
import { NewsConfirmationResponseDTO } from '@app/user/models/user.model';

@Component({
    selector: 'fcl-news-activate-container',
    templateUrl: './news-activate-container.component.html'
})
export class NewsActivateContainerComponent implements OnInit {
    tokenValid: boolean;
    appName: string = environment.appName;
    supportContact: string = environment.supportContact;

    constructor(
        private activatedRoute: ActivatedRoute,
        private userService: UserService,
        private alertService: AlertService) { }

    ngOnInit() {
        const token = this.activatedRoute.snapshot.params['id'];

        this.userService.confirmNewsletterSubscription(token)
            .subscribe((newsConfirmationResponse: NewsConfirmationResponseDTO) => {
                const message = 'Newsletter Subscription successful!';
                this.alertService.success(message);
                this.tokenValid = true;
            }, () => {
                this.alertService.error('Your Newsletter Subscription failed!');
                this.tokenValid = false;
            });
    }

}
