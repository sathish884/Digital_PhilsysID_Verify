import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as posenet from '@tensorflow-models/posenet';
import '@tensorflow/tfjs';
import { VerifyService } from '../service/verify.service'
import { Subject, takeUntil } from 'rxjs';
import { DatePipe } from '@angular/common';
import Swal from 'sweetalert2';
import { log } from '@tensorflow/tfjs-core/dist/log';

@Component({
  selector: 'app-authenticate',
  standalone: false,
  templateUrl: './authenticate.component.html',
  styleUrl: './authenticate.component.scss'
})
export class AuthenticateComponent implements OnInit, AfterViewInit {

  @ViewChild('video') videoRef!: ElementRef;
  @ViewChild('canvas') canvasRef!: ElementRef;

  capturedImage: string | null = null;
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

  private destroy$ = new Subject<void>;

  steps = [
    { label: 'Look Left', direction: 'Left', completed: false },
    { label: 'Look Right', direction: 'Right', completed: false },
    { label: 'Look Up', direction: 'Up', completed: false },
    { label: 'Look Down', direction: 'Down', completed: false },
  ];

  constructor(private fb: FormBuilder, private verifyService: VerifyService, private datePipe: DatePipe) {
    this.idForm = this.fb.group({
      suffix: ['', Validators.required],
      firstName: ['', Validators.required],
      middleName: ['', Validators.required],
      lastName: ['', Validators.required],
      dob: ['', Validators.required],
      pcn: ['', Validators.required]
    });
  }

  ngOnInit(): void {
  }

  async ngAfterViewInit() {
    this.model = await posenet.load();
    //  await this.detectPose();
  }

  goBack() {
    this.page--;
  }

  nextPage() {
    this.page++;
  }

  capture() {
    this.loading = true;
    this.page++;
    this.startCamera()
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
          else if (dy > 30) this.direction = 'Down';
          else if (dy < -30) this.direction = 'Up';
          else this.direction = 'Center';

          const currentStep = this.steps.find(s => !s.completed);
          if (currentStep && this.direction === currentStep.direction) {
            currentStep.completed = true;
          }

          // ✅ Auto-capture once all steps are done
          if (this.allStepsCompleted && !autoCaptured) {
            autoCaptured = true;
            setTimeout(() => this.captureImage(), 1500); // slight delay to stabilize
          }
        }
      }
      requestAnimationFrame(detect);
    };
    detect();
  }

  captureImage() {
    this.isBlinking = true;

    // Simulate delay to finish blinking, then show captured state
    setTimeout(() => {
      const canvas = this.canvasRef.nativeElement as HTMLCanvasElement;
      this.stopCamera(); // 👈 stops the video stream
      this.capturedImage = canvas.toDataURL('image/png')// your actual captured image
      this.isBlinking = false;
    }, 1800); // match blink duration
  }


  async retakeImage() {
    this.steps.forEach(step => step.completed = false);
    this.calibrated = false;
    this.capturedImage = null;
    this.direction = '';
    this.isBlinking = false;

    await this.startCamera(); // 🔁 Restart the camera stream
    this.detectPose();        // 🧠 Resume pose detection
  }

  retry() {
    this.steps.forEach(step => step.completed = false);
    this.calibrated = false;
    this.capturedImage = null;
    this.direction = '';
    this.detectPose()
  }

  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    const video = this.videoRef.nativeElement as HTMLVideoElement;
    video.srcObject = null;
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
      this.verifyService.idverify(body).pipe(takeUntil(this.destroy$)).subscribe(
        (resp: any) => {
          //  console.log(resp);
          if (resp.message === "Not Verified") {
            Swal.fire({
              icon: 'warning',
              text: 'Not Verified'
            }).then(() => {
              this.idForm.reset();
              this.steps.forEach(step => step.completed = false);
              this.calibrated = false;
              this.capturedImage = null;
              this.direction = '';
            })
          } else {
            Swal.fire({
              icon: 'success',
              text: 'Verified'
            }).then(() => {
              this.page = 1
            })
          }
        }
      )
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
