import{ OrderDetail } from './orderdetail_respone';
export interface Order {
  id?: number;
  firstname?: string;
  lastname?: string;
  country?: string;
  address?: string;
  town?: string;
  state?: string | null;
  postCode?: string | number | null;
  email?: string;
  phone?: string;
  note?: string | null;
  totalPrice?: number;
  paymentStatus?: string;
  orderStatus?: string;
  paymentMethod?: string;
  orderDate?: Date | string | null;
  username?: string;
  orderDetails?: OrderDetail[];
}