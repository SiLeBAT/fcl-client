import { Component, OnInit, Input, ViewEncapsulation, ViewChild, ElementRef, AfterViewInit, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'fcl-standard-filter-view',
    templateUrl: './standard-filter-view.component.html',
    styleUrls: ['./standard-filter-view.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class StandardFilterViewComponent implements OnInit {
    @Input() filterLabel: string;
    @ViewChild('filterInput', { static: false }) filterInput: ElementRef;
    @Output() standardFilterTerm = new EventEmitter<string>();

    constructor() { }

    ngOnInit() {
    }

    onKeyup(event) {
        this.standardFilterTerm.emit(this.filterInput.nativeElement.value);
    }
}
