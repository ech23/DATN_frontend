import { EventEmitter, Injectable } from '@angular/core';
import { InputText } from 'primeng/inputtext';
import { Observable, of, Subject, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { ProductService } from './product.service';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  items : any[] =[];
  
  totalPrice =0;

  total = 0;
  
  stockErrors: {[productId: number]: string} = {};

  constructor(private productService: ProductService) { }


  saveCart():void{
    localStorage.setItem('cart_items',JSON.stringify(this.items));
  }

  addToCart(item: any, quantity: number): Observable<boolean> {
    this.loadCart();
    
    // Check if product has stock information
    if (item.quantity === undefined || item.quantity === null) {
      return this.productService.getProdct(item.id).pipe(
        map((product: any) => {
          return this.validateAndAddToCart(item, quantity, product.quantity);
        })
      );
    } else {
      return of(this.validateAndAddToCart(item, quantity, item.quantity));
    }
  }
  
  private validateAndAddToCart(item: any, requestedQuantity: number, availableStock: number): boolean {
    // Clear any previous errors for this product
    this.stockErrors[item.id] = '';
    
    if (availableStock <= 0) {
      this.stockErrors[item.id] = 'This product is out of stock.';
      return false;
    }
    
    let totalRequestedQuantity = requestedQuantity;
    
    // If product already in cart, add to existing quantity
    if (this.productInCart(item)) {
      this.items.forEach(cartItem => {
        if (cartItem.id === item.id) {
          totalRequestedQuantity += cartItem.quantity;
        }
      });
    }
    
    // Check if requested quantity exceeds available stock
    if (totalRequestedQuantity > availableStock) {
      this.stockErrors[item.id] = `Only ${availableStock} items available in stock.`;
      return false;
    }
    
    // Add to cart if validation passes
    if (this.productInCart(item)) {
      this.items.forEach(res => {
        if (res.id == item.id) {
          res.quantity += requestedQuantity;
          res.subTotal = res.quantity * res.price;
        }
      });
    } else {
      item.quantity = requestedQuantity;
      item.subTotal = item.quantity * item.price;
      this.items.push(item);
    }
    
    this.saveCart();
    this.getTotalPrice();
    return true;
  }

  updateCart(item: any, quantity: number): Observable<boolean> {
    // Check current stock
    return this.productService.getProdct(item.id).pipe(
      map((product: any) => {
        // Clear any previous errors for this product
        this.stockErrors[item.id] = '';
        
        // Validate quantity against available stock
        if (quantity > product.quantity) {
          this.stockErrors[item.id] = `Only ${product.quantity} items available in stock.`;
          return false;
        }
        
        // Update cart if validation passes
        this.items.forEach(res => {
          if (res.id == item.id) {
            res.quantity = quantity;
            res.subTotal = res.quantity * res.price;
          }
        });
        
        this.saveCart();
        this.getTotalPrice();
        return true;
      })
    );
  }

  getStockError(productId: number): string {
    return this.stockErrors[productId] || '';
  }

  productInCart(item: any):boolean{
    return this.items.findIndex((x:any) => x.id == item.id) > -1;
  }
  loadCart():void{
    this.items = JSON.parse(localStorage.getItem('cart_items') as any) || [];
    this.getTotalPrice();

  }

  getItems() {
    return this.items;
    this.getTotalPrice();
  }



  getTotalPrice(){
    this.totalPrice = 0;
    this.total = 0;
    this.items.forEach(res =>{
      this.totalPrice += res.subTotal;
      this.total = this.totalPrice;
    })
    return this.totalPrice;
  }

  remove(item: any){
    const index = this.items.findIndex((o:any) => o.id == item.id);
    if(index > -1){
      this.items.splice(index,1);
      this.saveCart();
    }
    this.getTotalPrice();
    
    // Clear any errors for this product
    if (this.stockErrors[item.id]) {
      delete this.stockErrors[item.id];
    }
  }

  clearCart(){
    this.items = [];
    this.getTotalPrice();
    localStorage.removeItem('cart_items');
    this.stockErrors = {};
  }

  // Check if any items in cart exceed available stock
  validateCartStock(): Observable<{valid: boolean, invalidItems: any[]}> {
    if (this.items.length === 0) {
      return of({valid: true, invalidItems: []});
    }
    
    // Get product IDs in cart
    const productIds = this.items.map(item => item.id);
    const invalidItems: any[] = [];
    
    // Create observable array of stock checks
    const stockChecks = productIds.map(id => 
      this.productService.getProdct(id)
    );
    
    return forkJoin(stockChecks).pipe(
      map(products => {
        // Check each product's stock
        products.forEach((product: any) => {
          const cartItem = this.items.find(item => item.id === product.id);
          if (cartItem && cartItem.quantity > product.quantity) {
            invalidItems.push({
              id: product.id,
              name: product.name,
              requestedQuantity: cartItem.quantity,
              availableQuantity: product.quantity
            });
            this.stockErrors[product.id] = `Only ${product.quantity} items available in stock.`;
          }
        });
        
        return {
          valid: invalidItems.length === 0,
          invalidItems
        };
      })
    );
  }
}
