import { Component, OnInit } from '@angular/core';
import { faBars, faHeart, faPhone, faShoppingBag } from '@fortawesome/free-solid-svg-icons';
import { MessageService } from 'primeng/api';
import { CartService } from 'src/app/_service/cart.service';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css'],
  providers: [MessageService]
})
export class CartComponent implements OnInit {

  heart = faHeart;
  bag = faShoppingBag;
  phone = faPhone;
  bars = faBars;

  showDepartment = false;

  constructor(
    public cartService: CartService,
    private messageService: MessageService
  ) {}
  
  ngOnInit(): void {
    // Validate cart items against current stock on component initialization
    this.validateCartStock();
  }

  showDepartmentClick(){
    this.showDepartment = !this.showDepartment;
  }

  removeFromCart(item:any){
    this.cartService.remove(item);
  }

  updateQuantity(item: any, event: any){
    let quantity: number = parseInt(event.target.value);
    if (isNaN(quantity) || quantity < 1) {
      quantity = 1;
      event.target.value = 1;
    }
    
    this.cartService.updateCart(item, quantity).subscribe(success => {
      if (!success) {
        this.messageService.add({
          severity: 'error', 
          summary: 'Stock Error', 
          detail: this.cartService.getStockError(item.id)
        });
        
        // Reset the input to the original quantity or the max available
        if (this.cartService.getStockError(item.id).includes('Only')) {
          const match = this.cartService.getStockError(item.id).match(/Only (\d+) items/);
          if (match && match[1]) {
            event.target.value = match[1];
            this.cartService.updateCart(item, parseInt(match[1])).subscribe();
          }
        }
      }
    });
  }

  plusQuantity(item:any){
    let quantity = Number(item.quantity);
    let newQuantity = quantity + 1;
    
    this.cartService.updateCart(item, newQuantity).subscribe(success => {
      if (!success) {
        this.messageService.add({
          severity: 'error', 
          summary: 'Stock Error', 
          detail: this.cartService.getStockError(item.id)
        });
      }
    });
  }
  
  subtractQuantity(item: any){
    if(item.quantity > 1){
      let quantity = Number(item.quantity);
      this.cartService.updateCart(item, quantity - 1).subscribe();
    }
  }
  
  validateCartStock(): void {
    this.cartService.validateCartStock().subscribe(result => {
      if (!result.valid) {
        result.invalidItems.forEach(item => {
          this.messageService.add({
            severity: 'warn',
            summary: 'Stock Warning',
            detail: `${item.name}: Only ${item.availableQuantity} items in stock (you requested ${item.requestedQuantity})`,
            sticky: true
          });
        });
      }
    });
  }
  
  hasStockError(item: any): boolean {
    return !!this.cartService.getStockError(item.id);
  }
}
