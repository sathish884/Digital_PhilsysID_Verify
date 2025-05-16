import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as posenet from '@tensorflow-models/posenet';
import '@tensorflow/tfjs';
import { VerifyService } from '../service/verify.service'
import { Subject, takeUntil } from 'rxjs';
import { DatePipe } from '@angular/common';
import Swal from 'sweetalert2';

declare var bootstrap: any;


@Component({
  selector: 'app-authenticate',
  standalone: false,
  templateUrl: './authenticate.component.html',
  styleUrl: './authenticate.component.scss'
})
export class AuthenticateComponent implements OnInit, AfterViewInit {

  @ViewChild('video') videoRef!: ElementRef;
  @ViewChild('canvas') canvasRef!: ElementRef;

  capturedImage: string = "";
  private stream: MediaStream | null = null;

  idForm: FormGroup;
  submitted = false;
  loading = false;
  public isBlinking = false;
  direction: string = '';
  model!: posenet.PoseNet;
  calibrated = false;
  baselineNoseX = 0;
  baselineNoseY = 0;
  page = 1;
  userData: any = {}
  today: string;
  userPhoto: string = "";

  private destroy$ = new Subject<void>;

  steps = [
    { label: 'Look Left', direction: 'Left', completed: false },
    { label: 'Look Right', direction: 'Right', completed: false },
    { label: 'Look Up', direction: 'Up', completed: false },
    { label: 'Look Down', direction: 'Down', completed: false },
  ];

  constructor(private fb: FormBuilder, private verifyService: VerifyService, private datePipe: DatePipe) {
    const now = new Date();
    this.today = now.toISOString().split('T')[0]; // format: YYYY-MM-DD
    this.idForm = this.fb.group({
      suffix: ['', Validators.required],
      firstName: ['', Validators.required],
      middleName: ['', Validators.required],
      lastName: ['', Validators.required],
      dob: ['', Validators.required],
      pcn: ['', [Validators.required, Validators.pattern(/^\d{16}$/)]]
    });
  }

  // PCN number validation
  enforceMaxLength(event: Event): void {
    const input = event.target as HTMLInputElement;
    // Remove any non-digit characters
    input.value = input.value.replace(/\D/g, '');

    // Truncate to 16 digits max
    if (input.value.length > 16) {
      input.value = input.value.slice(0, 16);
    }

    // Update the form control manually since we altered the value
    this.idForm.get('pcn')?.setValue(input.value);
  }

  ngOnInit(): void {
  }

  async ngAfterViewInit() {
    this.model = await posenet.load();
  }

  goBack() {
    this.page--;
    this.loading = false;
  }

  nextPage() {
    this.page++;
  }

  capture() {
    this.loading = true;
    setTimeout(() => {
      this.page++;
      this.startCamera()
    }, 2000)
  }

  get currentInstruction() {
    const step = this.steps.find(s => !s.completed);
    return step ? step.label : 'All steps completed';
  }

  get allStepsCompleted() {
    return this.steps.every(s => s.completed);
  }

