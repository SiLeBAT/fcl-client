import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { UserService } from '../../../user/services/user.service';
import { MainPageService } from '../../services/main-page.service';

@Component({
    selector: 'fcl-toolbar-action',
    templateUrl: './toolbar-action.component.html',
    styleUrls: ['./toolbar-action.component.scss']
})
export class ToolbarActionComponent implements OnInit {
    @Output() toggleRightSidebar = new EventEmitter<boolean>();
    private rightOpen: boolean = false;

    constructor(private userService: UserService,
                private mainPageService: MainPageService) { }

    ngOnInit() {
    }

    isServerLess(): boolean {
        return environment.serverless;
    }

    isTracingActive() {
        return this.mainPageService.isTracingActive();
    }
    onToggleRightSidebar() {
        this.rightOpen = !this.rightOpen;
        this.toggleRightSidebar.emit(this.rightOpen);
    }
}
