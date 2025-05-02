import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { VNPayService } from 'src/app/_service/vnpay.service';
import { OrderService } from 'src/app/_service/order.service';

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
    private orderService: OrderService,
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
        if (response.status === 'success' && response.orderStatus === 'PAID') {
          
          this.paymentStatus = 'success';
          this.transactionInfo = response.data;
          
          // Update order payment status to COMPLETED
          if (this.transactionInfo && this.transactionInfo.orderId) {
            this.updateOrderPaymentStatus(
              this.transactionInfo.orderId, 
              'PAID', 
              this.transactionInfo
            );
          }
          
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Payment completed successfully!'
          });
          setTimeout(() => {
            this.router.navigate(['/']);
          }, 3000);
        } else {
          this.paymentStatus = 'failed';
          
          // Update order payment status to FAILED if we have an order ID
          if (response.data && response.data.orderId) {
            this.updateOrderPaymentStatus(
              response.data.orderId, 
              'CANCELLED', 
              response.data
            );
          }
          
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: response.message || 'Payment verification failed'
          });
          setTimeout(() => {
            this.router.navigate(['/cart']);
          }, 3000);
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
  
  updateOrderPaymentStatus(orderId: string, status: string, transactionInfo: any): void {
    this.orderService.updateOrderPaymentStatus(orderId, status, transactionInfo).subscribe({
      next: () => {
        console.log(`Order ${orderId} payment status updated to ${status}`);
      },
      error: (err) => {
        console.error('Error updating order payment status:', err);
        this.messageService.add({
          severity: 'warn',
          summary: 'Warning',
          detail: 'Payment was processed, but we couldn\'t update your order status. This will be resolved soon.',
          sticky: true
        });
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