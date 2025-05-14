import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { Order } from '../_class/order';
import { OrderDetail } from '../_class/order-detail';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const ORDER_API = "http://localhost:8080/api/order/";
const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};


@Injectable({
  providedIn: 'root'
})
export class OrderService {
  constructor(private http: HttpClient) { }


  getListOrder():Observable<any>{
    return this.http.get(ORDER_API,httpOptions);
  }



  getListOrderByUser(username: string):Observable<any>{
    let params = new HttpParams();
    params = params.append('username',username);
    return this.http.get(ORDER_API + 'user',{params: params});

  }

  placeOrder(firstname: string, lastname: string, country: string, address: string, town: string, state: string, postCode: string, phone: string, email: string, note: string, orderDetails: OrderDetail[], username: string, paymentMethod: string = 'check'): Observable<any> {
    return this.http.post(ORDER_API + 'create', {
      firstname,
      lastname,
      country,
      address,
      town,
      state,
      postCode,
      phone,
      email,
      note,
      orderDetails,
      username,
      paymentMethod
    }, httpOptions);
  }

  updateOrderPaymentStatus(orderId: string, paymentStatus: string, transactionInfo?: any): Observable<any> {
    // Prepare the request body with all necessary information
    const requestBody = {
      orderId,
      paymentStatus,
      transactionInfo: transactionInfo || {} // Include transaction details if available
    };
    
    return this.http.post(`${ORDER_API}${orderId}/update-payment`, requestBody, httpOptions)
      .pipe(
        catchError(error => {
          console.error('Error updating payment status:', error);
          return throwError(() => new Error(error.message || 'Failed to update payment status'));
        })
      );
  }
  
  updateOrderStatus(orderId: string, orderStatus: string): Observable<any> {
    const params = new HttpParams().set('status', orderStatus);
    return this.http.post(ORDER_API + orderId + '/update-status',null, {params: params});
  }
  
  getOrderById(orderId: string): Observable<any> {
    return this.http.get(ORDER_API + orderId, httpOptions);
  }
  getOrderDetailsById(orderId: string): Observable<any> {
    return this.http.get(ORDER_API + orderId + '/details', httpOptions);
  }
  
  // Thêm các trạng thái đơn hàng có sẵn
  getOrderStatuses(): any[] {
    return [
      { label: 'Chờ xác nhận', value: 'PENDING', icon: 'pi pi-clock' },
      { label: 'Đã xác nhận', value: 'CONFIRMED', icon: 'pi pi-check-circle' },
      { label: 'Đang chuẩn bị', value: 'PREPARING', icon: 'pi pi-sync' },
      { label: 'Đang giao hàng', value: 'SHIPPING', icon: 'pi pi-truck' },
      { label: 'Đã giao hàng', value: 'DELIVERED', icon: 'pi pi-check' },
      { label: 'Đã hủy', value: 'CANCELLED', icon: 'pi pi-times-circle' }
    ];
  }
  
  // Lấy màu sắc tương ứng với từng trạng thái
  getStatusClass(status: string): string {
    switch(status) {
      case 'PENDING': return 'warning';
      case 'CONFIRMED': return 'info';
      case 'PROCESSING': return 'info';
      case 'SHIPPING': return 'primary';
      case 'DELIVERED': return 'success';
      case 'CANCELLED': return 'danger';
      default: return 'warning';
    }
  }

  // Phương thức xuất hóa đơn dưới dạng PDF
  exportInvoice(order: any, orderDetails: any[]): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Tiêu đề
    doc.setFontSize(20);
    doc.text('HÓA ĐƠN BÁN HÀNG', pageWidth / 2, 20, { align: 'center' });
    
    // Thông tin cửa hàng
    doc.setFontSize(12);
    doc.text('OGANI SHOP', 14, 30);
    doc.text('Địa chỉ: 123 Đường ABC, Quận XYZ, TP.HCM', 14, 35);
    doc.text('Điện thoại: 0123456789', 14, 40);
    doc.text('Email: contact@ogani.com', 14, 45);
    
    // Đường kẻ ngăn cách
    doc.setLineWidth(0.5);
    doc.line(14, 50, pageWidth - 14, 50);
    
