import { Component, SecurityContext, Input, ChangeDetectionStrategy } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FaqEntry } from '../faq.model';

@Component({
    selector: 'fcl-faq-section-view',
    templateUrl: './faq-section-view.component.html',
    styleUrls: ['./faq-section-view.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FaqSectionViewComponent {

    @Input() title?: string;
    @Input() entries: FaqEntry[];

    constructor(private sanitizer: DomSanitizer) { }

    sanitize(input: string): SafeHtml {
        return this.sanitizer.sanitize(SecurityContext.HTML, input) ?? '';
    }
}
