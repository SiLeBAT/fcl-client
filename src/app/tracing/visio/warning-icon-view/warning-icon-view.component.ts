import { ChangeDetectionStrategy, Component } from "@angular/core";

@Component({
    selector: "fcl-warning-icon-view",
    templateUrl: "./warning-icon-view.component.html",
    styleUrls: ["./warning-icon-view.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class WarningIconViewComponent {}
