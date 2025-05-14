import {Component, OnInit} from '@angular/core';
import {TokenService} from '../../_services/token.service';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ProfileService} from '../../_services/profile.service';

import { Router } from '@angular/router';
import {ProfileUpdateRequest} from '../../_models/profile';
import {HttpClient, HttpEventType} from '@angular/common/http';
import {MatSnackBar} from '@angular/material/snack-bar';
import {debounceTime, distinctUntilChanged, filter} from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import {BioCorrectionDialogComponent} from '../bio-correction-dialog/bio-correction-dialog.component';


@Component({
  selector: 'app-profile',
  standalone: false,
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  userId: number;

// Add these to your component class
  previewUrl: string | ArrayBuffer | null = null;
  uploadProgress: number | null = null;

  // Forms
  profileForm!: FormGroup;


  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,

    private tokenService: TokenService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private http: HttpClient,

  ) {
    this.userId = this.tokenService.getUser().id;
  }

  ngOnInit(): void {
    this.initForms();
    this.loadExistingData();
    this.setupAutoSave();
  }

  initForms(): void {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: [''],
      diploma: [''],
      bio: [''],
      profilePicture: ['']
    });

  }

  loadExistingData(): void {
    this.profileService.getProfile(this.userId).subscribe(profile => {
      if (profile) {
        this.profileForm.patchValue(profile);
      }
    });
  }



  // -----------------Upload Image + Save Profile

  // This method should be added to your component
  getProfilePictureUrl(): string {
    if (this.previewUrl) {
      return this.previewUrl as string;
    }

    const profilePicture = this.profileForm.get('profilePicture')?.value;
    if (!profilePicture) {
      return 'assets/default-avatar.png';
    }

    // If the path already starts with http:// or https://, return it as is
    if (profilePicture.startsWith('http://') || profilePicture.startsWith('https://')) {
      return profilePicture;
    }

    // Otherwise, prepend the base URL
    return this.profileService.getFullImageUrl(profilePicture);
  }


  // Add these properties to your component class
  verificationMessage: string = '';
  isHumanVerified: boolean = false;
  isVerifying: boolean = false;
  //------ Add this new method for LLM verification PICTURE-----
  async verifyWithLLM(file: File): Promise<void> {
    this.verificationMessage = 'Verifying image...';

    // Convert file to base64
    const base64Image = await this.fileToBase64(file);

    // Call Hugging Face API (using a free model)
    const response: any = await this.http.post(
      'https://api-inference.huggingface.co/models/facebook/detr-resnet-50',
      { inputs: base64Image },
      {
        headers: {
          'Authorization': 'Bearer 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', // Get free key from Hugging Face
          'Content-Type': 'application/json'
        }
      }
    ).toPromise();

    // Check if human is detected
    const hasPerson = response.some((item: any) =>
      item.label.toLowerCase().includes('person') && item.score > 0.7
    );

    if (hasPerson) {
      this.verificationMessage = 'Human face verified!';
      this.isHumanVerified = true;
    } else {
      this.verificationMessage = 'No human face detected. Please upload a clear photo of yourself.';
      this.isHumanVerified = false;
    }
  }

  // Helper method to convert file to base64
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data:image/...;base64, prefix
        resolve(result.split(',')[1]);
      };
      reader.onerror = error => reject(error);
    });
  }

  // ----- END LLM verification PICTURE ---------


