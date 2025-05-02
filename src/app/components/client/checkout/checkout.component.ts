import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { faBars, faHeart, faPhone, faShoppingBag } from '@fortawesome/free-solid-svg-icons';
import { MessageService } from 'primeng/api';
import { Order } from 'src/app/_class/order';
import { OrderDetail } from 'src/app/_class/order-detail';

import { CartService } from 'src/app/_service/cart.service';
import { OrderService } from 'src/app/_service/order.service';
import { StorageService } from 'src/app/_service/storage.service';
import { VNPayService } from 'src/app/_service/vnpay.service';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';


@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css'],
  providers: [MessageService]
})
export class CheckoutComponent implements OnInit {
  
  heart = faHeart;
  bag = faShoppingBag;
  phone = faPhone;
  bars = faBars;
  showDepartment = false;
  order = new Order();
  listOrderDetail: any[] = [];
  username!: string;
  totalAmount = 0;
  isProcessingPayment = false;
  hasStockIssues = false;

  orderForm: any = {
    firstname: null,
    lastname: null,
    country: null,
    address: null,
    town: null,
    state: null,
    postCode: null,
    email: null,
    phone: null,
    note: null,
    paymentMethod: null
  }

  constructor(
    public cartService: CartService, 
    private orderService: OrderService, 
    private storageService: StorageService, 
    private messageService: MessageService,
    private vnpayService: VNPayService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.username = this.storageService.getUser().username;
    this.cartService.getItems();
    this.calculateTotal();
    this.validateCartStock();
  }

  calculateTotal() {
    this.totalAmount = this.cartService.items.reduce((sum, item) => sum + item.subTotal, 0);
  }

  showDepartmentClick(){
    this.showDepartment = !this.showDepartment;
  }

  validateCartStock(): void {
    this.cartService.validateCartStock().subscribe(result => {
      this.hasStockIssues = !result.valid;
      
      if (!result.valid) {
        result.invalidItems.forEach(item => {
          this.messageService.add({
            severity: 'error',
            summary: 'Stock Error',
            detail: `${item.name}: Only ${item.availableQuantity} items in stock (you requested ${item.requestedQuantity})`,
            sticky: true
          });
        });
      }
    });
  }

  placeOrder(){
    // Prevent order if there are stock issues
    if (this.hasStockIssues) {
      this.messageService.add({
        severity: 'error',
        summary: 'Cannot Place Order',
        detail: 'Please fix the stock issues in your cart before placing your order.',
        sticky: true
      });
      return;
    }
    
    // Validate cart stock again before proceeding
    this.cartService.validateCartStock().pipe(
      finalize(() => {
        if (this.orderForm.paymentMethod === 'vnpay') {
          this.processVNPayPayment();
          
        } else {
          this.processRegularOrder();
        }
      })
    ).subscribe(result => {
      if (!result.valid) {
        this.hasStockIssues = true;
        
        result.invalidItems.forEach(item => {
          this.messageService.add({
            severity: 'error',
            summary: 'Stock Error',
            detail: `${item.name}: Only ${item.availableQuantity} items in stock (you requested ${item.requestedQuantity})`,
            sticky: true
          });
        });
        
        return;
      }
    });
  }
  
  processVNPayPayment() {
    if (this.hasStockIssues) return;
    
    this.isProcessingPayment = true;
    this.listOrderDetail = [];
    
    // First create the order to get the order ID
    this.cartService.items.forEach(res => {
      let orderDetail: OrderDetail = new OrderDetail;
      orderDetail.name = res.name;
      orderDetail.price = res.price;
      orderDetail.quantity = res.quantity;
      orderDetail.subTotal = res.subTotal;
      orderDetail.productId = res.id;
      this.listOrderDetail.push(orderDetail);
    });

    const {firstname, lastname, country, address, town, state, postCode, phone, email, note, paymentMethod} = this.orderForm;
    
    this.orderService.placeOrder(firstname, lastname, country, address, town, state, postCode, phone, email, note, this.listOrderDetail, this.username, paymentMethod).subscribe({
      next: res => {
        const orderId = res.id;
        
        // Generate VNPay payment URL
        this.vnpayService.createPaymentUrl(orderId).subscribe({
          next: paymentData => {
             
            this.isProcessingPayment = false;
            
            if (paymentData && paymentData.paymentUrl) {
              // Redirect to VNPay payment gateway
              window.location.href = paymentData.paymentUrl;
              this.cartService.clearCart();
            } else {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to create payment URL'
              });
            }
          },
          error: err => {
            this.isProcessingPayment = false;
            console.error('VNPay payment error:', err);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to process payment. Please try again.'
            });
          }
        });
      },
      error: err => {
        this.isProcessingPayment = false;
        console.error('Order creation error:', err);
        
        if (err.error && err.error.message && err.error.message.includes('stock')) {
          this.messageService.add({
            severity: 'error',
            summary: 'Stock Error',
            detail: err.error.message || 'There was a stock issue with your order. Please try again.',
            sticky: true
          });
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to create order. Please try again.'
          });
        }
      }
    });
  }

  processRegularOrder() {
    if (this.hasStockIssues) return;
    
    this.listOrderDetail = [];
    
    this.cartService.items.forEach(res => {
      let orderDetail: OrderDetail = new OrderDetail;
      orderDetail.name = res.name;
      orderDetail.price = res.price;
      orderDetail.quantity = res.quantity;
      orderDetail.subTotal = res.subTotal;
      orderDetail.productId = res.id;
      this.listOrderDetail.push(orderDetail);
    });

    const {firstname, lastname, country, address, town, state, postCode, phone, email, note, paymentMethod} = this.orderForm;
    
    this.orderService.placeOrder(firstname, lastname, country, address, town, state, postCode, phone, email, note, this.listOrderDetail, this.username, paymentMethod).subscribe({
      next: _res => {
        this.cartService.clearCart();
        this.showSuccess("Check out Successfully!");
      }, error: err => {
        console.log(err);
        
        if (err.error && err.error.message && err.error.message.includes('stock')) {
          this.messageService.add({
            severity: 'error',
            summary: 'Stock Error',
            detail: err.error.message || 'There was a stock issue with your order. Please try again.',
            sticky: true
          });
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to place order. Please try again.'
          });
        }
      }
    });
  }
  showSuccess(text: string) {
    this.messageService.add({severity:'success', summary: 'Success', detail: text});
  }
}
