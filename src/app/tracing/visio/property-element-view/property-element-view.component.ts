import {
    Component,
    Output,
    Input,
    EventEmitter,
    OnChanges,
    SimpleChanges,
} from "@angular/core";
import { MatSelectChange } from "@angular/material/select";
import { PropInfo } from "../model";

const DEFAULT_MAT_SELECT_TOOLTIP = "Select property";

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

    useActivePropWarningAsMatSelectTooltip = false;
    private propWrapper_: string = "";
    private activeProp_: PropInfo | undefined;

    get matSelectTooltip(): string | undefined {
        return this.useActivePropWarningAsMatSelectTooltip &&
            this.activeProp_?.warnings
            ? this.activeProp_.warnings
            : DEFAULT_MAT_SELECT_TOOLTIP;
    }

    get propWrapper(): string {
        return this.propWrapper_;
    }

    get activeProp(): PropInfo | undefined {
        return this.activeProp_;
    }

    ngOnChanges(changes: SimpleChanges): void {
        this.propWrapper_ = this.prop ?? "";
        if (changes.prop) {
            this.activeProp_ =
                this.prop === null
                    ? undefined
                    : (this.availableProps.find(
                          (p) => p.prop === this.prop,
                      ) ?? {
                          prop: this.prop,
                          label: this.prop,
                          isDataUnavailable: true,
                          warnings: "Data is not available.",
                      });
        }
    }

    onAltTextChange(altText: string): void {
        this.altTextChange.emit(altText);
    }

    onSelectionChange(change: MatSelectChange): void {
        this.propChange.emit(change.value || null);
    }
}
