export interface User {
    id?: number;
    fullName: string;
    username: string;
    password: string;
    roles: string; 
    enable: boolean;
    publicId: string; 
}