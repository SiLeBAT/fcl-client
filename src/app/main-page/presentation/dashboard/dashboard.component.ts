import { Component, Output, EventEmitter } from "@angular/core";

@Component({
    selector: "fcl-dashboard",
    templateUrl: "./dashboard.component.html",
    styleUrls: ["./dashboard.component.scss"],
})
export class DashboardComponent {
    // eslint-disable-next-line @angular-eslint/no-output-on-prefix
    @Output() onTracingView = new EventEmitter();

    tracingView() {
        this.onTracingView.emit();
    }
}
