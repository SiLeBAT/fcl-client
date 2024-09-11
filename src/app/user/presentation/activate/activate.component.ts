import {Component, Input} from '@angular/core';

@Component({
  selector: 'fcl-activate',
  templateUrl: './activate.component.html',
  styleUrls: ['./activate.component.scss'],
})
export class ActivateComponent {
  @Input() tokenValid: boolean;
  @Input() appName: string;
}
