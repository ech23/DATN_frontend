import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { User } from 'src/app/_class/user';
import { UserService } from 'src/app/_service/user.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  providers: [MessageService]
})
export class UserComponent implements OnInit {
  users: User[] = [];
  user: User = this.initNewUser();
  userForm: FormGroup;
  selectedUser: User | null = null;
  userDialog: boolean = false;
  deleteUserDialog: boolean = false;
  submitted: boolean = false;
  loading: boolean = false;

  availableRoles: any[] = [
    { label: 'Admin', value: 'ROLE_ADMIN' },
    { label: 'User', value: 'ROLE_USER' },
    { label: 'Moderator', value: 'ROLE_MOD' }
  ];

  constructor(
    private userService: UserService,
    private messageService: MessageService,
    private fb: FormBuilder
  ) {
    this.userForm = this.createUserForm();
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  createUserForm(): FormGroup {
    return this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      firstname: [''],
      lastname: [''],
      phone: [''],
      country: [''],
      state: [''],
      address: [''],
      roles: [['ROLE_USER'], Validators.required]
    });
  }

  initNewUser(): User {
    return {
      username: '',
      email: '',
      password: '',
      firstname: '',
      lastname: '',
      phone: '',
      country: '',
      state: '',
      address: '',
      
      roles: ['ROLE_USER']
    };
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getAllUsers().subscribe({
      next: (response) => {
        console.log("DATA:", response);
        const usersArray = response?.content ?? [];
        this.users = usersArray.map((user: any) => ({
          ...user,
          roles: (user.roles ?? []).map((role: any) => role.name || role)
        }));
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load users'
        });
        this.loading = false;
      }
    });
  }

  openNew(): void {
    this.user = this.initNewUser();
    this.resetForm();
    this.userDialog = true;
  }

  editUser(user: User): void {
    if (!user.id) return;
    
    this.loading = true;
    this.userService.getUserById(user.id).subscribe({
      next: (response) => {
        this.user = {
          ...response,
          roles: (response.roles ?? []).map((role: any) => role.name || role)
        };
        
        // Populate form with user data
        this.userForm.patchValue({
          username: this.user.username,
          email: this.user.email,
          firstname: this.user.firstname || '',
          lastname: this.user.lastname || '',
          phone: this.user.phone || '',
          country: this.user.country || '',
          state: this.user.state || '',
          address: this.user.address || '',
          roles: this.user.roles || ['ROLE_USER']
        });

        // Remove password validation for edit mode
        this.userForm.get('password')?.clearValidators();
        this.userForm.get('password')?.updateValueAndValidity();
        
        this.submitted = false;
        this.userDialog = true;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading user details:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load user details'
        });
        this.loading = false;
      }
    });
  }

  deleteUser(user: User): void {
    this.selectedUser = user;
    this.deleteUserDialog = true;
  }

  confirmDelete(): void {
    if (!this.selectedUser) return;

    this.userService.deleteUser(this.selectedUser.id!).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.id !== this.selectedUser!.id);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'User deleted successfully'
        });
        this.deleteUserDialog = false;
        this.selectedUser = null;
      },
      error: (error) => {
        console.error('Error deleting user:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete user'
        });
      }
    });
  }

  hideDialog(): void {
    this.userDialog = false;
    this.resetForm();
  }

  saveUser(): void {
    this.submitted = true;

    // Mark all form controls as touched to show validation errors
    this.markFormGroupTouched(this.userForm);

    if (this.userForm.invalid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please fill in all required fields correctly'
      });
      return;
    }

    const formData = this.userForm.value;
    
    // Prepare user data based on backend API requirements
    const userData: {
      username: any;
      email: any;
      firstname: any;
      lastname: any;
      phone: any;
      country: any;
      state: any;
      address: any;
      role: any;
     
      password?: any;
      id?: any;
    } = {
      username: formData.username,
      email: formData.email,
      firstname: formData.firstname,
      lastname: formData.lastname,
      phone: formData.phone,
      country: formData.country,
      state: formData.state,
      address: formData.address,
      role: formData.roles, // Backend expects 'role' not 'roles'
     
    };

    // Add password only for new users
    if (!this.user.id && formData.password) {
      userData['password'] = formData.password;
    }

    // Add id for update requests
    if (this.user.id) {
      userData['id'] = this.user.id;
    }

    if (this.user.id) {
      // Update existing user
      this.userService.updateUser(this.user.id, userData).subscribe({
        next: (response) => {
          const updatedUser = {
            ...response,
            roles: (response.roles ?? []).map((role: any) => role.name || role)
          };
          
          const index = this.users.findIndex(u => u.id === this.user.id);
          if (index !== -1) {
            this.users[index] = updatedUser;
          }
          
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'User updated successfully'
          });
          this.userDialog = false;
          this.resetForm();
        },
        error: (error) => {
          console.error('Error updating user:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Failed to update user'
          });
        }
      });
    } else {
      // Create new user
      this.userService.createUser(userData).subscribe({
        next: (response) => {
          const newUser = {
            ...response,
            roles: (response.roles ?? []).map((role: any) => role.name || role)
          };
          
          this.users.push(newUser);
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'User created successfully'
          });
          this.userDialog = false;
          this.resetForm();
        },
        error: (error) => {
          if (error.status === 409) {
            alert("Username or email already exists.");
          } else {
            alert("Error creating user: " + error.message);
          }
          console.error('Error creating user:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Failed to create user'
          });
        }
      });
    }
  }

  resetForm(): void {
    this.userForm.reset({
      roles: ['ROLE_USER']
    });
    
    // Reset password validation for create mode
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.userForm.get('password')?.updateValueAndValidity();
    
    this.submitted = false;
    this.user = this.initNewUser();
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  toggleUserStatus(user: User): void {
    // Create separate API call for toggling user status if available
    // Since 'enabled' field is not supported in UpdateProfileRequest,
    // you may need a different endpoint for this functionality
    
    const statusData = {
      id: user.id
      
    };

    // Check if you have a separate endpoint for user status toggle
    // this.userService.toggleUserStatus(user.id!, statusData).subscribe({
    
    // For now, we'll show a message that this feature needs backend support
    this.messageService.add({
      severity: 'warn',
      summary: 'Feature Not Available',
      detail: 'User status toggle requires separate API endpoint'
    });
    
    /* Alternative: Update user without enabled field
    const updatedUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
      phone: user.phone,
      country: user.country,
      state: user.state,
      address: user.address,
      role: user.roles
    };
    
    this.userService.updateUser(user.id!, updatedUser).subscribe({
      next: (response) => {
        const index = this.users.findIndex(u => u.id === user.id);
        if (index !== -1) {
          this.users[index] = {
            ...response,
            roles: (response.roles ?? []).map((role: any) => role.name || role)
          };
        }
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'User updated successfully'
        });
      },
      error: (error) => {
        console.error('Error updating user:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to update user'
        });
      }
    });
    */
  }
}