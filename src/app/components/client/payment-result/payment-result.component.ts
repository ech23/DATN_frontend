import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { VNPayService } from 'src/app/_service/vnpay.service';

@Component({
  selector: 'app-payment-result',
  templateUrl: './payment-result.component.html',
  styleUrls: ['./payment-result.component.css'],
  providers: [MessageService]
})
export class PaymentResultComponent implements OnInit {
  paymentStatus: 'success' | 'failed' | 'pending' = 'pending';
  transactionInfo: any = {};
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private vnpayService: VNPayService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    // Get all query parameters
    const queryParams = { ...this.route.snapshot.queryParams };
    
    if (Object.keys(queryParams).length > 0) {
      this.verifyPayment(queryParams);
    } else {
      this.paymentStatus = 'failed';
      this.loading = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No payment information received'
      });
    }
  }

  verifyPayment(params: any): void {
    this.vnpayService.verifyPayment(params).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.paymentStatus = 'success';
          this.transactionInfo = response.data;
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Payment completed successfully!'
          });
        } else {
          this.paymentStatus = 'failed';
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: response.message || 'Payment verification failed'
          });
        }
      },
      error: (error) => {
        this.loading = false;
        this.paymentStatus = 'failed';
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to verify payment'
        });
        console.error('Payment verification error:', error);
      }
    });
  }

  goToOrderHistory(): void {
    this.router.navigate(['/my-order']);
  }

  goToHomePage(): void {
    this.router.navigate(['/']);
  }
} 