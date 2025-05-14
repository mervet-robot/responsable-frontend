import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BioCorrectionDialogComponent } from './bio-correction-dialog.component';

describe('BioCorrectionDialogComponent', () => {
  let component: BioCorrectionDialogComponent;
  let fixture: ComponentFixture<BioCorrectionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BioCorrectionDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BioCorrectionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
