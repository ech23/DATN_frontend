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
    
  }

  calculateTotal() {
    this.totalAmount = this.cartService.items.reduce((sum, item) => sum + item.subTotal, 0);
  }

  
  showDepartmentClick(){
    this.showDepartment = !this.showDepartment;
  }

  placeOrder(){
    if (this.orderForm.paymentMethod === 'vnpay') {
      this.processVNPayPayment();
      return;
    }

    this.processRegularOrder();
  }

  processRegularOrder() {
    this.cartService.items.forEach(res =>{
      let orderDetail : OrderDetail = new OrderDetail;
      orderDetail.name = res.name;
      orderDetail.price = res.price;
      orderDetail.quantity = res.quantity;
      orderDetail.subTotal = res.subTotal;
      this.listOrderDetail.push(orderDetail);
      this.showSuccess("Check out Successfully!");
    });

    const {firstname,lastname,country,address,town,state,postCode,phone,email,note,paymentMethod} = this.orderForm;
    
    this.orderService.placeOrder(firstname,lastname,country,address,town,state,postCode,phone,email,note,this.listOrderDetail,this.username,paymentMethod).subscribe({
      next: res => {
        this.cartService.clearCart();
      }, error: err => {
        console.log(err);
      }
    });
  }

  processVNPayPayment() {
    this.isProcessingPayment = true;

    // First create the order to get the order ID
    this.cartService.items.forEach(res =>{
      let orderDetail : OrderDetail = new OrderDetail;
      orderDetail.name = res.name;
      orderDetail.price = res.price;
      orderDetail.quantity = res.quantity;
      orderDetail.subTotal = res.subTotal;
      this.listOrderDetail.push(orderDetail);
    });

    const {firstname,lastname,country,address,town,state,postCode,phone,email,note,paymentMethod} = this.orderForm;
    
    this.orderService.placeOrder(firstname,lastname,country,address,town,state,postCode,phone,email,note,this.listOrderDetail,this.username,paymentMethod).subscribe({
      next: res => {
        const orderId = res.id ;
        
        
        // Generate VNPay payment URL
        this.vnpayService.createPaymentUrl(orderId).subscribe({
          next: paymentData => {
            this.isProcessingPayment = false;
            
            if (paymentData && paymentData.paymentUrl) {
              // Redirect to VNPay payment gateway
              window.location.href = paymentData.paymentUrl;
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
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to create order. Please try again.'
        });
      }
    });
  }

  showSuccess(text: string) {
    this.messageService.add({severity:'success', summary: 'Success', detail: text});
  }
}