  async startCamera(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = this.videoRef.nativeElement as HTMLVideoElement;
      video.srcObject = this.stream;
      await video.play();
      await this.detectPose();
    } catch (err) {
      console.error('Error accessing webcam:', err);
    }
  }

  async detectPose() {
    // Add these checks at the start
    if (!this.videoRef?.nativeElement || !this.canvasRef?.nativeElement) {
      console.warn('Video or canvas element not available');
      return;
    }

    const video = this.videoRef.nativeElement as HTMLVideoElement;
    const canvas = this.canvasRef.nativeElement as HTMLCanvasElement;
    const ctx = canvas?.getContext('2d');
    if (!ctx) {
      console.warn('Could not get canvas context');
      return;
    }
    let autoCaptured = false; // Prevent multiple captures

    const detect = async () => {
      const pose = await this.model?.estimateSinglePose(video, { flipHorizontal: false });
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const nose = pose.keypoints.find(kp => kp.part === 'nose');
      if (nose && nose.score > 0.8) {
        const { x, y } = nose.position;

        if (!this.calibrated) {
          this.baselineNoseX = x;
          this.baselineNoseY = y;
          this.calibrated = true;
        } else {
          const dx = x - this.baselineNoseX;
          const dy = y - this.baselineNoseY;

          if (dx > 30) this.direction = 'Left';
          else if (dx < -30) this.direction = 'Right';
          else if (dy > 40) this.direction = 'Down';
          else if (dy < -40) this.direction = 'Up';
          else this.direction = 'Center';

          const currentStep = this.steps.find(s => !s.completed);
          if (currentStep && this.direction === currentStep.direction) {
            currentStep.completed = true;
          }

          // Auto-capture once all steps are done
          if (this.allStepsCompleted && !autoCaptured) {
            autoCaptured = true;
            setTimeout(() => this.captureImage(), 1500);
          }
        }
      }
      requestAnimationFrame(detect);
    };
    detect();
  }

  captureImage() {
    this.isBlinking = true;
    setTimeout(() => {
      requestAnimationFrame(() => {
        const canvas = this.canvasRef.nativeElement as HTMLCanvasElement;
        if (!canvas) throw new Error('Canvas not available');
        this.capturedImage = canvas.toDataURL('image/png');
        this.loading = false;
        this.stopCamera();
      });
    }, 1800);

  }

  async retakeImage() {
    this.steps.forEach(step => step.completed = false);
    this.calibrated = false;
    this.capturedImage = "";
    this.direction = '';
    this.isBlinking = false;
    await this.startCamera();
    this.detectPose();
  }

  retry() {
    this.steps.forEach(step => step.completed = false);
    this.calibrated = false;
    this.capturedImage = "";
    this.direction = '';
    this.detectPose()
  }

  stopCamera(): void {
    // Then stop the stream
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    const video = this.videoRef.nativeElement as HTMLVideoElement;
    if (video) {
      video.srcObject = null;
    }
  }

  closeModal() {
    const modalElement = document.getElementById('staticBackdrop') as HTMLElement;
    modalElement.classList.remove('show');
    modalElement.style.display = 'none';
    document.body.classList.remove('modal-open');
    document.querySelector('.modal-backdrop')?.remove();
    this.page = 1;
    this.idForm.reset();
    this.steps.forEach(step => step.completed = false);
    this.calibrated = false;
    this.isBlinking = false;
    this.capturedImage = "";
    this.direction = '';
    this.loading = false;
  }

  onVerificationSuccess() {
    if (this.idForm.valid) {
      let body = {
        "suffix": this.idForm.value.suffix,
        "firstName": this.idForm.value.firstName,
        "middleName": this.idForm.value.middleName,
        "lastName": this.idForm.value.lastName,
        "dob": this.datePipe.transform(this.idForm.value.dob, 'yyyy/MM/dd'),
        "pcn": this.idForm.value.pcn,
        "imageString": this.capturedImage
      }
      Swal.fire({
        title: 'Loading...', text: 'Please wait while we fatching the data',
        allowOutsideClick: false,
        showConfirmButton: false, // Hide the confirm button
        didOpen: () => {
          Swal.showLoading(); // Show the loading spinner
        }
      });
      this.verifyService.idverify(body).pipe(takeUntil(this.destroy$)).subscribe(
        (resp: any) => {
          Swal.close();
          const modelelement = document.getElementById('staticBackdrop') as HTMLElement;
          if (resp.message === "Verified") {
            this.userData = resp.data;
            this.userPhoto = `data:image/jpeg;base64,${resp.data.photo}`;
            const model = new bootstrap.Modal(modelelement);
            model.show();
          } else if (resp.message === "Not Verified") {
            Swal.fire({
              icon: 'warning',
              text: 'Not Verified'
            }).then(() => {
              this.idForm.reset();
              this.steps.forEach(step => step.completed = false);
              this.calibrated = false;
              this.capturedImage = "";
              this.direction = '';
              this.page = 1;
              this.loading = false;
            });
          }
        },
        (error) => {
          Swal.close(); // Also close it in case of error
          Swal.fire({
            icon: 'error',
            title: 'Verification Failed',
            text: 'Something went wrong during verification.'
          });
        }
      );

    }
  }

  // User Information Validations
  get firstNameValidation() {
    return this.idForm.get('firstName');
  }
  get middletNameValidation() {
    return this.idForm.get('middleName');
  }
  get lastNameValidation() {
    return this.idForm.get('lastName');
  }
  get suffixValidation() {
    return this.idForm.get('suffix');
  }
  get dobValidation() {
    return this.idForm.get('dob');
  }
  get pcnValidation() {
    return this.idForm.get('pcn');
  }

}
