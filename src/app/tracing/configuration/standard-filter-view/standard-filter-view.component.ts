import {
    Component, Input, ViewEncapsulation,
    Output, EventEmitter, ChangeDetectionStrategy
} from '@angular/core';

@Component({
    selector: 'fcl-standard-filter-view',
    templateUrl: './standard-filter-view.component.html',
    styleUrls: ['./standard-filter-view.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class StandardFilterViewComponent {

    @Input() filterLabel: string;
    @Input() filterTerm: string;

    @Output() filterTermChange = new EventEmitter<string>();

    onFilterTermChange(filterTerm: string): void {
        this.filterTerm = filterTerm;
        this.filterTermChange.emit(filterTerm);
    }
}
