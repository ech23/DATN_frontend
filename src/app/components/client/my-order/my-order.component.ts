import { Component, OnInit } from '@angular/core';
import { OrderService } from 'src/app/_service/order.service';
import { StorageService } from 'src/app/_service/storage.service';
import { MessageService } from 'primeng/api';
import { CartService } from 'src/app/_service/cart.service';
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
        this.listOrder = res;
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
  
  openOrderDetails(order: any) {
    console.log('Mở đơn hàng: ', order);
    this.loadingOrderDetails = true;
    this.displayOrderDetails = true;
    
    // Tạm thời sử dụng order hiện tại để hiển thị thông tin cơ bản
    this.selectedOrder = { ...order };
    this.orderDetails = [];
    
    // Lấy thông tin chi tiết từ server
    this.orderService.getOrderById(order.id).subscribe({
      next: (orderDetail) => {
        console.log('Chi tiết trả về:', orderDetail);
        this.selectedOrder = orderDetail;
        this.orderDetails = orderDetail.orderDetails || [];
        this.loadingOrderDetails = false;
      },
      error: (err) => {
        console.error('Lỗi khi lấy chi tiết đơn hàng:', err);
        this.loadingOrderDetails = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể tải thông tin chi tiết đơn hàng. Vui lòng thử lại.'
        });
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
}
