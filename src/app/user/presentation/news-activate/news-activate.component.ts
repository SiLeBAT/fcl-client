import { Component, Input } from '@angular/core';

@Component({
    selector: 'fcl-news-activate',
    templateUrl: './news-activate.component.html',
    styleUrls: ['./news-activate.component.scss']
})
export class NewsActivateComponent {
    @Input() tokenValid: boolean;
    @Input() appName: string;
    @Input() supportContact: string;

}
