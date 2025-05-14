import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';

@Component({
  selector: 'app-bio-correction-dialog',
  standalone: false,
  templateUrl: './bio-correction-dialog.component.html',
  styleUrl: './bio-correction-dialog.component.scss'
})
export class BioCorrectionDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<BioCorrectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { original: string, corrected: string }
  ) {}

  apply(): void {
    this.dialogRef.close(true);
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  highlightDiffs(original: string, corrected: string): string {
    const originalWords = original.split(' ');
    const correctedWords = corrected.split(' ');

    return correctedWords.map((word, i) => {
      if (word !== originalWords[i]) {
        return `<span class="diff-highlight">${word}</span>`;
      }
      return word;
    }).join(' ');
  }


}
