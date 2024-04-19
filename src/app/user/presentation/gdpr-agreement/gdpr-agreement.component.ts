import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Validators, FormControl, FormGroup } from '@angular/forms';

interface GdprAgreementForm {
    dataProtection: FormControl<boolean | null>;
}

@Component({
    selector: 'fcl-gdpr-agreement',
    templateUrl: './gdpr-agreement.component.html',
    styleUrls: ['./gdpr-agreement.component.scss']
})
export class GdprAgreementComponent {
    gdprAgreementForm = new FormGroup<GdprAgreementForm>({
        dataProtection: new FormControl(false as boolean, Validators.requiredTrue)
    });

    constructor(
        public dialogRef: MatDialogRef<GdprAgreementComponent>
    ) { }

    closeDialog() {
        this.dialogRef.close(this.gdprAgreementForm.value.dataProtection);
    }

    validateField(fieldName: string) {
        return this.gdprAgreementForm.controls[fieldName].valid
               || this.gdprAgreementForm.controls[fieldName].untouched;
    }

}
