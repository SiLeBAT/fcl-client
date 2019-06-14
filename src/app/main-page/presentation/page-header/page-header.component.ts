import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { User } from '../../../user/models/user.model';

@Component({
    selector: 'fcl-page-header',
    templateUrl: './page-header.component.html',
    styleUrls: ['./page-header.component.scss']
})
export class PageHeaderComponent implements OnInit {
    @Input() appName: string;
    @Input() tracingActive: boolean;
    @Input() dashboardActive: boolean;
    @Input() loginActive: boolean;
    @Input() currentUser: User | null;
    @Output() toggleLeftSideBar = new EventEmitter<boolean>();
    private leftOpen: boolean = false;

    constructor() { }

    ngOnInit() {
    }

    onToggleLeftSidebar() {
        this.leftOpen = !this.leftOpen;
        this.toggleLeftSideBar.emit(this.leftOpen);
    }

    isServerLess(): boolean {
        return environment.serverless;
    }

}
