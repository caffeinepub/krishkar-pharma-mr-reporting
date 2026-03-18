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
export interface Doctor {
    id: DoctorId;
    station: string;
    name: string;
    createdBy: Principal;
    specialization: string;
    areaId: AreaId;
    qualification: string;
}
export interface ExpenseEntry {
    daAmount: bigint;
    date: string;
    kmTraveled: bigint;
    notes: string;
    taAmount: bigint;
}
export interface Chemist {
    id: ChemistId;
    contact: string;
    name: string;
    createdBy: Principal;
    address: string;
    areaId: AreaId;
}
export interface SampleBalance {
    balance: bigint;
    totalDistributed: bigint;
    productId: ProductId;
    productName: string;
    totalAllotted: bigint;
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
export interface backendInterface {
    addArea(name: string, headquarterId: bigint): Promise<AreaId>;
    addChemist(name: string, areaId: AreaId, address: string, contact: string): Promise<ChemistId>;
    addChemistOrder(chemistId: ChemistId, date: string, productId: ProductId, quantity: bigint, scheme: string): Promise<void>;
    addDoctor(name: string, qualification: string, station: string, specialization: string, areaId: AreaId): Promise<DoctorId>;
    addExpense(date: string, kmTraveled: bigint, daAmount: bigint, notes: string, taAmountOpt: bigint | null): Promise<void>;
    addHeadquarter(name: string): Promise<bigint>;
    addProduct(name: string, code: string): Promise<ProductId>;
    adminAllotSamples(target: Principal, productId: ProductId, quantity: bigint, date: string): Promise<void>;
    adminCreateOrUpdateMRProfile(mrPrincipal: Principal, employeeCode: string, headQuarter: string, assignedAreas: Array<AreaId>): Promise<void>;
    adminSaveManagerProfile(target: Principal, name: string, employeeCode: string, headQuarter: string, managerRole: ManagerRole): Promise<void>;
    applyLeave(leaveType: LeaveType, fromDate: string, toDate: string, days: bigint, reason: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    bulkAddDoctors(doctorsInput: Array<DoctorInput>): Promise<Array<DoctorId>>;
    createOrUpdateMRProfile(employeeCode: string, headQuarter: string, assignedAreas: Array<AreaId>): Promise<void>;
    deleteDoctor(id: DoctorId): Promise<void>;
    deleteHeadquarter(id: bigint): Promise<void>;
    deleteMRProfile(mrPrincipal: Principal): Promise<void>;
    deleteManagerProfile(target: Principal): Promise<void>;
    deleteProduct(id: ProductId): Promise<void>;
    getActivitySummary(date: string): Promise<ActivitySummary>;
    getAllAreas(): Promise<Array<Area>>;
    getAllChemists(): Promise<Array<Chemist>>;
    getAllDoctors(): Promise<Array<Doctor>>;
    getAllHeadquarters(): Promise<Array<Headquarter>>;
    getAllLeaveApplications(): Promise<Array<[Principal, Array<LeaveEntry>]>>;
    getAllMRProfiles(): Promise<Array<[Principal, MRProfile]>>;
    getAllManagerProfiles(): Promise<Array<[Principal, ManagerProfile]>>;
    getAllPendingUsers(): Promise<Array<Principal>>;
    getAllProducts(): Promise<Array<Product>>;
    getAllSampleAllotments(): Promise<Array<SampleAllotment>>;
    getAllSampleDemandOrders(): Promise<Array<SampleDemandOrder>>;
    getAllUserProfiles(): Promise<Array<[Principal, UserProfile]>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getChemistOrders(): Promise<Array<ChemistOrder>>;
    getChemistsByArea(areaId: AreaId): Promise<Array<Chemist>>;
    getDetailingEntries(): Promise<Array<DetailingEntry>>;
    getDoctorsByArea(areaId: AreaId): Promise<Array<Doctor>>;
    getExpenseEntries(): Promise<Array<ExpenseEntry>>;
    getLeaveHistory(): Promise<Array<LeaveEntry>>;
    getMRProfile(): Promise<MRProfile>;
    getManagerProfile(): Promise<ManagerProfile | null>;
    getMyAllotments(): Promise<Array<SampleAllotment>>;
    getMySampleBalance(): Promise<Array<SampleBalance>>;
    getMySampleDemandOrders(): Promise<Array<SampleDemandOrder>>;
    getSampleEntries(): Promise<Array<SampleEntry>>;
    getTeamDetailingEntries(): Promise<Array<[Principal, Array<DetailingEntry>]>>;
    getTeamExpenseEntries(): Promise<Array<[Principal, Array<ExpenseEntry>]>>;
    getTeamLeaveApplications(): Promise<Array<[Principal, Array<LeaveEntry>]>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    logDetailing(doctorId: DoctorId, date: string, productIds: Array<ProductId>): Promise<void>;
    logSample(doctorId: DoctorId, date: string, productId: ProductId, quantity: bigint): Promise<void>;
    raiseSampleDemandOrder(productId: ProductId, requestedQty: bigint, date: string, notes: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveManagerProfile(name: string, employeeCode: string, headQuarter: string, managerRole: ManagerRole): Promise<void>;
    updateArea(id: AreaId, name: string, headquarterId: bigint): Promise<void>;
    deleteArea(id: AreaId): Promise<void>;
    updateDoctor(id: DoctorId, name: string, qualification: string, station: string, specialization: string, areaId: AreaId): Promise<void>;
    updateHeadquarter(id: bigint, name: string): Promise<void>;
    updateLeaveStatus(mrPrincipal: Principal, leaveIndex: bigint, newStatus: LeaveStatus): Promise<void>;
    updateLeaveStatusByManager(mrPrincipal: Principal, leaveIndex: bigint, newStatus: LeaveStatus): Promise<void>;
    updateProduct(id: ProductId, name: string, code: string): Promise<void>;
    updateSampleDemandOrderStatus(orderId: bigint, newStatus: DemandOrderStatus): Promise<void>;
}
