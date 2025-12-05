import type {
  Deal,
  Vehicle,
  Contact,
  Note,
  AiInsight,
  User,
  Organization,
  DealContact,
  DealStatus,
  AiRecommendation,
} from '@prisma/client';

// Extended types with relations
export type DealWithRelations = Deal & {
  vehicle: Vehicle;
  dealContacts?: (DealContact & { contact: Contact })[];
  notes?: (Note & { author: User })[];
  aiInsights?: AiInsight[];
};

export type VehicleWithDeals = Vehicle & {
  deals: Deal[];
};

export type UserWithOrg = User & {
  organization: Organization;
};

// API Request/Response types
export interface CreateDealInput {
  sourceUrl?: string;
  sourceSite?: string;
  vehicle: {
    year: number;
    make: string;
    model: string;
    variant?: string;
    odometer?: number;
    transmission?: string;
    fuelType?: string;
    bodyType?: string;
    colour?: string;
    imageUrls?: string[];
  };
  askPrice?: number;
}

export interface UpdateDealInput {
  status?: DealStatus;
  askPrice?: number;
  negotiatedPrice?: number;
  actualPurchasePrice?: number;
  actualSellPrice?: number;
  reconditioningCost?: number;
  otherCosts?: number;
}

export interface AiValuationResult {
  fairValueLow: number;
  fairValueHigh: number;
  recommendedBuyPrice: number;
  targetSellPrice: number;
  estimatedMargin: number;
  estimatedDaysToSell: number;
  riskScore: number;
  recommendation: AiRecommendation;
  confidence: number;
  reasoning: string;
}

export interface AiDealSummary {
  summary: string;
  pros: string[];
  cons: string[];
  recommendation: AiRecommendation;
  suggestedMaxBuyPrice: number;
  probabilityOfTargetMargin: number;
}

export interface AiMessageTemplate {
  subject?: string;
  body: string;
  tone: string;
  context: string;
}

// Dashboard stats
export interface DashboardStats {
  totalDealsReviewed: number;
  totalDealsBought: number;
  totalDealsSold: number;
  winRate: number;
  averageGrossMargin: number;
  averageDaysInStock: number;
  totalProfit: number;
  activeDeals: number;
}

// Pipeline column type
export interface PipelineColumn {
  id: DealStatus;
  title: string;
  deals: DealWithRelations[];
}

// Filters
export interface DealFilters {
  status?: DealStatus[];
  recommendation?: AiRecommendation[];
  minPrice?: number;
  maxPrice?: number;
  make?: string[];
  yearFrom?: number;
  yearTo?: number;
  sortBy?: 'createdAt' | 'estimatedMargin' | 'askPrice' | 'riskScore';
  sortOrder?: 'asc' | 'desc';
}

// Session user
export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  organizationId: string;
  role: string;
}
