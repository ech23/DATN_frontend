import { Component, OnInit } from '@angular/core';
import { OrderService } from 'src/app/_service/order.service';
import { StorageService } from 'src/app/_service/storage.service';
import { MessageService } from 'primeng/api';
import { CartService } from 'src/app/_service/cart.service';
import { Observable, throwError, TimeoutError, EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';
import * as jspdf from 'jspdf';
import 'jspdf-autotable';

interface OrderDetail {
  id?: number;
  orderId?: number;
  product?: {
    id?: number;
    name?: string;
    image?: string;
    price?: number;
  };
  price: number;
  quantity: number;
}

interface Order {
  id: number;
  firstname: string;
  lastname: string;
  country: string;
  address: string;
  town: string;
  state: string | null;
  postCode: string | number | null;
  email: string;
  phone: string;
  note: string | null;
  totalPrice: number;
  paymentStatus: string;
  orderStatus: string;
  paymentMethod: string;
  orderDate: Date | string | null;
  username: string;
  orderDetails?: OrderDetail[];
}
@Component({
  selector: 'app-my-order',
  templateUrl: './my-order.component.html',
  styleUrls: ['./my-order.component.css'],
  providers: [MessageService]
})
export class MyOrderComponent implements OnInit {

  listOrder: Order[] = [];
  username: string = '';
  selectedOrder: Order | null = null;
  displayOrderDetails: boolean = false;
  orderDetails: OrderDetail[] = [];
  loading: boolean = false;
  loadingOrderDetails: boolean = false;
  orderStatuses: any[] = [];

  constructor(
    private orderService: OrderService,
    private storageService: StorageService,
    private messageService: MessageService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.username = this.storageService.getUser().username;
    this.getListOrder();
    
    this.orderStatuses = this.orderService.getOrderStatuses();
  }

  getListOrder() {
    this.loading = true;
    this.orderService.getListOrderByUser(this.username).subscribe({
      next: res => {
        this.listOrder = this.processOrderDates(res);
        this.loading = false;
      },
      error: err => {
        console.log(err);
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.'
        });
      }
    });
  }
  
  processOrderDates(orders: any[]): any[] {
    return orders.map(order => {
      try {
        if (order.orderDate && typeof order.orderDate === 'string') {
          // Handle comma-separated date format
          if (order.orderDate.includes(',')) {
            const dateParts = order.orderDate.split(',').map((part: string) => parseInt(part.trim(), 10));
            // Ensure all parts are valid numbers before creating the Date object
            if (dateParts.length >= 6 && !dateParts.some(isNaN)) {
              const year = dateParts[0];
              const month = dateParts[1] - 1; 
              const day = dateParts[2];
              const hours = dateParts[3] || 0;
              const minutes = dateParts[4] || 0;
              const seconds = dateParts[5] || 0;
              
              order.orderDate = new Date(year, month, day, hours, minutes, seconds);
            }
          } else {
            // Try to parse as ISO string or any other format
            const parsedDate = new Date(order.orderDate);
            if (!isNaN(parsedDate.getTime())) {
              order.orderDate = parsedDate;
            }
          }
        }
      } catch (error) {
        console.error('Error processing date:', error, order.orderDate);
        // Set a fallback date to avoid breaking the UI
        order.orderDate = new Date();
      }
      return order;
    });
  }
  // Thêm phương thức để tính tổng tiền của từng sản phẩm
  calculateSubTotal(detail: OrderDetail): number {
    return detail.price * detail.quantity;
  }
  openOrderDetails(order: Order) {
  this.loadingOrderDetails = true;
  this.displayOrderDetails = true;
  
  this.orderService.getOrderDetailsById(order.id.toString()).pipe(
    timeout(10000),
    catchError(error => {
      console.error('API Error:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể tải chi tiết đơn hàng. Vui lòng thử lại sau.'
      });
      this.loadingOrderDetails = false;
      this.displayOrderDetails = false;
      return EMPTY;
    })
  ).subscribe({
    next: (response: any) => {
      console.log('Chi tiết đơn hàng:', response);
      
      // Xử lý orderDate là mảng
      let orderDate;
      if (Array.isArray(response.orderDate)) {
        const [year, month, day, hours, minutes, seconds] = response.orderDate;
        orderDate = new Date(year, month - 1, day, hours, minutes, seconds);
      } else {
        orderDate = this.processOrderDate(response.orderDate);
      }

      // Map dữ liệu sang định dạng chuẩn
      this.selectedOrder = {
        id: response.id,
        firstname: response.firstname,
        lastname: response.lastname,
        country: response.country,
        address: response.address,
        town: response.town,
        state: response.state || '',
        postCode: response.postCode?.toString(),
        email: response.email,
        phone: response.phone,
        note: response.note,
        totalPrice: Number(response.totalPrice),
        paymentStatus: response.paymentStatus,
        orderStatus: response.orderStatus,
        paymentMethod: response.paymentMethod,
        orderDate: orderDate,
        username: response.username
      };

      // Xử lý orderDetails nếu có
      if (response.orderDetails && Array.isArray(response.orderDetails)) {
        this.orderDetails = response.orderDetails.map((detail: OrderDetail) => ({
          id: detail.id,
          orderId: detail.orderId,
          product: {
            id: detail.product?.id,
            name: detail.product?.name,
            image: detail.product?.image || '',
            price: Number(detail.product?.price)
          },
          price: Number(detail.price),
          quantity: Number(detail.quantity)
        })) as OrderDetail[];
      } else {
        this.orderDetails = [];
      }

      this.loadingOrderDetails = false;
    },
    error: (error) => {
      console.error('Error loading order details:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể tải chi tiết đơn hàng. Vui lòng thử lại sau.'
      });
      this.loadingOrderDetails = false;
      this.displayOrderDetails = false;
    }
  });
}

