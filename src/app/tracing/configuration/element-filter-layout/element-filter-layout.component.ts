import { Component, OnInit, Input, TemplateRef } from '@angular/core';

@Component({
    selector: 'fcl-element-filter-layout',
    templateUrl: './element-filter-layout.component.html',
    styleUrls: ['./element-filter-layout.component.scss']
})
export class ElementFilterLayoutComponent implements OnInit {

    @Input() standardFilterTemplate: TemplateRef<any>;
    @Input() clearAllFilterTemplate: TemplateRef<any>;
    @Input() predefinedFilterTemplate: TemplateRef<any>;
    @Input() complexFilterTemplate: TemplateRef<any>;
    @Input() elementTableTemplate: TemplateRef<any>;

    moreFilterOpenState: boolean = false;
    complexFilterOpenState: boolean = false;

    constructor() { }

    ngOnInit() {
    }
}
