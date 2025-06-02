import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { StorageService } from 'src/app/_service/storage.service';
import { UserService } from 'src/app/_service/user.service';

@Component({
  selector: 'app-user-detail',
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.css'],
  providers: [MessageService]
})
export class UserDetailComponent implements OnInit {

  username: any;
  user :any;

  changePassword : boolean = false;

  updateForm: any ={
    firstname: null,
    lastname: null,
    email: null,
    country: null,
    state:null,
    address: null,
    phone: null
  }

  changePasswordForm: any= {
    oldPassword : null,
    newPassword: null
  }

  constructor(private storageService: StorageService,private userService: UserService, private messageService: MessageService){}

  ngOnInit(): void {
    this.username = this.storageService.getUser().username;
    // console.log(this.storageService.getUser())
    this.getUser();
  }

  getUser(){
    this.userService.getUser(this.username).subscribe({
      next: res=>{
        this.user = res;
        this.updateForm.firstname = res.firstname;
        this.updateForm.lastname = res.lastname;
        this.updateForm.email = res.email;
        this.updateForm.country = res.country;
        this.updateForm.state = res.state;
        this.updateForm.address = res.address;
        this.updateForm.phone = res.phone;
      },error : err =>{
        console.log(err);
      }
    })
  }

  updateProfile(){
    this.messageService.add({
    severity: 'info',
    summary: 'Xác nhận',
    detail: 'Đang cập nhật thông tin...',
    life: 1000
  });
    const{firstname,lastname,email,country,state,address,phone} = this.updateForm;
    this.userService.updateProfile(this.username,firstname,lastname,email,country,state,address,phone).subscribe({
      
      next: res =>{
        this.getUser();
        this.messageService.add({
        severity: 'success',
        summary: 'Thành công',
        detail: 'Đã cập nhật thông tin thành công',
        life: 3000 // Hiển thị trong 3 giây
  });
      },error: err=>{
        console.log(err);
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Cập nhật thông tin thất bại',
          life: 3000 // Hiển thị trong 3 giây
        });
      }
    })
  }

  changePasswordFunc(){
    const{oldPassword,newPassword} = this.changePasswordForm;
    this.userService.changePassword(this.username,oldPassword,newPassword).subscribe({
      next: _res =>{
        this.getUser();
        console.log(_res);
        this.messageService.add({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Đã thay đổi mật khẩu thành công',
          life: 3000 // Hiển thị trong 3 giây
        });
      },error: err =>{
        console.log(err);
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Thay đổi mật khẩu thất bại',
          life: 3000 // Hiển thị trong 3 giây
        });
      }
    }) 
  }


  showChangePassword(){
    this.changePassword =true;
  }
  
}