    // Thông tin đơn hàng
    doc.setFontSize(11);
    doc.text(`Mã đơn hàng: #${order.id}`, 14, 60);
    doc.text(`Ngày đặt: ${new Date(order.orderDate).toLocaleDateString('vi-VN')}`, 14, 65);
    doc.text(`Phương thức thanh toán: ${this.getPaymentMethodLabel(order.paymentMethod)}`, 14, 70);
    doc.text(`Trạng thái thanh toán: ${this.getPaymentStatusLabel(order.paymentStatus)}`, 14, 75);
    
    // Thông tin khách hàng
    doc.text(`Khách hàng: ${order.firstname} ${order.lastname}`, 14, 85);
    doc.text(`Địa chỉ: ${order.address}, ${order.town}, ${order.state}, ${order.country}`, 14, 90);
    doc.text(`Điện thoại: ${order.phone}`, 14, 95);
    doc.text(`Email: ${order.email}`, 14, 100);
    
    // Bảng chi tiết sản phẩm
    const tableColumn = ['STT', 'Tên sản phẩm', 'Đơn giá', 'Số lượng', 'Thành tiền'];
    const tableRows: any[] = [];
    
    orderDetails.forEach((detail, index) => {
      const formattedPrice = new Intl.NumberFormat('vi-VN', 
        { style: 'currency', currency: 'VND' }).format(detail.price);
      const formattedSubTotal = new Intl.NumberFormat('vi-VN', 
        { style: 'currency', currency: 'VND' }).format(detail.price * detail.quantity);
      
      const productName = detail.product?.name || detail.name || 'Sản phẩm';
      
      tableRows.push([
        index + 1,
        productName,
        formattedPrice,
        detail.quantity,
        formattedSubTotal
      ]);
    });
    
    // Vẽ bảng sản phẩm
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 110,
      theme: 'striped',
      headStyles: { fillColor: [40, 40, 40] },
      margin: { left: 14, right: 14 },
      styles: { overflow: 'linebreak' },
      columnStyles: { 
        0: { cellWidth: 10 },
        1: { cellWidth: 'auto' },
        2: { halign: 'right' },
        3: { halign: 'center' },
        4: { halign: 'right' }
      }
    });
    
    // Tính vị trí cho phần tổng cộng (sau bảng)
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    // Tổng cộng
    doc.setFontSize(12);
    doc.text(`Tổng cộng: ${new Intl.NumberFormat('vi-VN', 
      { style: 'currency', currency: 'VND' }).format(order.totalPrice)}`, 
      pageWidth - 14, finalY, { align: 'right' });
    
    // Chữ ký
    doc.setFontSize(11);
    doc.text('Người bán hàng', 50, finalY + 30, { align: 'center' });
    doc.text('(Ký, ghi rõ họ tên)', 50, finalY + 35, { align: 'center' });
    
    doc.text('Người mua hàng', pageWidth - 50, finalY + 30, { align: 'center' });
    doc.text('(Ký, ghi rõ họ tên)', pageWidth - 50, finalY + 35, { align: 'center' });
    
    // Ghi chú
    if (order.note) {
      doc.setFontSize(10);
      doc.text(`Ghi chú: ${order.note}`, 14, finalY + 60);
    }
    
    // Tạo tên file và tải xuống
    const fileName = `hoa-don-${order.id}.pdf`;
    doc.save(fileName);
  }

  // Helper method to get payment method label
  getPaymentMethodLabel(method: string): string {
    switch(method) {
      case 'COD': return 'Tiền mặt';
      case 'vnpay': return 'VNPay';
      default: return method || 'Không xác định';
    }
  }
  
  // Helper method to get payment status label
  getPaymentStatusLabel(status: string): string {
    switch(status) {
      case 'PAID': return 'Đã thanh toán';
      case 'PENDING': return 'Chờ thanh toán';
      case 'CANCELLED': return 'Thanh toán thất bại';
      case 'REFUNDED': return 'Đã hoàn tiền';
      default: return status || 'Chờ thanh toán';
    }
  }
}
