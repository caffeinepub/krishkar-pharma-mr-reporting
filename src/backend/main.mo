import Array "mo:core/Array";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Order "mo:core/Order";



actor {
  // === Type Definitions ===
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

  type ManagerRole = { #RSM; #ASM };
  type ManagerProfile = {
    name : Text;
    employeeCode : Text;
    headQuarter : Text;
    managerRole : ManagerRole;
  };

  type AreaId = Nat;
  type Area = {
    id : AreaId;
    name : Text;
    headquarterId : Nat;
    createdBy : Principal;
  };

  type Headquarter = {
    id : Nat;
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
    nextHeadquarterId : Nat;
    nextSampleAllotmentId : Nat;
    nextDemandOrderId : Nat;
    nextCRMDemandId : Nat;
    nextGiftArticleId : Nat;
    nextGiftDistributionId : Nat;
    nextGiftDemandOrderId : Nat;
  };

  // --- New Types for Upgraded Features ---
  type SampleAllotment = {
    id : Nat;
    targetPrincipal : Principal;
    productId : ProductId;
    quantity : Nat;
    date : Text;
    allocatedBy : Principal;
  };

  type DoctorInput = {
    name : Text;
    qualification : Text;
    station : Text;
    specialization : Text;
    areaId : AreaId;
  };

  type SampleBalance = {
    productId : ProductId;
    productName : Text;
    totalAllotted : Nat;
    totalDistributed : Nat;
    balance : Nat;
  };

  type DemandOrderStatus = { #Pending; #Approved; #Rejected };

  type SampleDemandOrder = {
    id : Nat;
    mrPrincipal : Principal;
    productId : ProductId;
    requestedQty : Nat;
    date : Text;
    notes : Text;
    status : DemandOrderStatus;
  };

  type ManagerAreaAssignment = {
    areaIds : [AreaId];
  };

  type CRMDemandId = Nat;
  type CRMDemandStatus = { #Pending; #Approved; #Rejected };
  type CRMDemand = {
    id : CRMDemandId;
    doctorId : DoctorId;
    doctorName : Text;
    amount : Nat;
    notes : Text;
    status : CRMDemandStatus;
    adminRemarks : Text;
    date : Text;
    raisedBy : Principal;
    raiserName : Text;
  };

  type GiftArticleId = Nat;
  type GiftArticle = {
    id : GiftArticleId;
    name : Text;
    description : Text;
  };

  type GiftDistributionId = Nat;
  type GiftDistribution = {
    id : GiftDistributionId;
    doctorId : DoctorId;
    doctorName : Text;
    giftArticleId : GiftArticleId;
    giftArticleName : Text;
    quantity : Nat;
    date : Text;
    distributedBy : Principal;
  };

  type GiftDemandOrderId = Nat;
  type GiftDemandOrderStatus = { #Pending; #Approved; #Rejected };
  type GiftDemandOrder = {
    id : GiftDemandOrderId;
    mrPrincipal : Principal;
    giftArticleId : GiftArticleId;
    giftArticleName : Text;
    quantity : Nat;
    notes : Text;
    date : Text;
    status : GiftDemandOrderStatus;
    adminRemarks : Text;
  };

  // === Persistent Storage ===
  let userProfiles = Map.empty<Principal, UserProfile>();
  let mrProfiles = Map.empty<Principal, MRProfile>();
  let managerProfiles = Map.empty<Principal, ManagerProfile>();
  let areas = Map.empty<AreaId, Area>();
  let doctors = Map.empty<DoctorId, Doctor>();
  let products = Map.empty<ProductId, Product>();
  let chemists = Map.empty<ChemistId, Chemist>();
  let detailingEntries = Map.empty<Principal, List.List<DetailingEntry>>();
  let sampleEntries = Map.empty<Principal, List.List<SampleEntry>>();
  let chemistOrders = Map.empty<Principal, List.List<ChemistOrder>>();
  let expenseEntries = Map.empty<Principal, List.List<ExpenseEntry>>();
  let leaveEntries = Map.empty<Principal, List.List<LeaveEntry>>();
  let headquarters = Map.empty<Nat, Headquarter>();
  let sampleAllotments = Map.empty<Nat, SampleAllotment>();
  let sampleDemandOrders = Map.empty<Nat, SampleDemandOrder>();
  let managerAreaAssignments = Map.empty<Principal, ManagerAreaAssignment>();
  let crmDemands = Map.empty<CRMDemandId, CRMDemand>();
  let giftArticles = Map.empty<GiftArticleId, GiftArticle>();
  let giftDistributions = Map.empty<GiftDistributionId, GiftDistribution>();
  let giftDemandOrders = Map.empty<GiftDemandOrderId, GiftDemandOrder>();

  // === Modules for Ordering ===
  module Area {
    public func compare(a : Area, b : Area) : Order.Order {
      a.name.compare(b.name);
    };
  };

  module Doctor {
    public func compare(a : Doctor, b : Doctor) : Order.Order {
      a.name.compare(b.name);
    };
  };

  module Product {
    public func compare(a : Product, b : Product) : Order.Order {
      a.name.compare(b.name);
    };
  };

  module Chemist {
    public func compare(a : Chemist, b : Chemist) : Order.Order {
      a.name.compare(b.name);
    };
  };

  // === Id Counters ===
  var idCounters : IdCounters = {
    nextAreaId = 1;
    nextDoctorId = 1;
    nextProductId = 1;
    nextChemistId = 1;
    nextHeadquarterId = 1;
    nextSampleAllotmentId = 1;
    nextDemandOrderId = 1;
    nextCRMDemandId = 1;
    nextGiftArticleId = 1;
    nextGiftDistributionId = 1;
    nextGiftDemandOrderId = 1;
  };

  // === Authorization ===
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // === Helper: Manager Check ===
  func isManager(caller : Principal) : Bool {
    switch (managerProfiles.get(caller)) {
      case (?_) { true };
      case (null) { false };
    };
  };

  // === Emergency Admin Recovery ===
  // This function allows the registered admin principal to restore their admin role
  // if they accidentally changed it. Only callable by the exact registered admin principal.
  public shared ({ caller }) func emergencyRestoreAdmin() : async () {
    let registeredAdminPrincipal = Principal.fromText("grbwb-eomkl-kudk6-gg5mh-ye5qx-b6cqs-7apa2-lus3n-b5lpa-sqbtx-tqe");
    if (caller != registeredAdminPrincipal) {
      Runtime.trap("Unauthorized: This function is restricted to the registered admin principal");
    };
    accessControlState.userRoles.add(caller, #admin);
    accessControlState.adminAssigned := true;
  };

  // === CRM Demand System Functions ===
  public shared ({ caller }) func raiseCRMDemand(doctorId : DoctorId, doctorName : Text, amount : Nat, notes : Text, date : Text, raiserName : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can raise CRM demands");
    };
    
    // CRM demands can only be raised by ASM/RSM managers
    if (not isManager(caller)) {
      Runtime.trap("Unauthorized: Only ASM/RSM managers can raise CRM demands");
    };

    let newId = idCounters.nextCRMDemandId;
    let demand : CRMDemand = {
      id = newId;
      doctorId;
      doctorName;
      amount;
      notes;
      status = #Pending;
      adminRemarks = "";
      date;
      raisedBy = caller;
      raiserName;
    };

    crmDemands.add(newId, demand);
    idCounters := {
      idCounters with
      nextCRMDemandId = newId + 1;
    };
  };

  public query ({ caller }) func getMyCRMDemands() : async [CRMDemand] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their CRM demands");
    };

    crmDemands.values().toArray().filter(func(demand) { demand.raisedBy == caller });
  };

  public query ({ caller }) func getAllCRMDemands() : async [CRMDemand] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all CRM demands");
    };
    crmDemands.values().toArray();
  };

  public shared ({ caller }) func updateCRMDemandStatus(demandId : CRMDemandId, newStatus : CRMDemandStatus, adminRemarks : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update CRM demand status");
    };

    switch (crmDemands.get(demandId)) {
      case (null) { Runtime.trap("CRM demand not found") };
      case (?existing) {
        let updatedDemand = {
          existing with
          status = newStatus;
          adminRemarks;
        };
        crmDemands.add(demandId, updatedDemand);
      };
    };
  };

  // === Gift Article Catalog Functions ===
  public shared ({ caller }) func addGiftArticle(name : Text, description : Text) : async GiftArticleId {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can add gift articles");
    };

    let id = idCounters.nextGiftArticleId;
    let article : GiftArticle = { id; name; description };
    giftArticles.add(id, article);
    idCounters := {
      idCounters with
      nextGiftArticleId = id + 1;
    };
    id;
  };

  public query ({ caller }) func getAllGiftArticles() : async [GiftArticle] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view gift articles");
    };
    giftArticles.values().toArray();
  };

  public shared ({ caller }) func updateGiftArticle(id : GiftArticleId, name : Text, description : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update gift articles");
    };

    switch (giftArticles.get(id)) {
      case (null) { Runtime.trap("Gift article not found") };
      case (?existing) {
        let updatedArticle = { id; name; description };
        giftArticles.add(id, updatedArticle);
      };
    };
  };

  public shared ({ caller }) func deleteGiftArticle(id : GiftArticleId) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete gift articles");
    };

    switch (giftArticles.get(id)) {
      case (null) { Runtime.trap("Gift article not found") };
      case (?_) { giftArticles.remove(id) };
    };
  };

  // === Gift Distribution Functions ===
  public shared ({ caller }) func logGiftDistribution(doctorId : DoctorId, doctorName : Text, giftArticleId : GiftArticleId, giftArticleName : Text, quantity : Nat, date : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can log gift distributions");
    };

    let id = idCounters.nextGiftDistributionId;
    let distribution : GiftDistribution = {
      id;
      doctorId;
      doctorName;
      giftArticleId;
      giftArticleName;
      quantity;
      date;
      distributedBy = caller;
    };

    giftDistributions.add(id, distribution);
    idCounters := {
      idCounters with
      nextGiftDistributionId = id + 1;
    };
  };

  public query ({ caller }) func getMyGiftDistributions() : async [GiftDistribution] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their gift distributions");
    };

    giftDistributions.values().toArray().filter(func(dist) { dist.distributedBy == caller });
  };

  public query ({ caller }) func getAllGiftDistributions() : async [GiftDistribution] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all gift distributions");
    };
    giftDistributions.values().toArray();
  };

  // === Gift Demand Order Functions ===
  public shared ({ caller }) func raiseGiftDemandOrder(giftArticleId : GiftArticleId, giftArticleName : Text, quantity : Nat, notes : Text, date : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can raise gift demand orders");
    };

    let id = idCounters.nextGiftDemandOrderId;
    let order : GiftDemandOrder = {
      id;
      mrPrincipal = caller;
      giftArticleId;
      giftArticleName;
      quantity;
      notes;
      date;
      status = #Pending;
      adminRemarks = "";
    };

    giftDemandOrders.add(id, order);
    idCounters := {
      idCounters with
      nextGiftDemandOrderId = id + 1;
    };
  };

  public query ({ caller }) func getMyGiftDemandOrders() : async [GiftDemandOrder] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their gift demand orders");
    };

    giftDemandOrders.values().toArray().filter(func(order) { order.mrPrincipal == caller });
  };

  public query ({ caller }) func getAllGiftDemandOrders() : async [GiftDemandOrder] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all gift demand orders");
    };
    giftDemandOrders.values().toArray();
  };

  public shared ({ caller }) func updateGiftDemandOrderStatus(orderId : GiftDemandOrderId, newStatus : GiftDemandOrderStatus, adminRemarks : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update gift demand order status");
    };

    switch (giftDemandOrders.get(orderId)) {
      case (null) { Runtime.trap("Gift demand order not found") };
      case (?existing) {
        let updatedOrder = {
          existing with
          status = newStatus;
          adminRemarks;
        };
        giftDemandOrders.add(orderId, updatedOrder);
      };
    };
  };

  // === Demand Sample Order APIs ===
  public shared ({ caller }) func raiseSampleDemandOrder(productId : ProductId, requestedQty : Nat, date : Text, notes : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can raise sample demand orders");
    };

    if (products.get(productId) == null) {
      Runtime.trap("Product does not exist");
    };

    let newId = idCounters.nextDemandOrderId;
    let newOrder : SampleDemandOrder = {
      id = newId;
      mrPrincipal = caller;
      productId;
      requestedQty;
      date;
      notes;
      status = #Pending;
    };

    sampleDemandOrders.add(newId, newOrder);
    idCounters := {
      idCounters with
      nextDemandOrderId = newId + 1;
    };
  };

  public query ({ caller }) func getMySampleDemandOrders() : async [SampleDemandOrder] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their sample demand orders");
    };

    let result = sampleDemandOrders.values().toArray().filter(func(order) { order.mrPrincipal == caller });
    result;
  };

  public query ({ caller }) func getAllSampleDemandOrders() : async [SampleDemandOrder] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all sample demand orders");
    };
    sampleDemandOrders.values().toArray();
  };

  public shared ({ caller }) func updateSampleDemandOrderStatus(orderId : Nat, newStatus : DemandOrderStatus) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update sample demand order status");
    };

    switch (sampleDemandOrders.get(orderId)) {
      case (null) { Runtime.trap("Sample demand order not found") };
      case (?existing) {
        let updatedOrder = {
          existing with status = newStatus;
        };
        sampleDemandOrders.add(orderId, updatedOrder);
      };
    };
  };

  // === Manager Area Assignment Functions ===
  public shared ({ caller }) func adminAssignManagerAreas(target : Principal, areaIds : [AreaId]) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can assign areas to managers");
    };

    if (managerProfiles.get(target) == null) {
      Runtime.trap("Manager profile does not exist");
    };

    managerAreaAssignments.add(target, { areaIds });
  };

  public query ({ caller }) func getManagerAreas(target : Principal) : async ManagerAreaAssignment {
    if (not (AccessControl.isAdmin(accessControlState, caller)) and target != caller) {
      Runtime.trap("Unauthorized: Can only view your own area assignments or must be admin");
    };

    switch (managerAreaAssignments.get(target)) {
      case (null) { Runtime.trap("No area assignments found for manager") };
      case (?assignment) { assignment };
    };
  };

  // --- Manager Profile Functions: Admin Only (removed self-service) ---
  public shared ({ caller }) func saveManagerProfile(name : Text, employeeCode : Text, headQuarter : Text, managerRole : ManagerRole) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can create manager profiles");
    };
    managerProfiles.add(caller, { name; employeeCode; headQuarter; managerRole });
  };

  public query ({ caller }) func getManagerProfile() : async ?ManagerProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    managerProfiles.get(caller);
  };

  // Admin: assign manager profile to any user
  public shared ({ caller }) func adminSaveManagerProfile(target : Principal, name : Text, employeeCode : Text, headQuarter : Text, managerRole : ManagerRole) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can assign manager profiles");
    };
    managerProfiles.add(target, { name; employeeCode; headQuarter; managerRole });
  };

  public query ({ caller }) func getAllManagerProfiles() : async [(Principal, ManagerProfile)] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all manager profiles");
    };
    managerProfiles.entries().toArray();
  };

  public shared ({ caller }) func deleteManagerProfile(target : Principal) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete manager profiles");
    };
    managerProfiles.remove(target);
  };

  // === RSM/ASM: view all leave applications ===
  public query ({ caller }) func getTeamLeaveApplications() : async [(Principal, [LeaveEntry])] {
    if (not (AccessControl.isAdmin(accessControlState, caller)) and not isManager(caller)) {
      Runtime.trap("Unauthorized: Only admins and managers can view team leave applications");
    };
    leaveEntries.entries().map(func((p, list)) : (Principal, [LeaveEntry]) { (p, list.toArray()) }).toArray();
  };

  // RSM/ASM: update leave status
  public shared ({ caller }) func updateLeaveStatusByManager(mrPrincipal : Principal, leaveIndex : Nat, newStatus : LeaveStatus) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller)) and not isManager(caller)) {
      Runtime.trap("Unauthorized: Only admins and managers can update leave status");
    };
    switch (leaveEntries.get(mrPrincipal)) {
      case (null) { Runtime.trap("No leave entries found") };
      case (?entries) {
        let arr = entries.toArray();
        if (leaveIndex >= arr.size()) { Runtime.trap("Invalid leave index") };
        let updatedEntry = { arr[leaveIndex] with status = newStatus };
        let newList = List.empty<LeaveEntry>();
        var i = 0;
        while (i < arr.size()) {
          if (i == leaveIndex) { newList.add(updatedEntry) } else { newList.add(arr[i]) };
          i += 1;
        };
        leaveEntries.add(mrPrincipal, newList);
      };
    };
  };

  // RSM/ASM: get team detailing entries
  public query ({ caller }) func getTeamDetailingEntries() : async [(Principal, [DetailingEntry])] {
    if (not (AccessControl.isAdmin(accessControlState, caller)) and not isManager(caller)) {
      Runtime.trap("Unauthorized: Only admins and managers can view team detailing entries");
    };
    detailingEntries.entries().map(func((p, list)) : (Principal, [DetailingEntry]) { (p, list.toArray()) }).toArray();
  };

  // RSM/ASM: get team expense entries
  public query ({ caller }) func getTeamExpenseEntries() : async [(Principal, [ExpenseEntry])] {
    if (not (AccessControl.isAdmin(accessControlState, caller)) and not isManager(caller)) {
      Runtime.trap("Unauthorized: Only admins and managers can view team expense entries");
    };
    expenseEntries.entries().map(func((p, list)) : (Principal, [ExpenseEntry]) { (p, list.toArray()) }).toArray();
  };

  // RSM/ASM: get all user profiles (for name lookup)
  public query ({ caller }) func getAllUserProfiles() : async [(Principal, UserProfile)] {
    if (not (AccessControl.isAdmin(accessControlState, caller)) and not isManager(caller)) {
      Runtime.trap("Unauthorized: Only admins and managers can view all user profiles");
    };
    userProfiles.entries().toArray();
  };

  // === User Profile Functions ===
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
    mrProfiles.add(caller, { employeeCode; headQuarter; assignedAreas });
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

  // --- Headquarter Management ---
  public shared ({ caller }) func addHeadquarter(name : Text) : async Nat {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can add headquarters");
    };
    let id = idCounters.nextHeadquarterId;
    headquarters.add(id, { id; name; createdBy = caller });
    idCounters := { idCounters with nextHeadquarterId = id + 1 };
    id;
  };

  public query ({ caller }) func getAllHeadquarters() : async [Headquarter] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view headquarters");
    };
    headquarters.values().toArray();
  };

  public shared ({ caller }) func updateHeadquarter(id : Nat, name : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update headquarters");
    };
    switch (headquarters.get(id)) {
      case (null) { Runtime.trap("Headquarter not found") };
      case (?existing) { headquarters.add(id, { existing with name }) };
    };
  };

  public shared ({ caller }) func deleteHeadquarter(id : Nat) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete headquarters");
    };
    switch (headquarters.get(id)) {
      case (null) { Runtime.trap("Headquarter not found") };
      case (?_) { headquarters.remove(id) };
    };
  };

  // --- Area Management ---
  public shared ({ caller }) func addArea(name : Text, headquarterId : Nat) : async AreaId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add areas");
    };
    let id = idCounters.nextAreaId;
    areas.add(id, { id; name; headquarterId; createdBy = caller });
    idCounters := { idCounters with nextAreaId = id + 1 };
    id;
  };

  public query ({ caller }) func getAllAreas() : async [Area] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view areas");
    };
    areas.values().toArray().sort();
  };

  // Admin: update area
  public shared ({ caller }) func updateArea(id : AreaId, name : Text, headquarterId : Nat) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update areas");
    };
    switch (areas.get(id)) {
      case (null) { Runtime.trap("Area not found") };
      case (?existing) { areas.add(id, { existing with name; headquarterId }) };
    };
  };

  // Admin: delete area
  public shared ({ caller }) func deleteArea(id : AreaId) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete areas");
    };
    switch (areas.get(id)) {
      case (null) { Runtime.trap("Area not found") };
      case (?_) { areas.remove(id) };
    };
  };

  // --- Doctor Management ---
  public shared ({ caller }) func addDoctor(name : Text, qualification : Text, station : Text, specialization : Text, areaId : AreaId) : async DoctorId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add doctors");
    };
    let id = idCounters.nextDoctorId;
    doctors.add(id, { id; name; qualification; station; specialization; areaId; createdBy = caller });
    idCounters := { idCounters with nextDoctorId = id + 1 };
    id;
  };

  public query ({ caller }) func getDoctorsByArea(areaId : AreaId) : async [Doctor] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view doctors");
    };
    doctors.values().filter(func(d) { d.areaId == areaId }).toArray().sort();
  };

  public query ({ caller }) func getAllDoctors() : async [Doctor] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view doctors");
    };
    doctors.values().toArray().sort();
  };

  // --- Doctor Detailing ---
  public shared ({ caller }) func logDetailing(doctorId : DoctorId, date : Text, productIds : [ProductId]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can log detailing");
    };
    let entry : DetailingEntry = { doctorId; date; productIds };
    let existing = switch (detailingEntries.get(caller)) {
      case (null) { List.empty<DetailingEntry>() };
      case (?e) { e };
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
      case (?e) { e.toArray() };
    };
  };

  // --- Doctor Samples ---
  public shared ({ caller }) func logSample(doctorId : DoctorId, date : Text, productId : ProductId, quantity : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can log samples");
    };
    let entry : SampleEntry = { doctorId; date; productId; quantity };
    let existing = switch (sampleEntries.get(caller)) {
      case (null) { List.empty<SampleEntry>() };
      case (?e) { e };
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
      case (?e) { e.toArray() };
    };
  };

  // --- Chemist Management ---
  public shared ({ caller }) func addChemist(name : Text, areaId : AreaId, address : Text, contact : Text) : async ChemistId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add chemists");
    };
    let id = idCounters.nextChemistId;
    chemists.add(id, { id; name; areaId; address; contact; createdBy = caller });
    idCounters := { idCounters with nextChemistId = id + 1 };
    id;
  };

  public query ({ caller }) func getChemistsByArea(areaId : AreaId) : async [Chemist] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view chemists");
    };
    chemists.values().filter(func(c) { c.areaId == areaId }).toArray().sort();
  };

  public query ({ caller }) func getAllChemists() : async [Chemist] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view chemists");
    };
    chemists.values().toArray().sort();
  };

  // --- Chemist Orders ---
  public shared ({ caller }) func addChemistOrder(chemistId : ChemistId, date : Text, productId : ProductId, quantity : Nat, scheme : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add chemist orders");
    };
    let order : ChemistOrder = { chemistId; date; productId; quantity; scheme; status = #pending };
    let existing = switch (chemistOrders.get(caller)) {
      case (null) { List.empty<ChemistOrder>() };
      case (?o) { o };
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
      case (?o) { o.toArray() };
    };
  };

  // --- Product Master ---
  public shared ({ caller }) func addProduct(name : Text, code : Text) : async ProductId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add products");
    };
    let id = idCounters.nextProductId;
    products.add(id, { id; name; code; createdBy = caller });
    idCounters := { idCounters with nextProductId = id + 1 };
    id;
  };

  public query ({ caller }) func getAllProducts() : async [Product] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view products");
    };
    products.values().toArray().sort();
  };

  // --- Expense Entry ---
  public shared ({ caller }) func addExpense(date : Text, kmTraveled : Nat, daAmount : Nat, notes : Text, taAmountOpt : ?Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add expenses");
    };
    let taAmount = switch (taAmountOpt) { case (null) { 0 }; case (?v) { v } };
    let entry : ExpenseEntry = { date; kmTraveled; taAmount; daAmount; notes };
    let existing = switch (expenseEntries.get(caller)) {
      case (null) { List.empty<ExpenseEntry>() };
      case (?e) { e };
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
      case (?e) { e.toArray() };
    };
  };

  // --- Leave Applications ---
  public shared ({ caller }) func applyLeave(leaveType : LeaveType, fromDate : Text, toDate : Text, days : Nat, reason : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can apply for leave");
    };
    let entry : LeaveEntry = { leaveType; fromDate; toDate; days; reason; status = #Pending };
    let existing = switch (leaveEntries.get(caller)) {
      case (null) { List.empty<LeaveEntry>() };
      case (?e) { e };
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
      case (?e) { e.toArray() };
    };
  };

  // Admin: update leave status
  public shared ({ caller }) func updateLeaveStatus(mrPrincipal : Principal, leaveIndex : Nat, newStatus : LeaveStatus) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update leave status");
    };
    switch (leaveEntries.get(mrPrincipal)) {
      case (null) { Runtime.trap("No leave entries found") };
      case (?entries) {
        let arr = entries.toArray();
        if (leaveIndex >= arr.size()) { Runtime.trap("Invalid leave index") };
        let updatedEntry = { arr[leaveIndex] with status = newStatus };
        let newList = List.empty<LeaveEntry>();
        var i = 0;
        while (i < arr.size()) {
          if (i == leaveIndex) { newList.add(updatedEntry) } else { newList.add(arr[i]) };
          i += 1;
        };
        leaveEntries.add(mrPrincipal, newList);
      };
    };
  };

  // Admin: view all MR profiles
  public query ({ caller }) func getAllMRProfiles() : async [(Principal, MRProfile)] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all MR profiles");
    };
    mrProfiles.entries().toArray();
  };

  // Admin: view all leave applications
  public query ({ caller }) func getAllLeaveApplications() : async [(Principal, [LeaveEntry])] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all leave applications");
    };
    leaveEntries.entries().map(func((p, list)) : (Principal, [LeaveEntry]) { (p, list.toArray()) }).toArray();
  };

  // --- Dashboard ---
  public query ({ caller }) func getActivitySummary(date : Text) : async ActivitySummary {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view activity summary");
    };
    let doctorsVisited = switch (detailingEntries.get(caller)) {
      case (null) { 0 };
      case (?e) { e.toArray().filter(func(x) { x.date == date }).size() };
    };
    let samplesGiven = switch (sampleEntries.get(caller)) {
      case (null) { 0 };
      case (?e) { e.toArray().filter(func(x) { x.date == date }).size() };
    };
    let chemistOrdersCount = switch (chemistOrders.get(caller)) {
      case (null) { 0 };
      case (?o) { o.toArray().filter(func(x) { x.date == date }).size() };
    };
    let dailyExpense = switch (expenseEntries.get(caller)) {
      case (null) { 0 };
      case (?e) {
        var total = 0;
        for (exp in e.toArray().filter(func(x) { x.date == date }).vals()) {
          total += exp.taAmount + exp.daAmount;
        };
        total;
      };
    };
    let leaveBalance = switch (leaveEntries.get(caller)) {
      case (null) { [] };
      case (?e) {
        let all = e.toArray();
        [
          (#CasualLeave, all.filter(func(l) { switch (l.leaveType) { case (#CasualLeave) { l.status == #Approved }; case (_) { false } } }).size()),
          (#SickLeave, all.filter(func(l) { switch (l.leaveType) { case (#SickLeave) { l.status == #Approved }; case (_) { false } } }).size()),
          (#EarnedLeave, all.filter(func(l) { switch (l.leaveType) { case (#EarnedLeave) { l.status == #Approved }; case (_) { false } } }).size()),
          (#PrivilegeLeave, all.filter(func(l) { switch (l.leaveType) { case (#PrivilegeLeave) { l.status == #Approved }; case (_) { false } } }).size()),
          (#WithoutPayLeave, all.filter(func(l) { switch (l.leaveType) { case (#WithoutPayLeave) { l.status == #Approved }; case (_) { false } } }).size()),
        ];
      };
    };
    { doctorsVisited; samplesGiven; chemistOrders = chemistOrdersCount; dailyExpense; leaveBalance };
  };

  // Admin: update doctor
  public shared ({ caller }) func updateDoctor(id : DoctorId, name : Text, qualification : Text, station : Text, specialization : Text, areaId : AreaId) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update doctors");
    };
    switch (doctors.get(id)) {
      case (null) { Runtime.trap("Doctor not found") };
      case (?existing) {
        doctors.add(id, { id; name; qualification; station; specialization; areaId; createdBy = existing.createdBy });
      };
    };
  };

  // Admin: delete doctor
  public shared ({ caller }) func deleteDoctor(id : DoctorId) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete doctors");
    };
    switch (doctors.get(id)) {
      case (null) { Runtime.trap("Doctor not found") };
      case (?_) { doctors.remove(id) };
    };
  };

  // Admin: update product
  public shared ({ caller }) func updateProduct(id : ProductId, name : Text, code : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update products");
    };
    switch (products.get(id)) {
      case (null) { Runtime.trap("Product not found") };
      case (?existing) {
        products.add(id, { id; name; code; createdBy = existing.createdBy });
      };
    };
  };

  // Admin: delete product
  public shared ({ caller }) func deleteProduct(id : ProductId) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete products");
    };
    switch (products.get(id)) {
      case (null) { Runtime.trap("Product not found") };
      case (?_) { products.remove(id) };
    };
  };

  // Admin: delete MR profile
  public shared ({ caller }) func deleteMRProfile(mrPrincipal : Principal) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete MR profiles");
    };
    switch (mrProfiles.get(mrPrincipal)) {
      case (null) { Runtime.trap("MR Profile not found") };
      case (?_) { mrProfiles.remove(mrPrincipal) };
    };
  };

  // Admin: create/update MR profile for any user
  public shared ({ caller }) func adminCreateOrUpdateMRProfile(mrPrincipal : Principal, employeeCode : Text, headQuarter : Text, assignedAreas : [AreaId]) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can create or update MR profiles");
    };
    mrProfiles.add(mrPrincipal, { employeeCode; headQuarter; assignedAreas });
  };

  // Admin: get all pending users
  public query ({ caller }) func getAllPendingUsers() : async [Principal] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view pending users");
    };
    let pending = List.empty<Principal>();
    for ((principal, _profile) in userProfiles.entries()) {
      let role = AccessControl.getUserRole(accessControlState, principal);
      switch (role) {
        case (#guest) { pending.add(principal) };
        case (_) {};
      };
    };
    pending.toArray();
  };

  // --- Sample Allotment Functions ---
  public shared ({ caller }) func adminAllotSamples(target : Principal, productId : ProductId, quantity : Nat, date : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can create sample allotments");
    };

    let productExists = switch (products.get(productId)) {
      case (null) { Runtime.trap("Product does not exist") };
      case (?_) { true };
    };

    if (not productExists) { Runtime.trap("Product does not exist") };

    let newId = idCounters.nextSampleAllotmentId;
    let entry : SampleAllotment = { id = newId; targetPrincipal = target; productId; quantity; date; allocatedBy = caller };
    sampleAllotments.add(newId, entry);
    idCounters := { idCounters with nextSampleAllotmentId = newId + 1 };
  };

  public query ({ caller }) func getMyAllotments() : async [SampleAllotment] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their allotments");
    };
    sampleAllotments.values().filter(func(x) { x.targetPrincipal == caller }).toArray();
  };

  public query ({ caller }) func getAllSampleAllotments() : async [SampleAllotment] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all sample allotments");
    };
    sampleAllotments.values().toArray();
  };

  public query ({ caller }) func getMySampleBalance() : async [SampleBalance] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their sample balance");
    };

    let productIndex = products;

    let productIdsIter = products.keys();
    let resultList = List.empty<SampleBalance>();

    for (productId in productIdsIter) {
      let totalAllotted = sampleAllotments.values().toArray().filter(func(x) { x.targetPrincipal == caller and x.productId == productId }).foldLeft(0, func(acc, entry) { acc + entry.quantity });

      let totalDistributed = switch (sampleEntries.get(caller)) {
        case (null) { 0 };
        case (?entries) {
          entries.toArray().filter(func(x) { x.productId == productId }).foldLeft(0, func(acc, entry) { acc + entry.quantity });
        };
      };

      let productName = switch (productIndex.get(productId)) {
        case (null) { "" };
        case (?prod) { prod.name };
      };

      if (totalAllotted > 0 or totalDistributed > 0) {
        resultList.add({
          productId;
          productName;
          totalAllotted;
          totalDistributed;
          balance = if (totalAllotted >= totalDistributed) {
            totalAllotted - totalDistributed;
          } else { 0 };
        });
      };
    };

    resultList.toArray();
  };

  // --- Bulk Doctor Upload ---
  public shared ({ caller }) func bulkAddDoctors(doctorsInput : [DoctorInput]) : async [DoctorId] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can perform bulk upload");
    };
    let doctorIds = Array.tabulate(
      doctorsInput.size(),
      func(i) {
        let input = doctorsInput[i];
        let newId = idCounters.nextDoctorId;
        doctors.add(newId, { id = newId; name = input.name; qualification = input.qualification; station = input.station; specialization = input.specialization; areaId = input.areaId; createdBy = caller });
        idCounters := { idCounters with nextDoctorId = newId + 1 };
        newId;
      },
    );
    doctorIds;
  };
};
