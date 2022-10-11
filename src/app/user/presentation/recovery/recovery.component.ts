import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ResetRequestDTO } from '@app/user/models/user.model';

@Component({
    selector: 'fcl-recovery',
    templateUrl: './recovery.component.html',
    styleUrls: ['./recovery.component.scss']
})
export class RecoveryComponent implements OnInit {
    @Output() recovery = new EventEmitter();
    recoveryForm: FormGroup;

    ngOnInit() {
        this.recoveryForm = new FormGroup({
            email: new FormControl(null, [Validators.required, Validators.email])
        });
    }

    onRecovery() {
        const email: ResetRequestDTO = {
            email: this.recoveryForm.value.email
        };
        this.recovery.emit(email);
        this.recoveryForm.reset();
    }

    validateField(fieldName: string) {
        return this.recoveryForm.controls[fieldName].valid || this.recoveryForm.controls[fieldName].untouched;
    }
}
