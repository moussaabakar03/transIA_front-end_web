export interface LoginForm {
  username: string;
  password: string;
}

export interface Role {
  id: string;
  label: string;
  description: string;
}

export interface Profile {
  id: string;
  phone_number: string;
  country_code: string;
  birthday: string | null;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_active: boolean;
  role: Role;
  profile: Profile;
}

// export interface LoginResponse {
//   access: string;
//   refresh: string;
//   user: User;
// }

export interface LoginResponse {
  accessToken: string;
  token: string; // Doublon souvent présent dans Spring
  username: string;
  fullName: string;
  id: string;
  roles: string[];
  tokenType: string;
}


