export type VehicleStatus = 'Comprado' | 'En preparación' | 'Publicado' | 'Reservado' | 'Vendido';
export type CustomerStatus = 'Nuevo' | 'En seguimiento' | 'Negociando' | 'Ganado' | 'Perdido';

export interface Vehicle {
  id: string;
  userId?: string;
  purchaseDate: string;
  brand: string;
  model: string;
  year: number;
  vin: string;
  supplier: string;
  purchasePrice: number;
  status: VehicleStatus;
  publicationPrice: number;
  salePrice: number;
  receivedAsTradeInForSaleId?: string;
  receivedFromCustomerId?: string;
  documentation?: string;
  estimatedCosts?: number;
}

export interface Expense {
  id: string;
  userId?: string;
  vehicleId: string;
  type: string;
  description: string;
  amount: number;
  supplier: string;
  date: string;
}

export interface Interaction {
  id: string;
  date: string;
  type: string;
  vehicleOfInterest: string;
  note: string;
  nextFollowUp: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  source: string;
  firstContactDate: string;
  status: CustomerStatus;
  interactions: Interaction[];
  assignedTo?: string;
}

export interface Sale {
  id: string;
  userId?: string;
  date: string;
  vehicleId: string;
  customerId: string;
  salePrice: number;
  downPayment: number;
  pendingBalance: number;
  paymentMethod: string;
  commission: number;
  netProfit: number;
  assignedTo?: string;
  hasTradeIn?: boolean;
  tradeInBrand?: string;
  tradeInModel?: string;
  tradeInYear?: number;
  tradeInVin?: string;
  tradeInValuation?: number;
  tradeInEstimatedCosts?: number;
  tradeInDocumentation?: string;
  tradeInStatus?: VehicleStatus;
  tradeInVehicleId?: string;
}

export interface Transaction {
  id: string;
  date: string;
  type: 'Ingreso' | 'Egreso';
  category: string;
  amount: number;
  paymentMethod: string;
  vehicleId?: string;
}

export interface Account {
  id: string;
  type: 'Cobrar' | 'Pagar';
  entity: string;
  amount: number;
  dueDate: string;
  status: 'Pendiente' | 'Pagado';
}

export interface User {
  id: string;
  email: string;
  role: 'Administrador' | 'Vendedor';
  name: string;
}
