import { Component, OnInit, Output, EventEmitter, OnDestroy, ViewChild, ElementRef, Input } from '@angular/core';
import { environment } from '@env/environment';
import { UserService } from '@app/user/services/user.service';
import * as _ from 'lodash';

@Component({
    selector: 'fcl-toolbar-action',
    templateUrl: './toolbar-action.component.html',
    styleUrls: ['./toolbar-action.component.scss']
})
export class ToolbarActionComponent implements OnInit {
    @ViewChild('fileInput') fileInput: ElementRef;

    @Input() tracingActive: boolean;
    @Output() toggleRightSidebar = new EventEmitter<boolean>();
    @Output() loadData = new EventEmitter<FileList>();
    @Output() loadExampleData = new EventEmitter();

    private rightOpen: boolean = false;

    constructor(
        private userService: UserService
    ) { }

    ngOnInit() {
    }

    isServerLess(): boolean {
        return environment.serverless;
    }

    onToggleRightSidebar() {
        this.rightOpen = !this.rightOpen;
        this.toggleRightSidebar.emit(this.rightOpen);
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
}
