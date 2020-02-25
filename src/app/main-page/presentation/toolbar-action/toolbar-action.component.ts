import { Component, OnInit, Output, EventEmitter, ViewChild, ElementRef, Input } from '@angular/core';
import { environment } from '@env/environment';
import * as _ from 'lodash';
import { MainPageService } from '../../services/main-page.service';
import { User } from '@app/user/models/user.model';
import { GraphSettings, GraphType } from './../../../tracing/data.model';
import { Constants } from './../../../tracing/util/constants';

@Component({
    selector: 'fcl-toolbar-action',
    templateUrl: './toolbar-action.component.html',
    styleUrls: ['./toolbar-action.component.scss']
})
export class ToolbarActionComponent implements OnInit {
    @ViewChild('fileInput', { static: false }) fileInput: ElementRef;
    @Input() tracingActive: boolean;
    @Input() graphSettings: GraphSettings;
    @Input() hasGisInfo: boolean;
    @Input() graphEditorActive: boolean;
    @Input() currentUser: User;
    @Output() toggleRightSidebar = new EventEmitter<boolean>();
    @Output() loadData = new EventEmitter<FileList>();
    @Output() loadExampleData = new EventEmitter();
    @Output() graphType = new EventEmitter<GraphType>();

    graphTypes = Constants.GRAPH_TYPES;

    constructor(private mainPageService: MainPageService) { }

    ngOnInit() {}

    isServerLess(): boolean {
        return environment.serverless;
    }

    onLoadData(event$) {
        const fileList: FileList = event$.target.files;
        this.loadData.emit(fileList);
    }

    onSelectFile(event$) {
        const nativeFileInput: HTMLInputElement = this.fileInput.nativeElement;
        nativeFileInput.value = '';
        nativeFileInput.click();
    }

    onLoadExampleData() {
        this.loadExampleData.emit();
    }

    setGraphType() {
        this.graphType.emit(this.graphSettings.type);
    }
}
