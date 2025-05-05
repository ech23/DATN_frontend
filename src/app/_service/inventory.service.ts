import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

const API_URL = "http://localhost:8080/api/inventory/";
const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class InventoryService {

  // Mock data for stock history - this would be replaced by actual API calls
  private stockHistoryData: any[] = [];

  constructor(private http: HttpClient) { }

  // In a real implementation, these would be connected to backend API endpoints
  
  /**
   * Adjust stock quantity for a product
   * @param productId Product ID
   * @param adjustmentType 'add' or 'subtract'
   * @param quantity Amount to adjust
   * @param reason Reason for adjustment
   */
  // adjustStock(productId: number, quantity: number, reason: string): Observable<any> {
  //   // In a real implementation, this would call a backend API
  //   return this.http.post(API_URL + 'update/', {
  //     productId,
  //     quantity,
  //     reason
  //   }, httpOptions).pipe(
  //     catchError(error => {
  //       console.error('Error adjusting stock:', error);
  //       return of({ success: false, message: error.message });
  //     })
  //   );
  // }

  adjustStock(productId: number, quantity: number, reason: string, adjustmentType: string): Observable<any> {
    const url = `${API_URL}update/${productId}`;
    const params = new HttpParams()
      .set('quantity', quantity.toString())
      .set('reason', reason)
      .set('adjustmentType', 'ADD');
  
    return this.http.post(url, null, { params }).pipe(
      catchError(error => {
        console.error('Error adjusting stock:', error);
        return of({ success: false, message: error.message });
      })
    );
  }
  /**
   * Get stock history for a product
   * @param productId Product ID
   */
  getStockHistory(productId: number): Observable<any[]> {
    // In a real implementation, this would call a backend API
    return this.http.get<any[]>(API_URL + 'adjustments/' + productId, httpOptions).pipe(
      catchError(error => {
        console.error('Error fetching stock history:', error);
        // Return filtered mock data for demo purposes
        return of(this.stockHistoryData.filter(item => item.productId === productId));
      })
    );
  }

  /**
   * Add an entry to stock history
   * For demo purposes - in a real app, the backend would handle this
   */
  addStockHistoryEntry(entry: any): void {
    this.stockHistoryData.push({
      ...entry,
      id: this.stockHistoryData.length + 1,
      date: new Date()
    });
  }

  /**
   * Get products with low stock
   * @param threshold Threshold quantity for low stock alert
   */
  getLowStockProducts(threshold: number = 10): Observable<any[]> {
    // In a real implementation, this would call a backend API
    let params = new HttpParams().set('threshold', threshold.toString());
    return this.http.get<any[]>(API_URL + 'low-stock', { params }).pipe(
      catchError(error => {
        console.error('Error fetching low stock products:', error);
        return of([]);
      })
    );
  }

  /**
   * Generate inventory report
   * @param format Report format (pdf, excel, etc.)
   */
  generateInventoryReport(format: string = 'pdf'): Observable<any> {
    // In a real implementation, this would call a backend API that returns a file
    let params = new HttpParams().set('format', format);
    return this.http.get(API_URL + 'report', { 
      params,
      responseType: 'blob' 
    }).pipe(
      catchError(error => {
        console.error('Error generating report:', error);
        return of(null);
      })
    );
  }
} 