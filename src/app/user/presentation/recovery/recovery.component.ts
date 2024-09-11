import {Component, Output, EventEmitter} from '@angular/core';
import {Validators, FormControl, FormGroup} from '@angular/forms';
import {ResetRequestDTO} from '@app/user/models/user.model';

interface RecoveryForm {
  email: FormControl<string | null>;
}

@Component({
  selector: 'fcl-recovery',
  templateUrl: './recovery.component.html',
  styleUrls: ['./recovery.component.scss'],
})
export class RecoveryComponent {
  @Output() recovery = new EventEmitter<ResetRequestDTO>();

  recoveryForm = new FormGroup<RecoveryForm>({
    email: new FormControl<string | null>(null, [
      Validators.required,
      Validators.email,
    ]),
  });

  onRecovery() {
    const email: ResetRequestDTO = {
      email: this.recoveryForm.value.email ?? '',
    };
    this.recovery.emit(email);
    this.recoveryForm.reset();
  }

  validateField(fieldName: string) {
    return (
      this.recoveryForm.controls[fieldName].valid ||
      this.recoveryForm.controls[fieldName].untouched
    );
  }
}
