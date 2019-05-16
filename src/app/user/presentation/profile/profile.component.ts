import { Component, OnInit, Input } from '@angular/core';
import { TokenizedUser } from '../../models/user.model';

@Component({
    selector: 'fcl-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
    @Input() currentUser: TokenizedUser;

    constructor() { }

    ngOnInit() {}

}
