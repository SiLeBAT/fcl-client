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
    TileServer,
    AvailableMaps,
    MapSettings,
} from "./../../../tracing/data.model";
import { Constants } from "./../../../tracing/util/constants";
import { ExampleData, ModelFileType } from "../../model/types";
import { FILE_INPUT_ELEMENT_SETTINGS } from "@app/main-page/consts/consts";
import { MatMenuTrigger } from "@angular/material/menu";
@Component({
    selector: "fcl-toolbar-action",
    templateUrl: "./toolbar-action.component.html",
    styleUrls: ["./toolbar-action.component.scss"],
})
export class ToolbarActionComponent implements OnChanges {
    private _graphSettings: GraphSettings;

    @ViewChild("modelFileInput") modelFileInput: ElementRef<HTMLInputElement>;
    @ViewChild("shapeFileInput") shapeFileInput: ElementRef<HTMLInputElement>;
    @ViewChild("openUploadMenu") openUploadMenuTrigger: MatMenuTrigger;

    @Input() tracingActive: boolean;
    @Input() isModelLoaded: boolean;
    @Input()
    set graphSettings(value: GraphSettings) {
        const { mapType, tileServer } = value;

        if (mapType === MapType.TILES_ONLY) {
            this.selectedMapOption = tileServer;
        } else {
            this.selectedMapOption = mapType;
        }

        this._graphSettings = value;
    }

    get graphSettings(): GraphSettings {
        return this._graphSettings;
    }

    @Input() hasGisInfo: boolean;
    @Input() availableMaps: AvailableMaps;
    @Input() graphEditorActive: boolean;
    @Input() currentUser: User;
    @Input() fileName: string | null = null;
    @Output() toggleRightSidebar = new EventEmitter<boolean>();
    @Output() loadModelFile = new EventEmitter<FileList>();
    @Output() loadShapeFile = new EventEmitter<FileList>();
    @Output() selectModelFile = new EventEmitter<ModelFileType>();
    @Output() selectModelFileOpenMenu = new EventEmitter<void>();
    @Output() saveImage = new EventEmitter();
    @Output() openRoaLayout = new EventEmitter();
    @Output() loadExampleDataFile = new EventEmitter<ExampleData>();
    @Output() graphType = new EventEmitter<GraphType>();
    @Output() mapSettings = new EventEmitter<Partial<MapSettings>>();
    @Output() downloadFile = new EventEmitter<string>();

    graphTypes = Constants.GRAPH_TYPES;
    selectedMapOption: string;
    fileNameWoExt: string | null = null;
    exampleData: ExampleData[] = Constants.EXAMPLE_DATA_FILE_STRUCTURE;

    private updateSelectedMapOption(): void {
        this.selectedMapOption =
            this._graphSettings.mapType === MapType.TILES_ONLY
                ? this._graphSettings.tileServer
                : this._graphSettings.mapType;
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.fileName !== undefined) {
            this.fileNameWoExt =
                this.fileName === null
                    ? null
                    : this.fileName.replace(/\.[^\.]+$/, "");
        }
    }

    openSelectModelFileMenu() {
        this.openUploadMenuTrigger.openMenu();
    }

    onSelectModelFileOpenMenu(event) {
        // prevent menu from opening, before we check if data has been loaded and altered
        event.stopPropagation();
        this.selectModelFileOpenMenu.emit();
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

    setMapType(mapType: MapType): void {
        this.mapSettings.emit({ mapType: mapType });
    }

    setTileServer(tileServer: TileServer): void {
        this.mapSettings.emit({
            mapType: MapType.TILES_ONLY,
            tileServer: tileServer,
        });
    }

    onSelectShapeFile(event): void {
        // this is necessary, otherwise the 'Load Shape File...' option might stay active, when the upload is cancelled
        // pls note: does not work in firefox, as an input doesn't lose focus in firefox in these cases
        // arrow func wrapper here provides the context of 'this' to the method call in the timeout
        setTimeout(() => {
            this.updateSelectedMapOption();
        }, 0);
        this.shapeFileInput.nativeElement.click();
    }
}
