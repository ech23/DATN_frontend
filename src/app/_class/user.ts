export class User {
    id?: number;
    username!: string;
    email!: string;
    firstname?: string;
    lastname?: string;
    country?: string;
    state?: string;
    address?: string;
    phone?: string;
    roles: string[] = [];
    enabled: boolean = true;
    createdAt?: Date;
    updatedAt?: Date;
} 