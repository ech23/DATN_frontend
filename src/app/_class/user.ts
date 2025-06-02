export interface User {
  id?: number;
  username: string;
  email: string;
  password?: string;
  firstname?: string;
  lastname?: string;
  country?: string;
  state?: string;
  address?: string;
  phone?: string;
  
  roles?: string[];
}