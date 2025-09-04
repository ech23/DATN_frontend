import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AuthService } from 'src/app/_service/auth.service';

@Component({
  selector: 'app-verify-otp',
  templateUrl: './verify-otp.component.html'
})
export class VerifyOtpComponent implements OnInit {
  email: string | null = null;
  otpCode: string = '';
  isSubmitting: boolean = false;
  isResending: boolean = false;
  maxRetries: number = 3; // Số lần thử tối đa
  remainingRetries: number = 3;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private messageService: MessageService
  ) {
    this.email = this.route.snapshot.queryParamMap.get('email');
    if (!this.email) {
      this.router.navigate(['/login']);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Email không hợp lệ'
      });
    }
  }

  ngOnInit() {
    // Kiểm tra email khi component khởi tạo
    if (!this.email) {
      this.router.navigate(['/login']);
    }
  }

  onVerify(): void {
    if (!this.email || !this.otpCode) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Vui lòng nhập mã OTP'
      });
      return;
    }

    if (this.otpCode.length !== 6) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Mã OTP phải có 6 ký tự'
      });
      return;
    }

    if (this.remainingRetries <= 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Bạn đã hết số lần thử. Vui lòng yêu cầu gửi lại mã OTP'
      });
      return;
    }

    this.isSubmitting = true;
    this.authService.verifyOtp(this.email, this.otpCode).subscribe({
      next: _ => {
        this.isSubmitting = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Xác thực thành công. Bạn có thể đăng nhập.'
        });
        this.router.navigate(['/login']);
      },
      error: err => {
        this.isSubmitting = false;
        this.remainingRetries--;
        const msg = err?.error?.message || 
          `Mã OTP không hợp lệ. Còn ${this.remainingRetries} lần thử`;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: msg
        });
      }
    });
  }

  onResend(): void {
    if (!this.email) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Thiếu email để gửi lại OTP'
      });
      return;
    }

    this.isResending = true;
    this.authService.sendOtp(this.email).subscribe({
      next: _ => {
        this.isResending = false;
        this.remainingRetries = this.maxRetries; // Reset số lần thử
        this.messageService.add({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Đã gửi lại OTP tới email của bạn'
        });
      },
      error: err => {
        this.isResending = false;
        const msg = err?.error?.message || 'Không thể gửi lại OTP';
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: msg
        });
      }
    });
  }
}


