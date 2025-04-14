import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { UserService } from '../../../services/user.service';
import { RoleService } from '../../../services/role.service';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css'],
  providers: [MessageService]
})
export class UserComponent implements OnInit {
  users: any[] = [];
  roles: any[] = [];
  userDialog: boolean = false;
  deleteUserDialog: boolean = false;
  userForm: FormGroup;
  selectedUser: any = null;
  loading: boolean = false;
  submitted: boolean = false;

  constructor(
    private userService: UserService,
    private roleService: RoleService,
    private formBuilder: FormBuilder,
    private messageService: MessageService
  ) {
    this.userForm = this.formBuilder.group({
      id: [null],
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      country: [''],
      state: [''],
      address: [''],
      phone: [''],
      roles: [[], Validators.required],
      enabled: [true]
    });
  }

  ngOnInit(): void {
    this.loadUsers();
    this.loadRoles();
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.loading = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load users'
        });
        this.loading = false;
        console.error('Error loading users:', error);
      }
    });
  }

  loadRoles(): void {
    this.roleService.getRoles().subscribe({
      next: (data) => {
        this.roles = data;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load roles'
        });
        console.error('Error loading roles:', error);
      }
    });
  }

  openNew(): void {
    this.selectedUser = null;
    this.userForm.reset({ enabled: true });
    this.submitted = false;
    this.userDialog = true;
  }

  editUser(user: any): void {
    this.selectedUser = user;
    this.userForm.patchValue({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      country: user.country,
      state: user.state,
      address: user.address,
      phone: user.phone,
      roles: user.roles.map((role: any) => role.id),
      enabled: user.enabled
    });
    this.userDialog = true;
  }

  deleteUser(user: any): void {
    this.selectedUser = user;
    this.deleteUserDialog = true;
  }

  confirmDelete(): void {
    if (this.selectedUser) {
      this.userService.deleteUser(this.selectedUser.id).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'User deleted successfully'
          });
          this.loadUsers();
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to delete user'
          });
          console.error('Error deleting user:', error);
        }
      });
    }
    this.deleteUserDialog = false;
    this.selectedUser = null;
  }

  saveUser(): void {
    this.submitted = true;

    if (this.userForm.invalid) {
      return;
    }

    const userData = this.userForm.value;
    
    if (userData.id) {
      // Update existing user
      this.userService.updateUser(userData.id, userData).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'User updated successfully'
          });
          this.loadUsers();
          this.userDialog = false;
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update user'
          });
          console.error('Error updating user:', error);
        }
      });
    } else {
      // Create new user
      this.userService.createUser(userData).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'User created successfully'
          });
          this.loadUsers();
          this.userDialog = false;
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to create user'
          });
          console.error('Error creating user:', error);
        }
      });
    }
  }

  hideDialog(): void {
    this.userDialog = false;
    this.submitted = false;
  }

  get f() { return this.userForm.controls; }
} 