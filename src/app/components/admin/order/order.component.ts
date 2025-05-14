import { Component, OnInit } from '@angular/core';
import { MessageService, ConfirmationService } from 'primeng/api';
import { OrderService } from 'src/app/_service/order.service';
import { Observable, throwError, TimeoutError, EMPTY } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { OrderDetail } from 'src/app/model/orderdetail_respone';
import { Order } from 'src/app/model/order_respone';


@Component({
  selector: 'app-order',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.css'],
  providers: [MessageService, ConfirmationService]
})
export class OrderComponent implements OnInit {

  listOrder: any[] = [];
  selectedOrder: any = null;
  orderStatuses: any[] = [];
  displayOrderDetails: boolean = false;
  orderDetails: any[] = [];
  loading: boolean = false;
  loadingOrderDetails: boolean = false;

  constructor(
    private orderService: OrderService, 
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit(): void {
    this.getListOrder();
    this.orderStatuses = this.orderService.getOrderStatuses();
    this.openOrderDetails(this.selectedOrder);
  }

  getListOrder() {
    this.loading = true;
    this.orderService.getListOrder().subscribe({
      next: res => {
        this.listOrder = res;
        this.loading = false;
      },
      error: err => {
        console.log(err);
        this.loading = false;
        this.messageService.add({severity:'error', summary: 'Lỗi', detail: 'Không thể tải danh sách đơn hàng'});
      }
    });
  }
  
  // Thêm phương thức để tính tổng tiền của từng sản phẩm
    calculateSubTotal(detail: OrderDetail): number {
      return (detail.price ?? 0) * (detail.quantity ?? 0);
    }
    openOrderDetails(order: Order) {
    if (!order || order.id === undefined || order.id === null) {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không tìm thấy thông tin đơn hàng hợp lệ.'
      });
      return;
    }
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
  
  updateOrderStatus(order: any, newStatus: string) {
    this.confirmationService.confirm({
      message: `Bạn có chắc chắn muốn cập nhật trạng thái đơn hàng #${order.id} thành "${this.getStatusLabel(newStatus)}"?`,
      header: 'Xác nhận cập nhật trạng thái',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.loading = true;
        this.orderService.updateOrderStatus(order.id, newStatus).subscribe({
          next: res => {
            // Cập nhật trạng thái đơn hàng trong danh sách
            const index = this.listOrder.findIndex(o => o.id === order.id);
            if (index !== -1) {
              this.listOrder[index].orderStatus = newStatus;
              
              // Cập nhật đơn hàng được chọn nếu đang hiển thị chi tiết
              if (this.selectedOrder && this.selectedOrder.id === order.id) {
                this.selectedOrder.orderStatus = newStatus;
              }
            }
            
            this.loading = false;
            this.messageService.add({
              severity: 'success', 
              summary: 'Thành công', 
              detail: `Đã cập nhật trạng thái đơn hàng #${order.id} thành ${this.getStatusLabel(newStatus)}`
            });
          },
          error: err => {
            console.error(err);
            this.loading = false;
            this.messageService.add({
              severity: 'error', 
              summary: 'Lỗi', 
              detail: 'Không thể cập nhật trạng thái đơn hàng. Vui lòng thử lại.'
            });
          }
        });
      }
    });
  }
  paymentStatuses = [
    { label: 'Chưa thanh toán', value: 'PENDING', icon: 'pi pi-clock' },
    { label: 'Đã thanh toán', value: 'COMPLETED', icon: 'pi pi-check' },
    { label: 'Thanh toán thất bại', value: 'FAILED', icon: 'pi pi-times' },
    { label: 'Hoàn tiền', value: 'REFUNDED', icon: 'pi pi-undo' }
  ];
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
      case 'REFUNDED': return 'Đã hoàn tiền';
      default: return status || 'Chờ thanh toán';
    }
  }
  updatePaymentStatus(order: any, status: string): void {
    // Cập nhật trạng thái thanh toán trong dữ liệu
    const previousStatus = order.paymentStatus;
    order.paymentStatus = status;

    // Gửi yêu cầu cập nhật trạng thái thanh toán lên server
    this.orderService.updateOrderPaymentStatus(order.id, status).subscribe({
      next: () => {
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Thành công', 
          detail: 'Cập nhật trạng thái thanh toán thành công!' 
        });
        
        // Nếu đang cập nhật sang trạng thái "đã thanh toán" và đơn hàng đang ở trạng thái "đang chờ xử lý"
        // tự động cập nhật trạng thái đơn hàng thành "đang xử lý"
        if (status === 'PAID' && order.orderStatus === 'PENDING') {
          this.updateOrderStatus(order, 'PREPARING');
        }
      },
      error: (err) => {
        // Khôi phục trạng thái thanh toán cũ nếu cập nhật thất bại
        order.paymentStatus = previousStatus;
        
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Lỗi', 
          detail: 'Cập nhật trạng thái thanh toán thất bại!' 
        });
        console.error('Payment status update error:', err);
      }
    });
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
  
  refreshOrders() {
    this.getListOrder();
  }

  // Method to open order details and then export the invoice
  openOrderDetailsAndExport(order: Order) {
    if (!order || order.id === undefined || order.id === null) {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không tìm thấy thông tin đơn hàng hợp lệ.'
      });
      return;
    }
    
    this.loadingOrderDetails = true;
    // We don't need to display the dialog for direct export
    
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
        return EMPTY;
      })
    ).subscribe({
      next: (response: any) => {
        // Xử lý orderDate là mảng
        let orderDate;
        if (Array.isArray(response.orderDate)) {
          const [year, month, day, hours, minutes, seconds] = response.orderDate;
          orderDate = new Date(year, month - 1, day, hours, minutes, seconds);
        } else {
          orderDate = this.processOrderDate(response.orderDate);
        }
  
        // Map dữ liệu sang định dạng chuẩn
        const orderData = {
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
        let orderDetailsData: any[] = [];
        if (response.orderDetails && Array.isArray(response.orderDetails)) {
          orderDetailsData = response.orderDetails.map((detail: OrderDetail) => ({
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
          }));
        }
  
        this.loadingOrderDetails = false;
        
        // Export the invoice directly
        try {
          this.messageService.add({
            severity: 'info',
            summary: 'Thông báo',
            detail: 'Đang xuất hóa đơn, vui lòng đợi...'
          });
          
          this.orderService.exportInvoice(orderData, orderDetailsData);
          
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
      },
      error: (error) => {
        console.error('Error loading order details:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể tải chi tiết đơn hàng. Vui lòng thử lại sau.'
        });
        this.loadingOrderDetails = false;
      }
    });
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

