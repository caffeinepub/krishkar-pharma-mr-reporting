import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import List "mo:core/List";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Type Definitions
  type UserProfile = {
    name : Text;
    employeeCode : Text;
    headQuarter : Text;
  };

  type MRProfile = {
    employeeCode : Text;
    headQuarter : Text;
    assignedAreas : [AreaId];
  };

  type AreaId = Nat;
  type Area = {
    id : AreaId;
    name : Text;
    createdBy : Principal;
  };

  type DoctorId = Nat;
  type Doctor = {
    id : DoctorId;
    name : Text;
    qualification : Text;
    station : Text;
    specialization : Text;
    areaId : AreaId;
    createdBy : Principal;
  };

  type ProductId = Nat;
  type Product = {
    id : ProductId;
    name : Text;
    code : Text;
    createdBy : Principal;
  };

  type ChemistId = Nat;
  type Chemist = {
    id : ChemistId;
    name : Text;
    areaId : AreaId;
    address : Text;
    contact : Text;
    createdBy : Principal;
  };

  type DetailingEntry = {
    doctorId : DoctorId;
    date : Text;
    productIds : [ProductId];
  };

  type SampleEntry = {
    doctorId : DoctorId;
    date : Text;
    productId : ProductId;
    quantity : Nat;
  };

  type OrderStatus = { #pending; #fulfilled };

  type ChemistOrder = {
    chemistId : ChemistId;
    date : Text;
    productId : ProductId;
    quantity : Nat;
    scheme : Text;
    status : OrderStatus;
  };

  type ExpenseEntry = {
    date : Text;
    kmTraveled : Nat;
    taAmount : Nat;
    daAmount : Nat;
    notes : Text;
  };

  type LeaveType = {
    #CasualLeave;
    #SickLeave;
    #EarnedLeave;
    #PrivilegeLeave;
    #WithoutPayLeave;
  };
  type LeaveStatus = { #Pending; #Approved; #Rejected };

  type LeaveEntry = {
    leaveType : LeaveType;
    fromDate : Text;
    toDate : Text;
    days : Nat;
    reason : Text;
    status : LeaveStatus;
  };

  type ActivitySummary = {
    doctorsVisited : Nat;
    samplesGiven : Nat;
    chemistOrders : Nat;
    dailyExpense : Nat;
    leaveBalance : [(LeaveType, Nat)];
  };

  type IdCounters = {
    nextAreaId : Nat;
    nextDoctorId : Nat;
    nextProductId : Nat;
    nextChemistId : Nat;
  };

  // Persistent Storage
  let userProfiles = Map.empty<Principal, UserProfile>();
  let mrProfiles = Map.empty<Principal, MRProfile>();
  let areas = Map.empty<AreaId, Area>();
  let doctors = Map.empty<DoctorId, Doctor>();
  let products = Map.empty<ProductId, Product>();
  let chemists = Map.empty<ChemistId, Chemist>();
  let detailingEntries = Map.empty<Principal, List.List<DetailingEntry>>();
  let sampleEntries = Map.empty<Principal, List.List<SampleEntry>>();
  let chemistOrders = Map.empty<Principal, List.List<ChemistOrder>>();
  let expenseEntries = Map.empty<Principal, List.List<ExpenseEntry>>();
  let leaveEntries = Map.empty<Principal, List.List<LeaveEntry>>();

  module Area {
    public func compare(a : Area, b : Area) : Order.Order {
      Text.compare(a.name, b.name);
    };
  };

  module Doctor {
    public func compare(a : Doctor, b : Doctor) : Order.Order {
      Text.compare(a.name, b.name);
    };
  };

  module Product {
    public func compare(a : Product, b : Product) : Order.Order {
      Text.compare(a.name, b.name);
    };
  };

  module Chemist {
    public func compare(a : Chemist, b : Chemist) : Order.Order {
      Text.compare(a.name, b.name);
    };
  };

  // ID Counters
  var idCounters : IdCounters = {
    nextAreaId = 1;
    nextDoctorId = 1;
    nextProductId = 1;
    nextChemistId = 1;
  };

  // Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile Functions (Required by frontend)
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // MR Profile Functions
  public shared ({ caller }) func createOrUpdateMRProfile(employeeCode : Text, headQuarter : Text, assignedAreas : [AreaId]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create or update MR profiles");
    };
    let profile : MRProfile = {
      employeeCode;
      headQuarter;
      assignedAreas;
    };
    mrProfiles.add(caller, profile);
  };

  public query ({ caller }) func getMRProfile() : async MRProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view MR profiles");
    };
    switch (mrProfiles.get(caller)) {
      case (null) { Runtime.trap("MR Profile not found") };
      case (?profile) { profile };
    };
  };

  // Area Management
  public shared ({ caller }) func addArea(name : Text) : async AreaId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add areas");
    };
    let id = idCounters.nextAreaId;
    let area : Area = {
      id;
      name;
      createdBy = caller;
    };
    areas.add(id, area);
    idCounters := {
      idCounters with nextAreaId = id + 1;
    };
    id;
  };

  public query ({ caller }) func getAllAreas() : async [Area] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view areas");
    };
    // Return all areas - they can be shared across MRs
    areas.values().toArray().sort();
  };

  // Doctor Management
  public shared ({ caller }) func addDoctor(name : Text, qualification : Text, station : Text, specialization : Text, areaId : AreaId) : async DoctorId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add doctors");
    };
    let id = idCounters.nextDoctorId;
    let doctor : Doctor = {
      id;
      name;
      qualification;
      station;
      specialization;
      areaId;
      createdBy = caller;
    };
    doctors.add(id, doctor);
    idCounters := {
      idCounters with nextDoctorId = id + 1;
    };
    id;
  };

  public query ({ caller }) func getDoctorsByArea(areaId : AreaId) : async [Doctor] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view doctors");
    };
    let filtered = doctors.values().filter(func(d) { d.areaId == areaId });
    filtered.toArray().sort();
  };

  public query ({ caller }) func getAllDoctors() : async [Doctor] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view doctors");
    };
    // Return all doctors - they can be shared across MRs
    doctors.values().toArray().sort();
  };

  // Doctor Detailing
  public shared ({ caller }) func logDetailing(doctorId : DoctorId, date : Text, productIds : [ProductId]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can log detailing activities");
    };
    let entry : DetailingEntry = {
      doctorId;
      date;
      productIds;
    };
    let existing = switch (detailingEntries.get(caller)) {
      case (null) { List.empty<DetailingEntry>() };
      case (?entries) { entries };
    };
    existing.add(entry);
    detailingEntries.add(caller, existing);
  };

  public query ({ caller }) func getDetailingEntries() : async [DetailingEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view detailing entries");
    };
    switch (detailingEntries.get(caller)) {
      case (null) { [] };
      case (?entries) { entries.toArray() };
    };
  };

  // Doctor Samples
  public shared ({ caller }) func logSample(doctorId : DoctorId, date : Text, productId : ProductId, quantity : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can log samples");
    };
    let entry : SampleEntry = {
      doctorId;
      date;
      productId;
      quantity;
    };
    let existing = switch (sampleEntries.get(caller)) {
      case (null) { List.empty<SampleEntry>() };
      case (?entries) { entries };
    };
    existing.add(entry);
    sampleEntries.add(caller, existing);
  };

  public query ({ caller }) func getSampleEntries() : async [SampleEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view sample entries");
    };
    switch (sampleEntries.get(caller)) {
      case (null) { [] };
      case (?entries) { entries.toArray() };
    };
  };

  // Chemist Management
  public shared ({ caller }) func addChemist(name : Text, areaId : AreaId, address : Text, contact : Text) : async ChemistId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add chemists");
    };
    let id = idCounters.nextChemistId;
    let chemist : Chemist = {
      id;
      name;
      areaId;
      address;
      contact;
      createdBy = caller;
    };
    chemists.add(id, chemist);
    idCounters := {
      idCounters with nextChemistId = id + 1;
    };
    id;
  };

  public query ({ caller }) func getChemistsByArea(areaId : AreaId) : async [Chemist] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view chemists");
    };
    let filtered = chemists.values().filter(func(c) { c.areaId == areaId });
    filtered.toArray().sort();
  };

  public query ({ caller }) func getAllChemists() : async [Chemist] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view chemists");
    };
    chemists.values().toArray().sort();
  };

  // Chemist Orders
  public shared ({ caller }) func addChemistOrder(chemistId : ChemistId, date : Text, productId : ProductId, quantity : Nat, scheme : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add chemist orders");
    };
    let order : ChemistOrder = {
      chemistId;
      date;
      productId;
      quantity;
      scheme;
      status = #pending;
    };
    let existing = switch (chemistOrders.get(caller)) {
      case (null) { List.empty<ChemistOrder>() };
      case (?orders) { orders };
    };
    existing.add(order);
    chemistOrders.add(caller, existing);
  };

  public query ({ caller }) func getChemistOrders() : async [ChemistOrder] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view chemist orders");
    };
    switch (chemistOrders.get(caller)) {
      case (null) { [] };
      case (?orders) { orders.toArray() };
    };
  };

  // Product Master
  public shared ({ caller }) func addProduct(name : Text, code : Text) : async ProductId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add products");
    };
    let id = idCounters.nextProductId;
    let product : Product = {
      id;
      name;
      code;
      createdBy = caller;
    };
    products.add(id, product);
    idCounters := {
      idCounters with nextProductId = id + 1;
    };
    id;
  };

  public query ({ caller }) func getAllProducts() : async [Product] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view products");
    };
    // Return all products - they are shared across MRs
    products.values().toArray().sort();
  };

  // Expense Entry
  public shared ({ caller }) func addExpense(date : Text, kmTraveled : Nat, daAmount : Nat, notes : Text, taAmountOpt : ?Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add expenses");
    };

    let taAmount = switch (taAmountOpt) {
      case (null) { 0 };
      case (?value) { value };
    };

    let entry : ExpenseEntry = {
      date;
      kmTraveled;
      taAmount;
      daAmount;
      notes;
    };

    let existing = switch (expenseEntries.get(caller)) {
      case (null) { List.empty<ExpenseEntry>() };
      case (?entries) { entries };
    };
    existing.add(entry);
    expenseEntries.add(caller, existing);
  };

  public query ({ caller }) func getExpenseEntries() : async [ExpenseEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view expense entries");
    };
    switch (expenseEntries.get(caller)) {
      case (null) { [] };
      case (?entries) { entries.toArray() };
    };
  };

  // Leave Applications
  public shared ({ caller }) func applyLeave(
    leaveType : LeaveType,
    fromDate : Text,
    toDate : Text,
    days : Nat,
    reason : Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can apply for leave");
    };
    // Leave applications always start as Pending
    let entry : LeaveEntry = {
      leaveType;
      fromDate;
      toDate;
      days;
      reason;
      status = #Pending;
    };
    let existing = switch (leaveEntries.get(caller)) {
      case (null) { List.empty<LeaveEntry>() };
      case (?entries) { entries };
    };
    existing.add(entry);
    leaveEntries.add(caller, existing);
  };

  public query ({ caller }) func getLeaveHistory() : async [LeaveEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view leave history");
    };
    switch (leaveEntries.get(caller)) {
      case (null) { [] };
      case (?entries) { entries.toArray() };
    };
  };

  // Admin function to update leave status
  public shared ({ caller }) func updateLeaveStatus(mrPrincipal : Principal, leaveIndex : Nat, newStatus : LeaveStatus) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update leave status");
    };

    switch (leaveEntries.get(mrPrincipal)) {
      case (null) { Runtime.trap("No leave entries found for this MR") };
      case (?entries) {
        let entriesArray = entries.toArray();
        if (leaveIndex >= entriesArray.size()) {
          Runtime.trap("Invalid leave index");
        };

        let updatedEntry = {
          entriesArray[leaveIndex] with status = newStatus;
        };

        let newList = List.empty<LeaveEntry>();
        var i = 0;
        while (i < entriesArray.size()) {
          if (i == leaveIndex) {
            newList.add(updatedEntry);
          } else {
            newList.add(entriesArray[i]);
          };
          i += 1;
        };
        leaveEntries.add(mrPrincipal, newList);
      };
    };
  };

  // Admin function to view all MR profiles
  public query ({ caller }) func getAllMRProfiles() : async [(Principal, MRProfile)] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all MR profiles");
    };
    mrProfiles.entries().toArray();
  };

  // Admin function to view leave applications for all MRs
  public query ({ caller }) func getAllLeaveApplications() : async [(Principal, [LeaveEntry])] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all leave applications");
    };
    leaveEntries.entries().map(func((p, list)) : (Principal, [LeaveEntry]) {
      (p, list.toArray());
    }).toArray();
  };

  // Dashboard
  public query ({ caller }) func getActivitySummary(date : Text) : async ActivitySummary {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access activity summary");
    };

    // Count doctors visited on the given date
    let doctorsVisited = switch (detailingEntries.get(caller)) {
      case (null) { 0 };
      case (?entries) {
        entries.toArray().filter(func(e) { e.date == date }).size();
      };
    };

    // Count samples given on the given date
    let samplesGiven = switch (sampleEntries.get(caller)) {
      case (null) { 0 };
      case (?entries) {
        entries.toArray().filter(func(e) { e.date == date }).size();
      };
    };

    // Count chemist orders on the given date
    let chemistOrdersCount = switch (chemistOrders.get(caller)) {
      case (null) { 0 };
      case (?orders) {
        orders.toArray().filter(func(o) { o.date == date }).size();
      };
    };

    // Calculate daily expense
    let dailyExpense = switch (expenseEntries.get(caller)) {
      case (null) { 0 };
      case (?entries) {
        let dayExpenses = entries.toArray().filter(func(e) { e.date == date });
        var total = 0;
        for (exp in dayExpenses.vals()) {
          total += exp.taAmount + exp.daAmount;
        };
        total;
      };
    };

    // Calculate leave balance (approved leaves per type)
    let leaveBalance = switch (leaveEntries.get(caller)) {
      case (null) { [] };
      case (?entries) {
        let allLeaves = entries.toArray();
        let casualLeaves = allLeaves.filter(func(l) {
          switch (l.leaveType) { case (#CasualLeave) { l.status == #Approved }; case (_) { false } };
        }).size();
        let sickLeaves = allLeaves.filter(func(l) {
          switch (l.leaveType) { case (#SickLeave) { l.status == #Approved }; case (_) { false } };
        }).size();
        let earnedLeaves = allLeaves.filter(func(l) {
          switch (l.leaveType) { case (#EarnedLeave) { l.status == #Approved }; case (_) { false } };
        }).size();
        let privilegeLeaves = allLeaves.filter(func(l) {
          switch (l.leaveType) { case (#PrivilegeLeave) { l.status == #Approved }; case (_) { false } };
        }).size();
        let withoutPayLeaves = allLeaves.filter(func(l) {
          switch (l.leaveType) { case (#WithoutPayLeave) { l.status == #Approved }; case (_) { false } };
        }).size();

        [
          (#CasualLeave, casualLeaves),
          (#SickLeave, sickLeaves),
          (#EarnedLeave, earnedLeaves),
          (#PrivilegeLeave, privilegeLeaves),
          (#WithoutPayLeave, withoutPayLeaves),
        ];
      };
    };

    {
      doctorsVisited;
      samplesGiven;
      chemistOrders = chemistOrdersCount;
      dailyExpense;
      leaveBalance;
    };
  };
};