// Thêm phương thức xử lý ngày tháng
private processOrderDate(date: any): Date {
  try {
    if (typeof date === 'string') {
      if (date.includes(',')) {
        const [year, month, day, hours = 0, minutes = 0, seconds = 0] = 
          date.split(',').map(part => parseInt(part.trim(), 10));
        return new Date(year, month - 1, day, hours, minutes, seconds);
      }
      return new Date(date);
    }
    return date;
  } catch (error) {
    console.error('Error processing date:', error);
    return new Date();
  }
}
  
  getStatusLabel(status: string): string {
    if (!status) return 'Chờ xác nhận';
    const found = this.orderStatuses.find(s => s.value === status);
    return found ? found.label : 'Chờ xác nhận';
  }
  
  getStatusSeverity(status: string): string {
    return this.orderService.getStatusClass(status || 'PENDING');
  }
  
  getStatusIcon(status: string): string {
    if (!status) return 'pi pi-clock';
    const found = this.orderStatuses.find(s => s.value === status);
    return found ? found.icon : 'pi pi-clock';
  }
  
  getPaymentMethodLabel(method: string): string {
    switch(method) {
      case 'COD': return 'Tiền mặt';
      case 'vnpay': return 'VNPay';
      default: return method || 'Không xác định';
    }
  }
  
  getPaymentStatusLabel(status: string): string {
    switch(status) {
      case 'PAID': return 'Đã thanh toán';
      case 'PENDING': return 'Chờ thanh toán';
      case 'CANCELLED': return 'Thanh toán thất bại';
      default: return status || 'Chờ thanh toán';
    }
  }
  
  getPaymentStatusSeverity(status: string): string {
    switch(status) {
      case 'PAID': return 'success';
      case 'PENDING': return 'warning';
      case 'CANCELLED': return 'danger';
      case 'REFUNDED': return 'info';
      default: return 'warning';
    }
  }
  
  getOrderStatusDescription(status: string): string {
    switch(status) {
      case 'PENDING': return 'Đơn hàng của bạn đang chờ xác nhận';
      case 'CONFIRMED': return 'Đơn hàng của bạn đã được xác nhận';
      case 'PREPARING': return 'Đơn hàng của bạn đang được chuẩn bị';
      case 'SHIPPING': return 'Đơn hàng của bạn đang được vận chuyển';
      case 'DELIVERED': return 'Đơn hàng của bạn đã được giao thành công';
      case 'CANCELLED': return 'Đơn hàng của bạn đã bị hủy';
      default: return 'Đơn hàng của bạn đang được xử lý';
    }
  }

  // Method to determine the class for each step in the progress track
  getProgressStepClass(stepStatus: string, currentStatus: string): string {
    // Order statuses in sequence
    const orderSequence = [
      'PENDING',      // Chờ xác nhận
      'CONFIRMED',    // Đã xác nhận
      'PREPARING',    // Đang chuẩn bị
      'SHIPPING',     // Đang giao hàng
      'DELIVERED'     // Đã giao hàng
    ];
    
    // If order is cancelled, mark only the cancelled step
    if (currentStatus === 'CANCELLED') {
      return stepStatus === 'CANCELLED' ? 'cancelled' : '';
    }
    
    const stepIndex = orderSequence.indexOf(stepStatus);
    const currentIndex = orderSequence.indexOf(currentStatus);
    
    // If step is not in sequence or current status is not in sequence
    if (stepIndex === -1 || currentIndex === -1) {
      return '';
    }
    
    // If this step is the current active step
    if (stepIndex === currentIndex) {
      return 'active';
    }
    
    // If this step has been completed (comes before current step)
    if (stepIndex < currentIndex) {
      return 'completed';
    }
    
    // Default: step not reached yet
    return '';
  }

  // Method to export the order as an invoice PDF
  exportInvoice() {
    if (!this.selectedOrder || !this.orderDetails.length) {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không có thông tin đơn hàng để xuất hóa đơn'
      });
      return;
    }

    try {
      this.messageService.add({
        severity: 'info',
        summary: 'Thông báo',
        detail: 'Đang xuất hóa đơn, vui lòng đợi...'
      });

      this.orderService.exportInvoice(this.selectedOrder, this.orderDetails);
      
      this.messageService.add({
        severity: 'success',
        summary: 'Thành công',
        detail: 'Xuất hóa đơn thành công!'
      });
    } catch (error) {
      console.error('Error exporting invoice:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Có lỗi xảy ra khi xuất hóa đơn. Vui lòng thử lại sau.'
      });
    }
  }
}

// Utility timeout operator function for RxJS
export function timeout<T>(ms: number): import("rxjs").OperatorFunction<T, T> {
  return (source: Observable<T>) =>
    new Observable<T>((subscriber) => {
      const timer = setTimeout(() => {
        subscriber.error(new TimeoutError());
      }, ms);

      const subscription = source.subscribe({
        next(value) {
          clearTimeout(timer);
          subscriber.next(value);
        },
        error(err) {
          clearTimeout(timer);
          subscriber.error(err);
        },
        complete() {
          clearTimeout(timer);
          subscriber.complete();
        }
      });

      return () => {
        clearTimeout(timer);
        subscription.unsubscribe();
      };
    });
}

