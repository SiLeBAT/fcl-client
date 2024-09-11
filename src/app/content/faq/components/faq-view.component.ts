import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  QueryList,
  SimpleChanges,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import {Faq} from '../faq.model';

@Component({
  selector: 'fcl-faq-view',
  templateUrl: './faq-view.component.html',
  styleUrls: ['./faq-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaqViewComponent implements AfterViewInit, OnChanges {
  @Input() faq: Faq;
  @Input() activeFragment: string | null;

  @ViewChildren('faqSection')
  private faqSectionRefs: QueryList<
    ElementRef<{
      id: string;
      scrollIntoView: () => void;
    }>
  >;

  @ViewChild('scrollPanel')
  private scrollPanel: ElementRef<{
    scrollIntoView: (alignToTop: boolean) => void;
  }>;

  ngOnChanges(changes: SimpleChanges): void {
    const fragmentChange = changes.activeFragment;
    if (fragmentChange && !fragmentChange.firstChange) {
      this.scrollToFragment(fragmentChange.currentValue);
    }
  }

  ngAfterViewInit(): void {
    this.scrollToFragment(this.activeFragment);
  }

  private scrollToFragment(fragment: string | null): void {
    if (fragment === null) {
      if (this.scrollPanel.nativeElement.scrollIntoView !== undefined) {
        this.scrollPanel.nativeElement.scrollIntoView(true);
      }
    } else {
      const faqSectionRef = this.faqSectionRefs.find(
        ref => ref.nativeElement.id === fragment
      );
      if (faqSectionRef) {
        faqSectionRef.nativeElement.scrollIntoView();
      }
    }
  }
}
