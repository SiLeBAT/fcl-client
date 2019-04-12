import { Component, OnInit, Output, EventEmitter, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { UserService } from '../../../user/services/user.service';
import { MainPageService } from '../../services/main-page.service';
import * as _ from 'lodash';

@Component({
    selector: 'fcl-toolbar-action',
    templateUrl: './toolbar-action.component.html',
    styleUrls: ['./toolbar-action.component.scss']
})
export class ToolbarActionComponent implements OnInit, OnDestroy {
    @ViewChild('fileInput') fileInput: ElementRef;
    @Output() toggleRightSidebar = new EventEmitter<boolean>();
    subscriptions = [];
    private rightOpen: boolean = false;

    constructor(private userService: UserService,
                private mainPageService: MainPageService) { }

    ngOnInit() {
        this.subscriptions.push(
            this.mainPageService.doInputEmpty
                .subscribe(() => {
                    this.setInputEmpty();
                },
                    (error => {
                        throw new Error(`error making input element empty: ${error}`);
                    })
          )
        );
    }

    isServerLess(): boolean {
        return environment.serverless;
    }

    isTracingActive() {
        return this.mainPageService.isTracingActive();
    }
    onToggleRightSidebar() {
        this.rightOpen = !this.rightOpen;
        this.toggleRightSidebar.emit(this.rightOpen);
    }

    setInputEmpty() {
        (this.fileInput.nativeElement as HTMLInputElement).value = '';
    }

    ngOnDestroy() {
        _.forEach(this.subscriptions, subscription => {
            subscription.unsubscribe();
        });
    }

}
