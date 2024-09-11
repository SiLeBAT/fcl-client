import {Component, Input, Output, EventEmitter} from '@angular/core';
import {User} from '../../../user/models/user.model';

@Component({
  selector: 'fcl-avatar',
  templateUrl: './avatar.component.html',
  styleUrls: ['./avatar.component.scss'],
})
export class AvatarComponent {
  @Input() currentUser: User | null;
  // eslint-disable-next-line @angular-eslint/no-output-on-prefix
  @Output() onLogout = new EventEmitter();
  // eslint-disable-next-line @angular-eslint/no-output-on-prefix
  @Output() onProfile = new EventEmitter();

  logout() {
    this.onLogout.emit();
  }

  goToProfile() {
    this.onProfile.emit();
  }
}
