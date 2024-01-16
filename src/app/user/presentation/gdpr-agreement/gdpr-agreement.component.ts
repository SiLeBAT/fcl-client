import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Validators, FormControl, FormGroup } from '@angular/forms';

interface GdprAgreementForm {
    dataProtection: FormControl<boolean>;
}

@Component({
    selector: 'fcl-gdpr-agreement',
    templateUrl: './gdpr-agreement.component.html',
    styleUrls: ['./gdpr-agreement.component.scss']
})
export class GdprAgreementComponent implements OnInit {
    gdprAgreementForm: FormGroup<GdprAgreementForm>;

    constructor(
        public dialogRef: MatDialogRef<GdprAgreementComponent>
    ) { }

    ngOnInit() {
        this.gdprAgreementForm = new FormGroup<GdprAgreementForm>({
            dataProtection: new FormControl(false, Validators.requiredTrue)
        });
    }

    closeDialog() {
        this.dialogRef.close(this.gdprAgreementForm.value.dataProtection);
    }

    validateField(fieldName: string) {
        return this.gdprAgreementForm.controls[fieldName].valid
               || this.gdprAgreementForm.controls[fieldName].untouched;
    }

}
