import { Component, OnInit } from '@angular/core';
import { OrderService } from 'src/app/_service/order.service';
import { StorageService } from 'src/app/_service/storage.service';
import { MessageService } from 'primeng/api';
import { CartService } from 'src/app/_service/cart.service';
interface OrderDetail {
  id: number;
  orderId: number;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  productId: number;
}
@Component({
  selector: 'app-my-order',
  templateUrl: './my-order.component.html',
  styleUrls: ['./my-order.component.css'],
  providers: [MessageService]
})



export class MyOrderComponent implements OnInit {

  listOrder: any[] = [];
  username: string = '';
  selectedOrder: any = null;
  displayOrderDetails: boolean = false;
  orderDetails: any[] = [];
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
  openOrderDetails(order: any) {
    this.loadingOrderDetails = true;
    this.selectedOrder = order;
    this.displayOrderDetails = true;
    
    this.orderService.getOrderDetailsById(order.id).subscribe({
        next: (response) => {
          console.log(response);
            this.orderDetails = Array.isArray(response) ? response : Object.values(response);
            this.loadingOrderDetails = false;
            if (response.orderDetails && Array.isArray(response.orderDetails)) {
              this.orderDetails = response.orderDetails.map((detail: OrderDetail) => ({
              id: detail.id,
              orderId: detail.orderId,
              productId: detail.productId,
              name: detail.name,
              price: Number(detail.price),
              quantity: Number(detail.quantity)
        })) as OrderDetail[];
      } else {
        this.orderDetails = [];
      }
        },
        error: (error) => {
            this.messageService.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Không thể tải chi tiết đơn hàng'
            });
            this.loadingOrderDetails = false;
        }
    });
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
  
  getOrderStatusTimeline(currentStatus: string): any[] {
    const statuses = [
      { 
        label: 'Chờ xác nhận', 
        icon: 'pi pi-clock', 
        description: 'Đơn hàng của bạn đã được tạo và đang chờ xác nhận',
        status: 'PENDING',
        active: false
      },
      { 
        label: 'Đã xác nhận', 
        icon: 'pi pi-check-circle', 
        description: 'Đơn hàng của bạn đã được xác nhận',
        status: 'CONFIRMED',
        active: false
      },
      { 
        label: 'Đang chuẩn bị', 
        icon: 'pi pi-box', 
        description: 'Đơn hàng của bạn đang được chuẩn bị',
        status: 'PREPARING',
        active: false
      },
      { 
        label: 'Đang vận chuyển', 
        icon: 'pi pi-truck', 
        description: 'Đơn hàng của bạn đang được vận chuyển',
        status: 'SHIPPING',
        active: false
      },
      { 
        label: 'Đã giao hàng', 
        icon: 'pi pi-check', 
        description: 'Đơn hàng của bạn đã được giao thành công',
        status: 'DELIVERED',
        active: false
      }
    ];
    
    // Handle cancelled order
    if (currentStatus === 'CANCELLED') {
      return [
        { 
          label: 'Đã hủy', 
          icon: 'pi pi-times-circle', 
          description: 'Đơn hàng của bạn đã bị hủy',
          status: 'CANCELLED',
          active: true
        }
      ];
    }
    
    // Mark appropriate statuses as active
    const statusIndex: { [key: string]: number } = {
      'PENDING': 0,
      'CONFIRMED': 1,
      'PREPARING': 2,
      'SHIPPING': 3,
      'DELIVERED': 4
    };
    
    // If order status is not in our mapping, default to pending
    const currentIndex = statusIndex[currentStatus] || 0;
    
    // Mark all steps up to the current one as active
    return statuses.map((status, index) => ({
      ...status,
      active: index <= currentIndex
    }));
  }
}
