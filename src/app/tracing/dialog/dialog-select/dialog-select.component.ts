import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {Component, Inject} from '@angular/core';
import {MatLegacyCheckboxChange as MatCheckboxChange} from '@angular/material/legacy-checkbox';
import {
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
  MatLegacyDialogRef as MatDialogRef,
} from '@angular/material/legacy-dialog';
import {concat, Utils} from '@app/tracing/util/non-ui-utils';
import * as _ from 'lodash';

export interface Option {
  value: string;
  viewValue: string;
  selected: boolean;
  notRecommended?: boolean;
  disabled?: boolean | undefined;
  tooltip?: string;
}

export interface DialogSelectData {
  title: string;
  favouriteOptions: Option[];
  otherOptions: Option[];
  sorting?: string[];
}

export interface DialogResultData {
  selected: string[];
  sorting?: string[] | undefined;
}

@Component({
  selector: 'fcl-dialog-select',
  templateUrl: './dialog-select.component.html',
  styleUrls: ['./dialog-select.component.scss'],
})
export class DialogSelectComponent {
  favouriteOptions: Option[];
  otherOptions: Option[];
  sorting: Pick<Option, 'value' | 'viewValue'>[] | undefined;

  constructor(
    public dialogRef: MatDialogRef<DialogSelectComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogSelectData
  ) {
    this.favouriteOptions = _.cloneDeep(data.favouriteOptions);
    this.otherOptions = _.cloneDeep(data.otherOptions);
    const options = concat(this.favouriteOptions, this.otherOptions);
    if (data.sorting) {
      this.sorting = data.sorting.map(
        p => options.find(o => o.value === p) || {value: p, viewValue: p}
      );
    }
  }

  onOptionCheckedChange(event: MatCheckboxChange, option: Option): void {
    if (this.sorting) {
      if (event.checked) {
        // add to sorting
        const defaultOrdering = concat(
          this.favouriteOptions,
          this.otherOptions
        );

        this.sorting = Utils.insertInOrder(this.sorting, defaultOrdering, [
          option,
        ]);
      } else {
        // remove from sorting
        this.sorting = this.sorting.filter(o => o !== option);
      }
    }
  }

  onSortDrop(event: CdkDragDrop<string[]>) {
    if (this.sorting) {
      if (event.previousIndex !== event.currentIndex) {
        moveItemInArray(this.sorting, event.previousIndex, event.currentIndex);
      }
    }
  }

  //noinspection JSUnusedGlobalSymbols
  close() {
    const selected = concat(this.favouriteOptions, this.otherOptions)
      .filter(o => o.selected && !o.disabled)
      .map(o => o.value);

    const result: DialogResultData = {
      selected: selected,
      sorting: this.sorting ? this.sorting.map(o => o.value) : undefined,
    };

    this.dialogRef.close(result);
  }
}
