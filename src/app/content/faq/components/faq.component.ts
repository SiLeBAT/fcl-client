import {Component, ChangeDetectionStrategy} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Faq} from '../faq.model';

@Component({
  selector: 'fcl-faq',
  template: `
    <fcl-faq-view
      [faq]="faq"
      [activeFragment]="activeFragment$ | async"
    ></fcl-faq-view>
  `,
  styleUrls: ['./faq.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaqComponent {
  faq: Faq = this.activatedRoute.snapshot.data['faqCollection'];
  activeFragment$ = this.activatedRoute.fragment;

  constructor(private activatedRoute: ActivatedRoute) {}
}
