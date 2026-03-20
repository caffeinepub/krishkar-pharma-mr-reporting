import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";

module {
  type UserProfile = {
    name : Text;
    employeeCode : Text;
    headQuarter : Text;
  };

  type ManagerRole = { #RSM; #ASM };
  type ManagerProfile = {
    name : Text;
    employeeCode : Text;
    headQuarter : Text;
    managerRole : ManagerRole;
  };

  type Area = {
    id : Nat;
    name : Text;
    headquarterId : Nat;
    createdBy : Principal;
  };

  type Headquarter = {
    id : Nat;
    name : Text;
    createdBy : Principal;
  };

  type DetailedEntry = {
    doctorId : Nat;
    date : Text;
    productIds : [Nat];
  };

  type SampleEntry = {
    doctorId : Nat;
    date : Text;
    productId : Nat;
    quantity : Nat;
  };

  type ChemistOrder = {
    chemistId : Nat;
    date : Text;
    productId : Nat;
    quantity : Nat;
    scheme : Text;
    status : { #pending; #fulfilled };
  };

  type ExpenseEntry = {
    date : Text;
    kmTraveled : Nat;
    taAmount : Nat;
    daAmount : Nat;
    notes : Text;
  };

  type LeaveEntry = {
    leaveType : {
      #CasualLeave;
      #SickLeave;
      #EarnedLeave;
      #PrivilegeLeave;
      #WithoutPayLeave;
    };
    fromDate : Text;
    toDate : Text;
    days : Nat;
    reason : Text;
    status : { #Pending; #Approved; #Rejected };
  };

  type OldIdCounters = {
    nextAreaId : Nat;
    nextDoctorId : Nat;
    nextProductId : Nat;
    nextChemistId : Nat;
    nextHeadquarterId : Nat;
    nextSampleAllotmentId : Nat;
    nextDemandOrderId : Nat;
  };

  type NewIdCounters = {
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

  type OldActor = {
    userProfiles : Map.Map<Principal, UserProfile>;
    managerProfiles : Map.Map<Principal, ManagerProfile>;
    areas : Map.Map<Nat, Area>;
    headquarters : Map.Map<Nat, Headquarter>;
    chemistOrders : Map.Map<Principal, List.List<ChemistOrder>>;
    expenseEntries : Map.Map<Principal, List.List<ExpenseEntry>>;
    detailingEntries : Map.Map<Principal, List.List<DetailedEntry>>;
    sampleEntries : Map.Map<Principal, List.List<SampleEntry>>;
    leaveEntries : Map.Map<Principal, List.List<LeaveEntry>>;
    idCounters : OldIdCounters;
  };

  type NewActor = {
    userProfiles : Map.Map<Principal, UserProfile>;
    managerProfiles : Map.Map<Principal, ManagerProfile>;
    areas : Map.Map<Nat, Area>;
    headquarters : Map.Map<Nat, Headquarter>;
    chemistOrders : Map.Map<Principal, List.List<ChemistOrder>>;
    expenseEntries : Map.Map<Principal, List.List<ExpenseEntry>>;
    detailingEntries : Map.Map<Principal, List.List<DetailedEntry>>;
    sampleEntries : Map.Map<Principal, List.List<SampleEntry>>;
    leaveEntries : Map.Map<Principal, List.List<LeaveEntry>>;
    idCounters : NewIdCounters;
  };

  public func run(old : OldActor) : NewActor {
    let oldCounters = old.idCounters;
    let newCounters : NewIdCounters = {
      oldCounters with
      nextCRMDemandId = 1;
      nextGiftArticleId = 1;
      nextGiftDistributionId = 1;
      nextGiftDemandOrderId = 1;
    };
    { old with idCounters = newCounters };
  };
};
