export type PlatformType = 'douyin' | 'xiaohongshu' | 'kuaishou' | 'bilibili'
export type ProjectCategory = 'filler' | 'laser' | 'skin' | 'surgery' | 'other'
export type PricingModel = 'fixed' | 'commission' | 'hybrid'
export type VisitStatus = 'scheduled' | 'filming' | 'published' | 'completed'
export type LeadType = 'coupon' | 'consultation' | 'visit' | 'transaction'
export type LeadSource = 'group_buy' | 'private_domain' | 'walk_in'
export type MatchType = 'phone' | 'coupon' | 'remark' | 'manual'
export type Confidence = 'high' | 'medium' | 'low'
export type CommissionStatus = 'draft' | 'submitted' | 'reviewed' | 'approved' | 'rejected' | 'paid'
export type DeductionType = 'refund' | 'no_deal' | 'duplicate'
export type KOLStatus = 'active' | 'inactive'
export type UserRole = 'marketer' | 'supervisor' | 'finance' | 'admin'

export interface CommissionTier {
  id: string
  category: ProjectCategory
  rate: number
  baseAmount?: number
}

export interface KOLPlatform {
  type: PlatformType
  account: string
  followers: number
}

export interface KOL {
  id: string
  name: string
  avatar: string
  platforms: KOLPlatform[]
  phone: string
  stores: string[]
  commissionTiers: CommissionTier[]
  status: KOLStatus
  createdAt: string
}

export interface VideoInfo {
  id: string
  url: string
  platform: string
  publishedAt: string
  retentionDays: number
}

export interface StoreVisit {
  id: string
  kolId: string
  storeId: string
  visitDate: string
  projectTypes: string[]
  pricingModel: PricingModel
  fixedPrice?: number
  commissionRate?: number
  videos: VideoInfo[]
  status: VisitStatus
  remark?: string
}

export interface Store {
  id: string
  name: string
  region: string
  address: string
  status: 'active' | 'inactive'
}

export interface LeadRecord {
  id: string
  type: LeadType
  phone: string
  couponCode?: string
  storeId: string
  time: string
  project?: string
  amount?: number
  doctor?: string
  remark?: string
  source: LeadSource
  isMatched: boolean
}

export interface MatchResult {
  id: string
  leadId: string
  kolId: string
  storeVisitId: string
  matchType: MatchType
  confidence: Confidence
  transactionAmount: number
  projectCategory: ProjectCategory
  isRefunded: boolean
  isDuplicate: boolean
  storeId: string
}

export interface CommissionItem {
  id: string
  matchResultId: string
  projectCategory: ProjectCategory
  rate: number
  baseAmount: number
  commissionAmount: number
}

export interface DeductionItem {
  id: string
  type: DeductionType
  amount: number
  description: string
  relatedMatchId?: string
}

export interface CommissionCalc {
  id: string
  kolId: string
  storeVisitId: string
  period: string
  items: CommissionItem[]
  deductions: DeductionItem[]
  totalAmount: number
  status: CommissionStatus
  approver?: string
  approvedAt?: string
  paidAt?: string
  createdAt: string
  isDisputed: boolean
  disputeReason?: string
  recalcAt?: string
}

export interface User {
  id: string
  name: string
  role: UserRole
  avatar: string
}

export const CATEGORY_LABELS: Record<ProjectCategory, string> = {
  filler: '玻尿酸',
  laser: '光电',
  skin: '皮肤管理',
  surgery: '手术类',
  other: '其他',
}

export const PLATFORM_LABELS: Record<PlatformType, string> = {
  douyin: '抖音',
  xiaohongshu: '小红书',
  kuaishou: '快手',
  bilibili: 'B站',
}

export const LEAD_TYPE_LABELS: Record<LeadType, string> = {
  coupon: '团购核销',
  consultation: '咨询预约',
  visit: '面诊到院',
  transaction: '项目成交',
}

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  group_buy: '团购',
  private_domain: '私域',
  walk_in: '到院',
}

export const MATCH_TYPE_LABELS: Record<MatchType, string> = {
  phone: '手机号',
  coupon: '券码',
  remark: '客服备注',
  manual: '手动匹配',
}

export const COMMISSION_STATUS_LABELS: Record<CommissionStatus, string> = {
  draft: '草稿',
  submitted: '已提交',
  reviewed: '已复核',
  approved: '已终审',
  rejected: '已驳回',
  paid: '已打款',
}

export const DEDUCTION_TYPE_LABELS: Record<DeductionType, string> = {
  refund: '退款扣减',
  no_deal: '未成单扣减',
  duplicate: '跨门店重复扣减',
}

export const VISIT_STATUS_LABELS: Record<VisitStatus, string> = {
  scheduled: '已排期',
  filming: '拍摄中',
  published: '已发布',
  completed: '已完成',
}

export const PRICING_MODEL_LABELS: Record<PricingModel, string> = {
  fixed: '单次报价',
  commission: '按成交提成',
  hybrid: '混合报价',
}
