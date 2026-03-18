import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface MRProfile {
    employeeCode: string;
    assignedAreas: Array<AreaId>;
    headQuarter: string;
}
export interface SampleEntry {
    doctorId: DoctorId;
    date: string;
    productId: ProductId;
    quantity: bigint;
}
export type DoctorId = bigint;
export interface DetailingEntry {
    doctorId: DoctorId;
    productIds: Array<ProductId>;
    date: string;
}
export type ChemistId = bigint;
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
export type ProductId = bigint;
export interface ExpenseEntry {
    daAmount: bigint;
    date: string;
    kmTraveled: bigint;
    notes: string;
    taAmount: bigint;
}
export type AreaId = bigint;
export interface Chemist {
    id: ChemistId;
    contact: string;
    name: string;
    createdBy: Principal;
    address: string;
    areaId: AreaId;
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
export enum LeaveStatus {
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
export enum OrderStatus {
    pending = "pending",
    fulfilled = "fulfilled"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addArea(name: string): Promise<AreaId>;
    addChemist(name: string, areaId: AreaId, address: string, contact: string): Promise<ChemistId>;
    addChemistOrder(chemistId: ChemistId, date: string, productId: ProductId, quantity: bigint, scheme: string): Promise<void>;
    addDoctor(name: string, qualification: string, station: string, specialization: string, areaId: AreaId): Promise<DoctorId>;
    addExpense(date: string, kmTraveled: bigint, daAmount: bigint, notes: string, taAmountOpt: bigint | null): Promise<void>;
    addProduct(name: string, code: string): Promise<ProductId>;
    applyLeave(leaveType: LeaveType, fromDate: string, toDate: string, days: bigint, reason: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createOrUpdateMRProfile(employeeCode: string, headQuarter: string, assignedAreas: Array<AreaId>): Promise<void>;
    getActivitySummary(date: string): Promise<ActivitySummary>;
    getAllAreas(): Promise<Array<Area>>;
    getAllChemists(): Promise<Array<Chemist>>;
    getAllDoctors(): Promise<Array<Doctor>>;
    getAllLeaveApplications(): Promise<Array<[Principal, Array<LeaveEntry>]>>;
    getAllMRProfiles(): Promise<Array<[Principal, MRProfile]>>;
    getAllProducts(): Promise<Array<Product>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getChemistOrders(): Promise<Array<ChemistOrder>>;
    getChemistsByArea(areaId: AreaId): Promise<Array<Chemist>>;
    getDetailingEntries(): Promise<Array<DetailingEntry>>;
    getDoctorsByArea(areaId: AreaId): Promise<Array<Doctor>>;
    getExpenseEntries(): Promise<Array<ExpenseEntry>>;
    getLeaveHistory(): Promise<Array<LeaveEntry>>;
    getMRProfile(): Promise<MRProfile>;
    getSampleEntries(): Promise<Array<SampleEntry>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    logDetailing(doctorId: DoctorId, date: string, productIds: Array<ProductId>): Promise<void>;
    logSample(doctorId: DoctorId, date: string, productId: ProductId, quantity: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateLeaveStatus(mrPrincipal: Principal, leaveIndex: bigint, newStatus: LeaveStatus): Promise<void>;
}
