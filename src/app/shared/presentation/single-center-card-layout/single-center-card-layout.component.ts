import { Component, Input } from '@angular/core';

@Component({
    selector: 'fcl-single-center-card-layout',
    templateUrl: './single-center-card-layout.component.html',
    styleUrls: ['./single-center-card-layout.component.scss']
})
export class SingleCenterCardLayoutComponent {
    @Input() cardtitle: string;

}