// Update your onFileSelected method
// Update your onFileSelected method
  async onFileSelected(event: any): Promise<void> {
    const file: File = event.target.files[0];
    if (file) {
      // Reset states
      this.uploadProgress = 0;
      this.verificationMessage = '';
      this.isHumanVerified = false;
      this.isVerifying = true;

      // Validate file type and size first
      if (!file.type.match(/image\/(jpeg|png|gif)/)) {
        this.snackBar.open('Only JPEG, PNG, or GIF images are allowed', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.isVerifying = false;
        return;
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        this.snackBar.open('Image size should be less than 5MB', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.isVerifying = false;
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        this.previewUrl = reader.result;

        // Perform verification
        try {
          await this.verifyWithLLM(file);

          // Only proceed with upload if human is verified
          if (this.isHumanVerified) {
            this.uploadProfilePicture(file);
          } else {
            this.snackBar.open(this.verificationMessage, 'Close', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
            // Reset preview if not human
            this.previewUrl = null;
            event.target.value = ''; // Clear the file input
          }
        } catch (error) {
          console.error('Verification failed:', error);
          this.verificationMessage = 'Verification service unavailable. Please try again later.';
          this.isHumanVerified = false;
          this.snackBar.open(this.verificationMessage, 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        } finally {
          this.isVerifying = false;
        }
      };
    }
  }

// Extract the upload logic to a separate method
  private uploadProfilePicture(file: File): void {
    this.profileService.uploadProfilePicture(this.userId, file).subscribe({
      next: (event: any) => {
        if (event.type === HttpEventType.UploadProgress) {
          // Update progress
          this.uploadProgress = Math.round(100 * event.loaded / event.total);
        } else if (event.type === HttpEventType.Response) {
          // Handle successful upload
          this.uploadProgress = null;

          // Get the profile data from the response
          const profileData = event.body;

          if (profileData && profileData.profilePicture) {
            // Update form with the new image path
            this.profileForm.patchValue({ profilePicture: profileData.profilePicture });

            // Reset preview (will now use the form value)
            this.previewUrl = null;

            // Show success message
            this.snackBar.open('Profile picture updated successfully!', 'Close', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
          }
        }
      },
      error: (err) => {
        console.error('Upload error:', err);
        this.uploadProgress = null;
        this.previewUrl = null;
        this.snackBar.open('Error uploading image. Please try again.', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  saveProfile(): void {
    if (this.profileForm.valid) {
      const profileData: ProfileUpdateRequest = {
        ...this.profileForm.value,
        socialLinks: []
      };

      this.profileService.updateProfile(this.userId, profileData).subscribe({
        next: () => {
          this.snackBar.open('Profile saved successfully!', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        },
        error: (err) => {
          console.error('Failed to save profile:', err);
          this.snackBar.open('Error saving profile. Please try again.', 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
    } else {
      this.profileForm.markAllAsTouched();
      this.snackBar.open('Please fill in all required fields correctly.', 'Close', {
        duration: 5000,
        panelClass: ['warning-snackbar']
      });
    }
  }

  private setupAutoSave(): void {
    this.profileForm.valueChanges.pipe(
      debounceTime(120000),
      distinctUntilChanged(),
      filter(() => this.profileForm.valid)
    ).subscribe(() => {
      this.saveProfile();
    });
  }

//-----------------------------------------







  completeProfile(): void {
    if (this.profileForm.valid) {
      const profileData: ProfileUpdateRequest = {
        ...this.profileForm.value,
        socialLinks: [],
        completed: true
      };

      this.profileService.updateProfile(this.userId, profileData).subscribe({
        next: () => this.router.navigate(['/portfolio']),
        error: (err) => console.error('Failed to complete profile:', err)
      });
    }
  }


  //------ Add this new method for LLM verification TEXT-------------

  verifyingBio = false;

  verifyBio(): void {
    const bioControl = this.profileForm.get('bio');
    const originalBio = bioControl?.value?.trim();

    if (!originalBio || originalBio.length < 5) {
      this.snackBar.open('Please enter a longer bio before verifying.', 'Close', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
      return;
    }

    this.verifyingBio = true;

    this.profileService.checkBioCorrection(originalBio).subscribe({
      next: (corrected: string) => {
        this.verifyingBio = false;

        const cleaned = corrected.trim();
        if (cleaned.toUpperCase() === 'INVALID BIO') {
          this.snackBar.open('Your bio seems invalid. Please rewrite it.', 'Close', {
            duration: 4000,
            panelClass: ['warning-snackbar']
          });
          return;
        }

        const dialogRef = this.dialog.open(BioCorrectionDialogComponent, {
          width: '600px',
          data: { original: originalBio, corrected: cleaned }
        });

        dialogRef.afterClosed().subscribe(apply => {
          if (apply) {
            bioControl?.setValue(cleaned);
            this.snackBar.open('Bio updated successfully!', 'Close', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
          }
        });
      },
      error: (err) => {
        this.verifyingBio = false;
        console.error('Bio verification error:', err);
        this.snackBar.open('Could not verify bio. Try again later.', 'Close', {
          duration: 4000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  //------ END LLM verification TEXT-------------


}
