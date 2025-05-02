export class Order {
    id?: string;
    firstname !: string;
    lastname !:string;
    country !:string;
    address!:string;
    town!:string;
    state!:string;
    postCode !: number;
    email!:string;
    phone!:string;
    note!:string;
    totalPrice !: number;
    username?: string;
    orderDate?: Date;
    orderStatus?: string;
    paymentMethod?: string;
    paymentStatus?: string;
    orderDetails?: any[];
    createdAt?: Date;
}
