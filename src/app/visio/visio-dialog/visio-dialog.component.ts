import { AfterViewInit, Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

import { DialogAlignment } from '../../util/datatypes';
import { Utils } from '../../util/utils';

export interface VisioLayoutData {
    data: string;
}

@Component({
    selector: 'app-visio-dialog-properties',
    templateUrl: './visio-dialog.component.html',
    styleUrls: ['./visio-dialog.component.css']
})
export class VisioLayoutComponent implements OnInit, OnDestroy, AfterViewInit {

    @ViewChild('graphContainer') graphContainer: ElementRef;

    title: string;
    graphWidth: number;
    graphHeight: number;
    svg: string;
    escapedSvg: string;

    private dialogAlign = DialogAlignment.CENTER;

    constructor(public dialogRef: MatDialogRef<VisioLayoutComponent>, @Inject(MAT_DIALOG_DATA) public data: string) {
        this.title = 'Visio layout';
        this.graphWidth = 600;
        this.graphHeight = 400;
        this.svg = data;
        this.escapedSvg = Utils.replaceAll(this.svg, '"', '\\"');
    }

    //noinspection JSUnusedGlobalSymbols
    close() {
        this.dialogRef.close();
    }

    ngOnInit() {
        this.dialogRef.updatePosition(Utils.getDialogPosition(this.dialogAlign));
    }

    ngOnDestroy() {
    }

    moveLeft() {
        this.dialogAlign = this.dialogAlign === DialogAlignment.RIGHT ? DialogAlignment.CENTER : DialogAlignment.LEFT;
        this.dialogRef.updatePosition(Utils.getDialogPosition(this.dialogAlign));
    }

    moveRight() {
        this.dialogAlign = this.dialogAlign === DialogAlignment.LEFT ? DialogAlignment.CENTER : DialogAlignment.RIGHT;
        this.dialogRef.updatePosition(Utils.getDialogPosition(this.dialogAlign));
    }

    ngAfterViewInit() {

    }
}
