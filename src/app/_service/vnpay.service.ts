import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class VNPayService {

  private apiUrl = 'http://localhost:8080/api/vnpay';

  constructor(private http: HttpClient) {}

  createPaymentUrl(orderId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/create-payment/${orderId}`, {});
  }

  checkPaymentStatus(orderId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/payment-status/${orderId}`);
  }
  
  verifyPayment(params: any): Observable<any> {
    const httpParams = new HttpParams({ fromObject: params });
    return this.http.get<any>(`${this.apiUrl}/payment-callback`, { params: httpParams })
      .pipe(
        tap(response => {
          if (response.paymentStatus === "success" && response.orderStatuses === "PAID") {
            console.log('Payment verification successful:', response);
          } else {
            console.warn('Payment verification failed:', response);
          }
        })
      );
  }
  
  // Get payment history for a specific order
  getPaymentHistory(orderId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/payment-history/${orderId}`);
  }
}
