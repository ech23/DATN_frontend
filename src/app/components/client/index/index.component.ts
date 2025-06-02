import { Component, OnInit, ChangeDetectorRef, AfterContentChecked } from '@angular/core';
import { Form, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {faBars, faHeart, faRightFromBracket, faUser} from '@fortawesome/free-solid-svg-icons'
import {faShoppingBag} from '@fortawesome/free-solid-svg-icons'
import {faPhone} from '@fortawesome/free-solid-svg-icons'
import { MessageService } from 'primeng/api';
import { AuthService } from 'src/app/_service/auth.service';
import { CartService } from 'src/app/_service/cart.service';
import { CategoryService } from 'src/app/_service/category.service';
import { StorageService } from 'src/app/_service/storage.service';
import { WishlistService } from 'src/app/_service/wishlist.service';


@Component({
  selector: 'app-index',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.css'],
  providers: [MessageService]

})
export class IndexComponent implements OnInit {

  listItemInCart: any[] = [];
  totalPrice = 0;
  heart = faHeart;
  bag = faShoppingBag;
  phone = faPhone;
  userIcon = faUser;
  logoutIcon = faRightFromBracket;
  bars = faBars;

  showDepartment = false;


  loginForm : any = {
    username : null,
    password : null
  }

  registerForm : any = {
    username: null,
    email: null,
    password: null
  }

  isSuccessful = false;
  isSignUpFailed = false;
  isLoggedIn = false;
  isLoginFailed = false;
  roles: string[] = [];
  errorMessage = '';
  authModal : boolean = false;
  listCategoryEnabled : any;


  keyword: any;
  loginFormGroup: FormGroup = new FormGroup({});
  registerFormGroup: FormGroup = new FormGroup({});
  constructor(
    public cartService:CartService,
    public wishlistService: WishlistService,
    private authService: AuthService,
    private storageService: StorageService,
    private messageService:MessageService,
    private categoryService: CategoryService,
    private router: Router,
    private fb:FormBuilder
  ){
    this.initializeForms();
  }
  private initializeForms() {
    this.loginFormGroup = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.registerFormGroup = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/)
      ]]
    });
  }
  ngOnInit(): void {
    this.getCategoryEnbled();
    this.isLoggedIn = this.storageService.isLoggedIn();
    this.wishlistService.loadWishList();
    this.cartService.loadCart();
  }

  showDepartmentClick(){
    this.showDepartment = !this.showDepartment;
  }

  getCategoryEnbled(){
    this.categoryService.getListCategoryEnabled().subscribe({
      next: res =>{
        this.listCategoryEnabled = res;
      },error: err =>{
        console.log(err);
      }
    })
  }

  removeFromCart(item:any){
    this.cartService.remove(item);
  }

  removeWishList(item: any){
    this.wishlistService.remove(item);
  }

  showAuthForm(){
    if(!this.isLoggedIn){
      this.authModal = true;
      this.loginForm = {username: null,password: null};
      this.registerForm = {username: null,email: null, password: null};
    }
  }

  login():void{
    if (this.loginFormGroup.invalid) {
      this.showError('Vui lòng điền đầy đủ thông tin đăng nhập hợp lệ!');
      return;
    }
    const { username, password } = this.loginFormGroup.value;
    this.authService.login(username,password).subscribe({
      next: res =>{
        this.storageService.saveUser(res);
        this.isLoggedIn = true;
        this.isLoginFailed = false;
        this.roles = this.storageService.getUser().roles;
        this.showSuccess("Đăng nhập thành công!!");
        this.authModal = false;
        
      },error: err =>{
        console.log(err);
        this.isLoggedIn = false;
        this.isLoginFailed = true;
        this.showError(err.message);
      }
    })
  }

  register():void{
    if (this.registerFormGroup.invalid) {
      this.showError('Vui lòng điền đầy đủ thông tin đăng ký hợp lệ!');
      return;
    }
    const { username, email, password } = this.registerFormGroup.value;
    this.authService.register(username,email,password).subscribe({
      next: res =>{
        this.isSuccessful = true;
        this.isSignUpFailed = false;
        this.showSuccess("Đăng ký thành công")
        this.authModal = false;
      },error: err =>{
        this.showError(err.message);
        this.errorMessage = err.error.message;
        this.isSignUpFailed = true;
      }
    })
  }
  // Thêm các helper methods để kiểm tra lỗi
  getErrorMessage(formGroup: FormGroup, controlName: string): string {
    const control = formGroup.get(controlName);
    if (control?.errors) {
      if (control.errors['required']) {
        return `${controlName} là bắt buộc`;
      }
      if (control.errors['minlength']) {
        return `${controlName} phải có ít nhất ${control.errors['minlength'].requiredLength} ký tự`;
      }
      if (control.errors['email']) {
        return 'Email không hợp lệ';
      }
      if (control.errors['pattern']) {
        return 'Mật khẩu phải chứa ít nhất 1 chữ cái và 1 số';
      }
    }
    return '';
  }
  logout():void{
    this.authService.logout().subscribe({
      next:res =>{
        this.storageService.clean();
        this.isLoggedIn = false;
        this.authModal = false;
        this.showSuccess("Bạn đã đăng xuất!!");
      },error: err=>{
        this.showError(err.message);
      }
    })
  }




  showSuccess(text: string) {
    this.messageService.add({severity:'success', summary: 'Success', detail: text});
  }
  showError(text: string) {
    this.messageService.add({severity:'error', summary: 'Error', detail: text});
  }

  showWarn(text: string) {
    this.messageService.add({severity:'warn', summary: 'Warn', detail: text});
  }


}
