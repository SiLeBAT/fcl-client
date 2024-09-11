import { Component, Input, Output, EventEmitter } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { User } from "../../../user/models/user.model";

@Component({
    selector: "fcl-page-header",
    templateUrl: "./page-header.component.html",
    styleUrls: ["./page-header.component.scss"],
})
export class PageHeaderComponent {
    @Input() appName: string;
    @Input() tracingActive: boolean;
    @Input() dashboardActive: boolean;
    @Input() loginActive: boolean;
    @Input() currentUser: User | null;
    @Output() toggleRightSideBar = new EventEmitter<boolean>();
    private rightOpen: boolean = false;

    onToggleRightSideBar() {
        this.rightOpen = !this.rightOpen;
        this.toggleRightSideBar.emit(this.rightOpen);
    }

    isServerLess(): boolean {
        return environment.serverless;
    }
}
