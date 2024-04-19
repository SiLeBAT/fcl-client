import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { GroupData } from '@app/tracing/data.model';
import { FormGroupDirective, NgForm, ValidationErrors, AbstractControl, FormControl } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { GroupingService } from '../grouping.service';
import { GroupingState } from '../model';
import { MergeStationsValidationCode } from '../validation-codes';
import * as fromTracing from '@app/tracing/state/tracing.reducers';
import { Store } from '@ngrx/store';
import * as storeActions from '../../state/tracing.actions';
import { Utils } from '@app/tracing/util/non-ui-utils';

/** Error when invalid control is dirty, touched, or submitted. */
export class MyErrorStateMatcher implements ErrorStateMatcher {
    isErrorState<T>(control: FormControl<T> | null, form: FormGroupDirective | NgForm | null): boolean {
        const isSubmitted = form && form.submitted;
        return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
    }
}

export interface MergeStationsDialogData {
    memberIds: string[];
    state: GroupingState;
}

@Component({
    selector: 'fcl-merge-stations-dialog',
    templateUrl: './merge-stations-dialog.component.html',
    styleUrls: ['./merge-stations-dialog.component.scss']
})
export class MergeStationsDialogComponent {

    inputFormControl = new FormControl('', (control: AbstractControl) => this.isInputValid(control));

    validationCodeEnum = MergeStationsValidationCode;

    containedGroups: GroupData[];

    matcher = new MyErrorStateMatcher();

    constructor(
        private groupingService: GroupingService,
        private store: Store<fromTracing.State>,
        public dialogRef: MatDialogRef<MergeStationsDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: MergeStationsDialogData
    ) {
        const memberSet = Utils.createSimpleStringSet(data.memberIds);
        this.containedGroups = data.state.groupSettings.filter(g => memberSet[g.id]);
        if (this.containedGroups.length === 1) {
            this.inputFormControl.setValue(this.containedGroups[0].id);
            this.inputFormControl.markAsDirty();
        }
    }

    onOk() {
        const payload = this.groupingService.getMergeStationsPayload(this.data.state, this.inputFormControl.value ?? '', this.data.memberIds);
        if (payload) {
            this.store.dispatch(new storeActions.SetStationGroupsSOA(payload));
            this.dialogRef.close();
        }
    }

    private isInputValid(control: AbstractControl): ValidationErrors | null {
        if (control.dirty) {
            const validationCode = this.groupingService.validateMergeStationsCmd(
                this.data.state, control.value, this.data.memberIds
            );

            if (validationCode !== MergeStationsValidationCode.OK) {
                return {
                    validationError: validationCode
                };
            }
        }
        // Everything is ok
        return null;
    }
}
