import {
    Component,
    Output,
    Input,
    EventEmitter,
    ChangeDetectionStrategy,
} from "@angular/core";

@Component({
    selector: "fcl-zoom-view",
    templateUrl: "./zoom-view.component.html",
    styleUrls: ["./zoom-view.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class ZoomViewComponent {
    @Output() zoomReset = new EventEmitter();
    @Output() zoomIn = new EventEmitter();
    @Output() zoomOut = new EventEmitter();
}
