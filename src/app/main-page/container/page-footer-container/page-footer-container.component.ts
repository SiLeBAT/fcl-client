import {Component, OnInit} from '@angular/core';
import {environment} from '../../../../environments/environment';

@Component({
  selector: 'fcl-page-footer-container',
  templateUrl: './page-footer-container.component.html',
  styleUrls: ['./page-footer-container.component.scss'],
})
export class PageFooterContainerComponent implements OnInit {
  supportContact: string;

  ngOnInit() {
    this.supportContact = environment.supportContact;
  }
}
