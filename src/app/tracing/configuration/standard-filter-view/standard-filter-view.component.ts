import {
    Component, Input, ViewEncapsulation,
    Output, EventEmitter, ChangeDetectionStrategy
} from '@angular/core';

@Component({
    selector: 'fcl-standard-filter-view',
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './standard-filter-view.component.html',
    styleUrls: ['./standard-filter-view.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class StandardFilterViewComponent {

    @Input() filterLabel: string;
    @Input() filterTerm: string;

    @Output() filterTermChange = new EventEmitter<string>();

    constructor() { }

    onFilterTermChange(filterTerm: string): void {
        this.filterTerm = filterTerm;
        this.filterTermChange.emit(filterTerm);
    }
}
