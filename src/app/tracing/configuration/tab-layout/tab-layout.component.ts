import {
    Component,
    OnInit,
    ChangeDetectionStrategy,
    ViewEncapsulation,
    Input,
    Output,
    EventEmitter,
    TemplateRef
} from '@angular/core';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { Observable } from 'rxjs';

export interface TabConfig {
    tabLabel: string;
    tabTemplate?: TemplateRef<any>;
}

@Component({
    selector: 'fcl-tab-layout',
    templateUrl: './tab-layout.component.html',
    styleUrls: ['./tab-layout.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class TabLayoutComponent implements OnInit {

    @Input() activeTabIndex$: Observable<number>;
    @Input() tabGroupId: string;
    @Input() tabConfigs: TabConfig[];
    @Output() tabGroupIndex = new EventEmitter<number>();

    constructor() { }

    ngOnInit() {}

    onTabGroupClick(event: MatTabChangeEvent) {
        this.tabGroupIndex.emit(event.index);
    }
}
