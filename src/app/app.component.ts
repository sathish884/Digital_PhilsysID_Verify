import { CommonModule } from '@angular/common';
import { AfterViewChecked, AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { VerifyService } from './service/verify.service';
import { Subject, takeUntil } from 'rxjs';

import * as posenet from '@tensorflow-models/posenet';
import '@tensorflow/tfjs';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  // @ViewChild('video') videoRef!: ElementRef;
  // @ViewChild('canvas') canvasRef!: ElementRef;

  // capturedImage: string | null = null;
  // private stream: MediaStream | null = null;

  // idForm: FormGroup;
  // submitted = false;
  // loading = false;
  // public isBlinking = false;
  // direction: string = '';
  // model!: posenet.PoseNet;
  // calibrated = false;
  // baselineNoseX = 0;
  // baselineNoseY = 0;
  // page = 1;

  // private destroy$ = new Subject<void>;

  // steps = [
  //   { label: 'Look Left', direction: 'Left', completed: false },
  //   { label: 'Look Right', direction: 'Right', completed: false },
  //   { label: 'Look Up', direction: 'Up', completed: false },
  //   { label: 'Look Down', direction: 'Down', completed: false },
  // ];

  // constructor(private fb: FormBuilder, private verifyService: VerifyService) {
  //   this.idForm = this.fb.group({
  //     suffix: ['', Validators.required],
  //     firstName: ['', Validators.required],
  //     middleName: ['', Validators.required],
  //     lastName: ['', Validators.required],
  //     dob: ['', Validators.required],
  //     pcn: ['', Validators.required]
  //   });
  // }

  // async ngAfterViewInit() {
  //   this.model = await posenet.load();
  //   await this.detectPose();
  // }

  // goBack() {
  //   this.page--;
  // }

  // nextPage() {
  //   this.page++;
  // }

  // capture() {
  //   this.loading = true;
  //   this.page++;
  //   this.startCamera()
  // }

  // get currentInstruction() {
  //   const step = this.steps.find(s => !s.completed);
  //   return step ? step.label : 'All steps completed';
  // }

  // get allStepsCompleted() {
  //   return this.steps.every(s => s.completed);
  // }

  // async startCamera(): Promise<void> {
  //   try {
  //     this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
  //     const video = this.videoRef.nativeElement as HTMLVideoElement;
  //     video.srcObject = this.stream;
  //     await video.play();
  //   } catch (err) {
  //     console.error('Error accessing webcam:', err);
  //   }
  // }

  // async detectPose() {
  //   // Add these checks at the start
  //   if (!this.videoRef?.nativeElement || !this.canvasRef?.nativeElement) {
  //     console.warn('Video or canvas element not available');
  //     return;
  //   }

  //   const video = this.videoRef.nativeElement as HTMLVideoElement;
  //   const canvas = this.canvasRef.nativeElement as HTMLCanvasElement;
  //   const ctx = canvas?.getContext('2d');
  //   if (!ctx) {
  //     console.warn('Could not get canvas context');
  //     return;
  //   }
  //   let autoCaptured = false; // Prevent multiple captures

  //   const detect = async () => {
  //     const pose = await this.model?.estimateSinglePose(video, { flipHorizontal: false });
  //     ctx.clearRect(0, 0, canvas.width, canvas.height);
  //     ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  //     const nose = pose.keypoints.find(kp => kp.part === 'nose');
  //     if (nose && nose.score > 0.8) {
  //       const { x, y } = nose.position;

  //       if (!this.calibrated) {
  //         this.baselineNoseX = x;
  //         this.baselineNoseY = y;
  //         this.calibrated = true;
  //       } else {
  //         const dx = x - this.baselineNoseX;
  //         const dy = y - this.baselineNoseY;

  //         if (dx > 30) this.direction = 'Left';
  //         else if (dx < -30) this.direction = 'Right';
  //         else if (dy > 30) this.direction = 'Down';
  //         else if (dy < -30) this.direction = 'Up';
  //         else this.direction = 'Center';

  //         const currentStep = this.steps.find(s => !s.completed);
  //         if (currentStep && this.direction === currentStep.direction) {
  //           currentStep.completed = true;
  //         }

  //         // ✅ Auto-capture once all steps are done
  //         if (this.allStepsCompleted && !autoCaptured) {
  //           autoCaptured = true;
  //           setTimeout(() => this.captureImage(), 1500); // slight delay to stabilize
  //         }
  //       }
  //     }
  //     requestAnimationFrame(detect);
  //   };
  //   detect();
  // }

  // captureImage() {
  //   this.isBlinking = true;

  //   // Simulate delay to finish blinking, then show captured state
  //   setTimeout(() => {
  //     const canvas = this.canvasRef.nativeElement as HTMLCanvasElement;
  //     this.stopCamera(); // 👈 stops the video stream
  //     this.capturedImage = canvas.toDataURL('image/png')// your actual captured image
  //     this.isBlinking = false;
  //   }, 1800); // match blink duration
  // }


  // async retakeImage() {
  //   this.steps.forEach(step => step.completed = false);
  //   this.calibrated = false;
  //   this.capturedImage = null;
  //   this.direction = '';
  //   this.isBlinking = false;

  //   await this.startCamera(); // 🔁 Restart the camera stream
  //   this.detectPose();        // 🧠 Resume pose detection
  // }

  // reset() {
  //   this.steps.forEach(step => step.completed = false);
  //   this.calibrated = false;
  //   this.capturedImage = null;
  //   this.direction = '';
  //   this.detectPose()
  // }

  // stopCamera(): void {
  //   if (this.stream) {
  //     this.stream.getTracks().forEach(track => track.stop());
  //     this.stream = null;
  //   }
  //   const video = this.videoRef.nativeElement as HTMLVideoElement;
  //   video.srcObject = null;
  // }

  // onVerificationSuccess() {
  //   if (this.idForm.valid) {
  //     let body = {
  //       "suffix": this.idForm.value.suffix,
  //       "firstName": this.idForm.value.firstName,
  //       "middleName": this.idForm.value.middleName,
  //       "lastName": this.idForm.value.lastName,
  //       "dob": this.idForm.value.dob,
  //       "pcn": this.idForm.value.pcn,
  //       "imageString": this.capturedImage
  //     }
  //     this.verifyService.saveBulkIndent(body).pipe(takeUntil(this.destroy$)).subscribe(
  //       (resp: any) => {
  //         console.log(resp);
  //       }
  //     )
  //   }
  // }

}
