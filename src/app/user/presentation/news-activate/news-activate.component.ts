import { Component, Input } from "@angular/core";

@Component({
    selector: "fcl-news-activate",
    templateUrl: "./news-activate.component.html",
    styleUrls: ["./news-activate.component.scss"],
    standalone: false,
})
export class NewsActivateComponent {
    @Input() tokenValid: boolean;
    @Input() appName: string;
    @Input() supportContact: string;
}
