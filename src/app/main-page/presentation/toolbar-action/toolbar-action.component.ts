import {
    Component,
    Output,
    EventEmitter,
    ViewChild,
    ElementRef,
    Input,
    OnChanges,
    SimpleChanges,
} from "@angular/core";
import { environment } from "@env/environment";
import { User } from "@app/user/models/user.model";
import {
    GraphSettings,
    GraphType,
    MapVariant,
    MapType,
} from "./../../../tracing/data.model";
import { Constants } from "./../../../tracing/util/constants";
import { ExampleData } from "../../model/types";

@Component({
    selector: "fcl-toolbar-action",
    templateUrl: "./toolbar-action.component.html",
    styleUrls: ["./toolbar-action.component.scss"],
})
export class ToolbarActionComponent implements OnChanges {
    private _graphSettings: GraphSettings;

    @ViewChild("modelFileInput") modelFileInput: ElementRef<HTMLInputElement>;
    @ViewChild("shapeFileInput") shapeFileInput: ElementRef<HTMLInputElement>;

    @Input() tracingActive: boolean;
    @Input()
    set graphSettings(value: GraphSettings) {
        this.selectedMapTypeOption = "" + value.mapVariant;
        this._graphSettings = value;
    }
    get graphSettings(): GraphSettings {
        return this._graphSettings;
    }

    @Input() hasGisInfo: boolean;
    @Input() availableMapTypes: MapType[];
    @Input() graphEditorActive: boolean;
    @Input() currentUser: User;
    @Input() fileName: string | null = null;
    @Output() toggleRightSidebar = new EventEmitter<boolean>();
    @Output() loadModelFile = new EventEmitter<FileList>();
    @Output() loadShapeFile = new EventEmitter<FileList>();
    @Output() selectModelFile = new EventEmitter();
    @Output() saveImage = new EventEmitter();
    @Output() openRoaLayout = new EventEmitter();
    @Output() loadExampleDataFile = new EventEmitter<ExampleData>();
    @Output() graphType = new EventEmitter<GraphType>();
    @Output() mapType = new EventEmitter<MapVariant>();
    // please note: MapType.BLACK_AND_WHITE is temporarily deactivated
    @Output() mapTypeSelected =
        new EventEmitter<MapType.MAPNIK /*|MapType.BLACK_AND_WHITE*/>();
    @Output() downloadFile = new EventEmitter<string>();

    graphTypes = Constants.GRAPH_TYPES;
    selectedMapTypeOption: string;
    fileNameWoExt: string | null = null;
    mapTypes = Constants.DEFAULT_MAP_VARIANTS;
    exampleData: ExampleData[] = Constants.EXAMPLE_DATA_FILE_STRUCTURE;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.fileName !== undefined) {
            this.fileNameWoExt =
                this.fileName === null
                    ? null
                    : this.fileName.replace(/\.[^\.]+$/, "");
        }
    }

    isServerLess(): boolean {
        return environment.serverless;
    }

    onModelFileInput(event: any) {
        const fileList: FileList = event.target.files;
        this.loadModelFile.emit(fileList);
        event.target.value = null;
    }

    onShapeFileInput(event: any) {
        const fileList: FileList = event.target.files;
        this.loadShapeFile.emit(fileList);
        event.target.value = null;
    }

    onSelectModelFile() {
        this.selectModelFile.emit();
    }

    clickModelFileInputElement() {
        this.modelFileInput.nativeElement.click();
    }

    onLoadExampleDataFile(exampleData: ExampleData) {
        this.loadExampleDataFile.emit(exampleData);
    }

    onDownloadDataFile() {
        if (this.fileNameWoExt) {
            this.downloadFile.emit(this.fileNameWoExt);
        }
    }

    onSaveImage() {
        this.saveImage.emit();
    }

    onOpenRoaLayout() {
        this.openRoaLayout.emit();
    }

    getFileNameWoExt(): string | null {
        return this.fileNameWoExt;
    }

    setGraphType() {
        this.graphType.emit(this.graphSettings.type);
    }

    setMapData(mapVariant: MapVariant): void {
        // please note: MapType.BLACK_AND_WHITE is temporarily deactivated
        const isMap =
            mapVariant ===
            Constants.DEFAULT_MAP_VARIANTS[
                MapType.MAPNIK
            ]; /*|| mapVariant === Constants.DEFAULT_MAP_VARIANTS[MapType.BLACK_AND_WHITE]*/
        const isShapeFileOnMap =
            mapVariant ===
            Constants.DEFAULT_MAP_VARIANTS[MapType.SHAPE_FILE_ON_MAP];
        const callback = () => {
            this.setMapType(mapVariant);
        };
        let newMapVariant: MapVariant = mapVariant;

        if (isMap) {
            const { mapLayer: newMapLayer } = mapVariant;
            this.setMapTypeSelected(newMapLayer!, callback);
            return;
        }

        if (isShapeFileOnMap) {
            const { lastMapTypeSelected } = this.graphSettings;
            newMapVariant = {
                ...mapVariant,
                mapLayer: lastMapTypeSelected,
            };
        }

        this.setMapType(newMapVariant);
    }

    setMapTypeSelected(
        newMapLayer: MapType.MAPNIK /*|MapType.BLACK_AND_WHITE*/,
        callback,
    ): void {
        // please note: MapType.BLACK_AND_WHITE is temporarily deactivated
        const { lastMapTypeSelected } = this.graphSettings;
        const differentMapSelected = newMapLayer !== lastMapTypeSelected;

        if (!differentMapSelected) {
            callback();
            return;
        }

        this.mapTypeSelected.emit(newMapLayer);
        callback();
    }

    setMapType(mapVariant: MapVariant): void {
        this.mapType.emit(mapVariant);
    }

    onSelectShapeFile(event): void {
        // this is necessary, otherwise the 'Load Shape File...' option might stay active
        setTimeout(() => {
            this.selectedMapTypeOption = "" + this._graphSettings.mapVariant;
        }, 0);

        this.shapeFileInput.nativeElement.click();
    }
}
