import {
    Component,
    Output,
    Input,
    EventEmitter,
    OnChanges,
    SimpleChanges,
} from "@angular/core";
import { MatSelectChange } from "@angular/material/select";
import { PropInfo } from "@app/tracing/shared/property-info";

@Component({
    selector: "fcl-property-element-view",
    templateUrl: "./property-element-view.component.html",
    styleUrls: ["./property-element-view.component.scss"],
})
export class PropertyElementViewComponent implements OnChanges {
    @Input() availableProps: PropInfo[];
    @Input() prop: string | null = null;
    @Input() altText: string;
    @Input() enableNullProp = false;

    @Output() propChange = new EventEmitter<string | null>();
    @Output() altTextChange = new EventEmitter<string>();

    private propWrapper_: string = "";

    get propWrapper(): string {
        return this.propWrapper_;
    }

    ngOnChanges(changes: SimpleChanges): void {
        this.propWrapper_ = this.prop ?? "";
    }

    isActivePropAvailable(): boolean {
        return this.availableProps.some((p) => p.prop === this.prop);
    }

    onAltTextChange(altText: string): void {
        this.altTextChange.emit(altText);
    }

    onSelectionChange(change: MatSelectChange): void {
        this.propChange.emit(change.value || null);
    }
}
