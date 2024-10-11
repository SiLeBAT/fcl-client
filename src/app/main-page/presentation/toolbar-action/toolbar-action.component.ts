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
    MapType,
} from "./../../../tracing/data.model";
import { Constants } from "./../../../tracing/util/constants";
import { ExampleData, ModelFileType } from "../../model/types";
import { FILE_INPUT_ELEMENT_SETTINGS } from "@app/main-page/consts/consts";

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
        this.selectedMapTypeOption = "" + value.mapType;
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
    @Output() selectModelFile = new EventEmitter<ModelFileType>();
    @Output() saveImage = new EventEmitter();
    @Output() openRoaLayout = new EventEmitter();
    @Output() loadExampleDataFile = new EventEmitter<ExampleData>();
    @Output() graphType = new EventEmitter<GraphType>();
    @Output() mapType = new EventEmitter<MapType>();
    @Output() downloadFile = new EventEmitter<string>();

    graphTypes = Constants.GRAPH_TYPES;
    selectedMapTypeOption: string;
    fileNameWoExt: string | null = null;

    mapTypeToLabelMap: Map<MapType, string> = new Map([
        [MapType.MAPNIK, "Mapnik"],
        // the following code is commented because
        // the Black & White Map might be deactivatd only temporaryly
        // [MapType.BLACK_AND_WHITE, 'Black & White'],
        [MapType.SHAPE_FILE, "Shape File"],
    ]);

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

    onSelectModelFile(type: ModelFileType) {
        this.selectModelFile.emit(type);
    }

    prepareAndClickModelFileInputElement(type: ModelFileType) {
        this.modelFileInput.nativeElement.accept =
            FILE_INPUT_ELEMENT_SETTINGS[type].accept;
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

    setMapType(mapType: MapType) {
        this.mapType.emit(mapType);
    }

    onSelectShapeFile(event): void {
        // this is necessary, otherwise the 'Load Shape File...' option might stay active
        setTimeout(() => {
            this.selectedMapTypeOption = "" + this._graphSettings.mapType;
        }, 0);

        this.shapeFileInput.nativeElement.click();
    }
}
