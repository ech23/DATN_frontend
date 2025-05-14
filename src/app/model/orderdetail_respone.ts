export interface OrderDetail {
  id?: number;
  orderId?: number;
  product?: {
    id?: number;
    name?: string;
    image?: string;
    price?: number;
  };
  price?: number;
  quantity?: number;
}