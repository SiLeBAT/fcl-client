import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { UserService } from '../../../user/services/user.service';
import { MainPageService } from '../../services/main-page.service';

@Component({
    selector: 'fcl-page-header',
    templateUrl: './page-header.component.html',
    styleUrls: ['./page-header.component.scss']
})
export class PageHeaderComponent implements OnInit {
    @Input() appName: string;
    @Output() toggleLeftSideBar = new EventEmitter<boolean>();
    private leftOpen: boolean = false;

    constructor(private userService: UserService,
                private mainPageService: MainPageService) { }

    ngOnInit() {
    }

    onToggleLeftSidebar() {
        this.leftOpen = !this.leftOpen;
        this.toggleLeftSideBar.emit(this.leftOpen);
    }

    isServerLess(): boolean {
        return environment.serverless;
    }

    isTracingActive() {
        return this.mainPageService.isTracingActive();
    }

}
