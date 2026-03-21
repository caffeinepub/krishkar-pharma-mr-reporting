import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface ManagerProfile {
    managerRole: ManagerRole;
    employeeCode: string;
    name: string;
    headQuarter: string;
}
export interface MRProfile {
    employeeCode: string;
    assignedAreas: Array<AreaId>;
    headQuarter: string;
}
export interface GiftDistribution {
    id: GiftDistributionId;
    doctorId: DoctorId;
    date: string;
    distributedBy: Principal;
    giftArticleName: string;
    giftArticleId: GiftArticleId;
    quantity: bigint;
    doctorName: string;
}
export interface CRMDemand {
    id: CRMDemandId;
    status: CRMDemandStatus;
    doctorId: DoctorId;
    date: string;
    notes: string;
    raisedBy: Principal;
    doctorName: string;
    amount: bigint;
    raiserName: string;
    adminRemarks: string;
}
export interface DoctorInput {
    station: string;
    name: string;
    specialization: string;
    areaId: AreaId;
    qualification: string;
}
export interface SampleDemandOrder {
    id: bigint;
    status: DemandOrderStatus;
    mrPrincipal: Principal;
    date: string;
    productId: ProductId;
    requestedQty: bigint;
    notes: string;
}
export type CRMDemandId = bigint;
export interface ManagerAreaAssignment {
    areaIds: Array<AreaId>;
}
export interface Doctor {
    id: DoctorId;
    station: string;
    name: string;
    createdBy: Principal;
    specialization: string;
    areaId: AreaId;
    qualification: string;
}
export interface GiftDemandOrder {
    id: GiftDemandOrderId;
    status: GiftDemandOrderStatus;
    mrPrincipal: Principal;
    date: string;
    giftArticleName: string;
    notes: string;
    giftArticleId: GiftArticleId;
    quantity: bigint;
    adminRemarks: string;
}
export interface ExpenseEntry {
    daType: string;
    daAmount: bigint;
    date: string;
    kmTraveled: bigint;
    notes: string;
    workingArea: string;
    taAmount: bigint;
}
export interface SampleBalance {
    balance: bigint;
    totalDistributed: bigint;
    productId: ProductId;
    productName: string;
    totalAllotted: bigint;
}
export interface Chemist {
    id: ChemistId;
    contact: string;
    name: string;
    createdBy: Principal;
    address: string;
    areaId: AreaId;
}
export type GiftArticleId = bigint;
export interface SampleEntry {
    doctorId: DoctorId;
    date: string;
    productId: ProductId;
    quantity: bigint;
}
export type GiftDemandOrderId = bigint;
export type DoctorId = bigint;
export interface DetailingEntry {
    doctorId: DoctorId;
    productIds: Array<ProductId>;
    date: string;
}
export interface TADASettings {
    mrTaPerKm: bigint;
    mrDaHQ: bigint;
    mrDaOutStation: bigint;
    mrDaExStation: bigint;
    rsmTaPerKm: bigint;
    rsmDaHQ: bigint;
    rsmDaOutStation: bigint;
    rsmDaExStation: bigint;
    asmTaPerKm: bigint;
    asmDaHQ: bigint;
    asmDaOutStation: bigint;
    asmDaExStation: bigint;
}
export interface GiftArticle {
    id: GiftArticleId;
    name: string;
    description: string;
}
export type ChemistId = bigint;
export interface Headquarter {
    id: bigint;
    name: string;
    createdBy: Principal;
}
export interface LeaveEntry {
    status: LeaveStatus;
    days: bigint;
    toDate: string;
    fromDate: string;
    leaveType: LeaveType;
    reason: string;
}
export interface ChemistOrder {
    status: OrderStatus;
    scheme: string;
    date: string;
    productId: ProductId;
    chemistId: ChemistId;
    quantity: bigint;
}
export interface ActivitySummary {
    leaveBalance: Array<[LeaveType, bigint]>;
    samplesGiven: bigint;
    dailyExpense: bigint;
    doctorsVisited: bigint;
    chemistOrders: bigint;
}
export interface Area {
    id: AreaId;
    name: string;
    createdBy: Principal;
    headquarterId: bigint;
}
export type AreaId = bigint;
export type ProductId = bigint;
export type GiftDistributionId = bigint;
export interface SampleAllotment {
    id: bigint;
    date: string;
    productId: ProductId;
    targetPrincipal: Principal;
    allocatedBy: Principal;
    quantity: bigint;
}
export interface UserProfile {
    employeeCode: string;
    name: string;
    headQuarter: string;
}
export interface Product {
    id: ProductId;
    code: string;
    name: string;
    createdBy: Principal;
}
export enum DemandOrderStatus {
    Approved = "Approved",
    Rejected = "Rejected",
    Pending = "Pending"
}
export enum LeaveType {
    WithoutPayLeave = "WithoutPayLeave",
    CasualLeave = "CasualLeave",
    EarnedLeave = "EarnedLeave",
    SickLeave = "SickLeave",
    PrivilegeLeave = "PrivilegeLeave"
}
export enum ManagerRole {
    ASM = "ASM",
    RSM = "RSM"
}
export enum OrderStatus {
    pending = "pending",
    fulfilled = "fulfilled"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export type LeaveStatus = { Approved: null } | { Rejected: null } | { Pending: null };
export type CRMDemandStatus = { Approved: null } | { Rejected: null } | { Pending: null };
export type GiftDemandOrderStatus = { Approved: null } | { Rejected: null } | { Pending: null };
export interface backendInterface {
    addArea(name: string, headquarterId: bigint): Promise<AreaId>;
    addChemist(name: string, areaId: AreaId, address: string, contact: string): Promise<ChemistId>;
    addChemistOrder(chemistId: ChemistId, date: string, productId: ProductId, quantity: bigint, scheme: string): Promise<void>;
    addDoctor(name: string, qualification: string, station: string, specialization: string, areaId: AreaId): Promise<DoctorId>;
    addExpense(date: string, kmTraveled: bigint, daAmount: bigint, notes: string, taAmountOpt: bigint | null, workingArea: string, daType: string): Promise<void>;
    addGiftArticle(name: string, description: string): Promise<GiftArticleId>;
    addHeadquarter(name: string): Promise<bigint>;
    addProduct(name: string, code: string): Promise<ProductId>;
    adminAllotSamples(target: Principal, productId: ProductId, quantity: bigint, date: string): Promise<void>;
    adminAssignManagerAreas(target: Principal, areaIds: Array<AreaId>): Promise<void>;
    adminCreateOrUpdateMRProfile(mrPrincipal: Principal, employeeCode: string, headQuarter: string, assignedAreas: Array<AreaId>): Promise<void>;
    adminGetTADASettings(): Promise<TADASettings>;
    adminSaveManagerProfile(target: Principal, name: string, employeeCode: string, headQuarter: string, managerRole: ManagerRole): Promise<void>;
    adminSetTADASettings(settings: TADASettings): Promise<void>;
    applyLeave(leaveType: LeaveType, fromDate: string, toDate: string, days: bigint, reason: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    bulkAddDoctors(doctorsInput: Array<DoctorInput>): Promise<Array<DoctorId>>;
    createOrUpdateMRProfile(employeeCode: string, headQuarter: string, assignedAreas: Array<AreaId>): Promise<void>;
    deleteArea(id: AreaId): Promise<void>;
    deleteDoctor(id: DoctorId): Promise<void>;
    deleteGiftArticle(id: GiftArticleId): Promise<void>;
    deleteHeadquarter(id: bigint): Promise<void>;
    deleteMRProfile(mrPrincipal: Principal): Promise<void>;
    deleteManagerProfile(target: Principal): Promise<void>;
    deleteProduct(id: ProductId): Promise<void>;
    emergencyRestoreAdmin(): Promise<void>;
    getActivitySummary(date: string): Promise<ActivitySummary>;
    getAllAreas(): Promise<Array<Area>>;
    getAllCRMDemands(): Promise<Array<CRMDemand>>;
    getAllChemists(): Promise<Array<Chemist>>;
    getAllDoctors(): Promise<Array<Doctor>>;
    getAllGiftArticles(): Promise<Array<GiftArticle>>;
    getAllGiftDemandOrders(): Promise<Array<GiftDemandOrder>>;
    getAllGiftDistributions(): Promise<Array<GiftDistribution>>;
    getAllHeadquarters(): Promise<Array<Headquarter>>;
    getAllLeaveApplications(): Promise<Array<[Principal, Array<LeaveEntry>]>>;
    getAllMRProfiles(): Promise<Array<[Principal, MRProfile]>>;
    getAllManagerProfiles(): Promise<Array<[Principal, ManagerProfile]>>;
    getAllPendingUsers(): Promise<Array<Principal>>;
    getAllProducts(): Promise<Array<Product>>;
    getAllSampleAllotments(): Promise<Array<SampleAllotment>>;
    getAllSampleDemandOrders(): Promise<Array<SampleDemandOrder>>;
    getAllUserProfiles(): Promise<Array<[Principal, UserProfile]>>;
    getCallerRoleInfo(): Promise<{
        managerRole?: string;
        baseRole: string;
    }>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getChemistOrders(): Promise<Array<ChemistOrder>>;
    getChemistsByArea(areaId: AreaId): Promise<Array<Chemist>>;
    getDetailingEntries(): Promise<Array<DetailingEntry>>;
    getDoctorsByArea(areaId: AreaId): Promise<Array<Doctor>>;
    getExpenseEntries(): Promise<Array<ExpenseEntry>>;
    getLeaveHistory(): Promise<Array<LeaveEntry>>;
    getMRProfile(): Promise<MRProfile>;
    getManagerAreas(target: Principal): Promise<ManagerAreaAssignment>;
    getManagerProfile(): Promise<ManagerProfile | null>;
    getMyAllotments(): Promise<Array<SampleAllotment>>;
    getMyCRMDemands(): Promise<Array<CRMDemand>>;
    getMyGiftDemandOrders(): Promise<Array<GiftDemandOrder>>;
    getMyGiftDistributions(): Promise<Array<GiftDistribution>>;
    getMySampleBalance(): Promise<Array<SampleBalance>>;
    getMySampleDemandOrders(): Promise<Array<SampleDemandOrder>>;
    getSampleEntries(): Promise<Array<SampleEntry>>;
    getTeamDetailingEntries(): Promise<Array<[Principal, Array<DetailingEntry>]>>;
    getTeamExpenseEntries(): Promise<Array<[Principal, Array<ExpenseEntry>]>>;
    getTeamLeaveApplications(): Promise<Array<[Principal, Array<LeaveEntry>]>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isAdminInitialized(): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    logDetailing(doctorId: DoctorId, date: string, productIds: Array<ProductId>): Promise<void>;
    logGiftDistribution(doctorId: DoctorId, doctorName: string, giftArticleId: GiftArticleId, giftArticleName: string, quantity: bigint, date: string): Promise<void>;
    logSample(doctorId: DoctorId, date: string, productId: ProductId, quantity: bigint): Promise<void>;
    raiseCRMDemand(doctorId: DoctorId, doctorName: string, amount: bigint, notes: string, date: string, raiserName: string): Promise<void>;
    raiseGiftDemandOrder(giftArticleId: GiftArticleId, giftArticleName: string, quantity: bigint, notes: string, date: string): Promise<void>;
    raiseSampleDemandOrder(productId: ProductId, requestedQty: bigint, date: string, notes: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveManagerProfile(name: string, employeeCode: string, headQuarter: string, managerRole: ManagerRole): Promise<void>;
    updateArea(id: AreaId, name: string, headquarterId: bigint): Promise<void>;
    updateCRMDemandStatus(demandId: CRMDemandId, newStatus: CRMDemandStatus, adminRemarks: string): Promise<void>;
    updateDoctor(id: DoctorId, name: string, qualification: string, station: string, specialization: string, areaId: AreaId): Promise<void>;
    updateGiftArticle(id: GiftArticleId, name: string, description: string): Promise<void>;
    updateGiftDemandOrderStatus(orderId: GiftDemandOrderId, newStatus: GiftDemandOrderStatus, adminRemarks: string): Promise<void>;
    updateHeadquarter(id: bigint, name: string): Promise<void>;
    updateLeaveStatus(mrPrincipal: Principal, leaveIndex: bigint, newStatus: LeaveStatus): Promise<void>;
    updateLeaveStatusByManager(mrPrincipal: Principal, leaveIndex: bigint, newStatus: LeaveStatus): Promise<void>;
    updateProduct(id: ProductId, name: string, code: string): Promise<void>;
    updateSampleDemandOrderStatus(orderId: bigint, newStatus: DemandOrderStatus): Promise<void>;
}
