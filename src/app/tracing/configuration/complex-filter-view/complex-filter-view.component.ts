import { TableColumn, ExtendedOperationType, JunktorType, ComplexFilterCondition } from './../../data.model';
import { Component, OnInit, Input, ViewEncapsulation, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormBuilder, FormArray, Validators, FormControl } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import { map, tap, filter } from 'rxjs/operators';

@Component({
    selector: 'fcl-complex-filter-view',
    templateUrl: './complex-filter-view.component.html',
    styleUrls: ['./complex-filter-view.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class ComplexFilterViewComponent implements OnInit, OnChanges {

    @Input() stationColumns: TableColumn[];
    @Input() propToValues: Map<string, string[]>;
    @Input() ExtendedOperationType: ExtendedOperationType;
    @Input() extendedOperationTypeKeys: string[];
    @Input() extendedOperationTypeValues: string[];
    @Input() JunktorType: JunktorType;
    @Input() junktorTypeKeys: string[];
    @Input() junktorTypeValues: string[];
    @Output() complexFilterConditions = new EventEmitter<ComplexFilterCondition[]>();

    filterConditionForm: FormGroup;
    valueList: string[][] = [[]];
    unfilteredValueList: string[][] = [[]];

    constructor(
        private formBuilder: FormBuilder
    ) { }

    ngOnInit() {
        this.initializeFilter();
    }

    ngOnChanges(changes: SimpleChanges) {
        this.initializeFilter();

        this.filterConditionGroups.valueChanges
            .pipe(
                map((filterGroups: FormGroup[]) => {
                    return filterGroups.filter((filterGroup: FormGroup) => {
                        return (
                            filterGroup['propertyControl'] !== '' &&
                            filterGroup['operationControl'] !== '' &&
                            filterGroup['valueControl'] !== ''
                        );
                    });
                }),
                tap((filterGroups: FormGroup[]) => this.onFilterGroupsChange(filterGroups))
        ).subscribe();
    }

    buildFilterConditionGroup(property: string, operation: string, value: string, junktor: string): FormGroup {
        return this.formBuilder.group({
            propertyControl: [property, Validators.required],
            operationControl: operation,
            valueControl: value,
            junktorControl: junktor
        });
    }

    get filterConditionGroups(): FormArray {
        return this.filterConditionForm.get('filterConditionGroups') as FormArray;
    }

    addFilterConditionElement(index: number) {
        const filterGroupToCopy: FormGroup = this.filterConditionGroups.controls[index] as FormGroup;
        const propertyValue = filterGroupToCopy.controls['propertyControl'].value;
        const operationValue = filterGroupToCopy.controls['operationControl'].value;

        let junktorValue;
        if (index > 0) {
            junktorValue = (this.filterConditionGroups.controls[index - 1] as FormGroup)
                            .controls['junktorControl'].value;
        } else {
            junktorValue = filterGroupToCopy.controls['junktorControl'].value;
        }

        const operationIndex = this.extendedOperationTypeValues.indexOf(operationValue);
        const newOperationValue = (operationIndex > -1) ? this.extendedOperationTypeKeys[operationIndex] : '';
        const junktorIndex = this.junktorTypeValues.indexOf(junktorValue);
        const newJunktorValue = (junktorIndex > -1) ? this.junktorTypeKeys[junktorIndex] : this.junktorTypeKeys[0];

        filterGroupToCopy.controls['junktorControl'].setValue(JunktorType[newJunktorValue]);

        this.filterConditionGroups.push(this.buildFilterConditionGroup(
            propertyValue,
            ExtendedOperationType[newOperationValue],
            '',
            JunktorType[newJunktorValue])
        );

        this.valueList.push([]);
        this.unfilteredValueList.push([]);

        this.onPropertyChange(propertyValue, index + 1);
    }

    removeFilterConditionElement(index: number) {
        const filterConditionGroups = this.filterConditionGroups;
        if (filterConditionGroups.length > 1) {
            filterConditionGroups.removeAt(index);
            this.valueList.splice(index, 1);
            this.unfilteredValueList.splice(index, 1);
        } else {
            filterConditionGroups.reset();
        }
    }

    onPropertyChange(selectedProperty: string, index: number) {
        this.valueList[index] = this.propToValues.get(selectedProperty);
        this.unfilteredValueList[index] = this.propToValues.get(selectedProperty);
    }

    onValueKeyup(event: KeyboardEvent, index: number) {
        const currentFilterGroup: FormGroup = this.filterConditionGroups.controls[index] as FormGroup;
        const currentValue = currentFilterGroup.controls['valueControl'].value;

        const filterValue = currentValue.toLowerCase();
        const unfilteredValueList = this.unfilteredValueList[index];
        const filteredList = unfilteredValueList.filter(listValue => {
            if (!listValue) {
                return false;
            } else {
                return listValue.toLowerCase().includes(filterValue);
            }
        });

        this.valueList[index] = filteredList;
    }

    private initializeFilter() {
        this.filterConditionForm = this.formBuilder.group({
            filterConditionGroups: this.formBuilder.array([this.buildFilterConditionGroup(
                '',
                '',
                '',
                JunktorType[this.junktorTypeKeys[0]])]
            )
        });
    }

    private onFilterGroupsChange(filterGroups: FormGroup[]) {
        const filterConditions = filterGroups.map((filterGroup: FormGroup) => {
            return {
                property: filterGroup['propertyControl'],
                operation: filterGroup['operationControl'],
                value: filterGroup['valueControl'],
                junktor: filterGroup['junktorControl']
            };
        });

        this.complexFilterConditions.emit(filterConditions);
    }

}
