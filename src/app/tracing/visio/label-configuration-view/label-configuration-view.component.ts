import { Component, OnInit, Input } from '@angular/core';
import { LabelElementInfo } from '@app/tracing/data.model';

@Component({
    selector: 'fcl-label-configuration-view',
    templateUrl: './label-configuration-view.component.html',
    styleUrls: ['./label-configuration-view.component.scss']
})
export class LabelConfigurationViewComponent implements OnInit {

    @Input() labelElements: LabelElementInfo[][];
    @Input() availableProps: { prop: string, label: string }[];

    constructor() { }

    ngOnInit() {
    }
}
