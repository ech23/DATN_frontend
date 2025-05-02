import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { Order } from '../_class/order';
import { OrderDetail } from '../_class/order-detail';

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
}
