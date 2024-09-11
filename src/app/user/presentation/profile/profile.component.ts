import {Component, Input} from '@angular/core';
import {TokenizedUser} from '../../models/user.model';

@Component({
  selector: 'fcl-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent {
  @Input() currentUser: TokenizedUser;
}
