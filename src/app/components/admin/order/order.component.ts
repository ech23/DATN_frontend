import { Component, OnInit } from '@angular/core';
import { MessageService, ConfirmationService } from 'primeng/api';
import { OrderService } from 'src/app/_service/order.service';
import { PdfService } from 'src/app/_service/pdf.service';
interface OrderDetail {
  id: number;
  orderId: number;
  name: string;
  price: number;
  productId: number;
  quantity: number;
  subtotal: number;
  
}
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
    private confirmationService: ConfirmationService,
    private pdfService: PdfService
  ) { }

  ngOnInit(): void {
    this.getListOrder();
    this.orderStatuses = this.orderService.getOrderStatuses();
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
              console.log(response.orderDetails);
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
  
  /**
   * Generate and open invoice for selected order
   */
  generateInvoice() {
    if (!this.selectedOrder || !this.orderDetails || this.orderDetails.length === 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể tạo hóa đơn. Không có thông tin đơn hàng hoặc sản phẩm.'
      });
      return;
    }
    
    try {
      // Show loading message
      this.messageService.add({
        severity: 'info',
        summary: 'Thông báo',
        detail: 'Đang tạo hóa đơn PDF, vui lòng đợi...'
      });
      
      // Wait a moment for the UI to update before generating the PDF
      setTimeout(() => {
        this.pdfService.generateInvoice(this.selectedOrder, this.orderDetails);
      }, 100);
    } catch (error) {
      console.error('Error generating PDF:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Có lỗi xảy ra khi tạo hóa đơn. Vui lòng thử lại sau.'
      });
    }
  }
  
  /**
   * Generate and download invoice for selected order
   */
  downloadInvoice() {
    if (!this.selectedOrder || !this.orderDetails || this.orderDetails.length === 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể tải hóa đơn. Không có thông tin đơn hàng hoặc sản phẩm.'
      });
      return;
    }
    
    try {
      // Show loading message
      this.messageService.add({
        severity: 'info',
        summary: 'Thông báo',
        detail: 'Đang tạo hóa đơn PDF, vui lòng đợi...'
      });
      
      // Wait a moment for the UI to update before generating the PDF
      setTimeout(() => {
        this.pdfService.downloadInvoice(this.selectedOrder, this.orderDetails);
      }, 100);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Có lỗi xảy ra khi tạo hóa đơn. Vui lòng thử lại sau.'
      });
    }
  }
}
