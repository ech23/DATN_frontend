import { HttpHeaders,HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../_class/user';

const USER_API = "http://localhost:8080/api/user/";
const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class UserService {


  constructor(private http: HttpClient) { }
  ngOnInit(): void {
          
  }

  getUser(username: string):Observable<any>{
    let params = new HttpParams();
    params = params.append('username',username);
    return this.http.get(USER_API,{params: params})
  }

  updateProfile(username: string,firstname: string,lastname:string,email:string,country:string,state:string,address: string,phone: string):Observable<any>{
    return this.http.put(USER_API +'update',{username,firstname,lastname,email,country,state,address,phone},httpOptions);
  }

  changePassword(username: string, oldPassword: string,newPassword: string):Observable<any>{
    return this.http.put(USER_API + 'password',{username,oldPassword,newPassword},httpOptions);
  }

  // Admin methods
  getAllUsers(): Observable<any> {
    return this.http.get(USER_API + 'all', httpOptions);
  }

  getUserById(id: number): Observable<any> {
    return this.http.get(USER_API + id, httpOptions);
  }

  createUser(user: User): Observable<any> {
    return this.http.post(USER_API + 'create', user, httpOptions);
  }

  updateUser(id: number, user: User): Observable<any> {
    return this.http.put(USER_API + 'update/' + id, user, httpOptions);
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(USER_API + 'delete/' + id, httpOptions);
  }

  toggleUserStatus(id: number, enabled: boolean): Observable<any> {
    return this.http.put(USER_API  + id + '/status', { enabled }, httpOptions);
  }

  updateUserRoles(id: number, roles: string[]): Observable<any> {
    return this.http.put(USER_API + 'update-roles/' + id, { roles }, httpOptions);
  }
}
