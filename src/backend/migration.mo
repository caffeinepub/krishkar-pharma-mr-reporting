import Map "mo:core/Map";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";

module {
  type UserProfile = {
    name : Text;
    employeeCode : Text;
    headQuarter : Text;
  };

  type MRProfile = {
    employeeCode : Text;
    headQuarter : Text;
    assignedAreas : [Nat];
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

  type OldExpenseEntry = {
    date : Text;
    kmTraveled : Nat;
    taAmount : Nat;
    daAmount : Nat;
    notes : Text;
  };

  type NewExpenseEntry = {
    date : Text;
    kmTraveled : Nat;
    taAmount : Nat;
    daAmount : Nat;
    notes : Text;
    workingArea : Text;
    daType : Text;
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

  type SampleAllotment = {
    id : Nat;
    targetPrincipal : Principal;
    productId : ProductId;
    quantity : Nat;
    date : Text;
    allocatedBy : Principal;
  };

  type SampleDemandOrder = {
    id : Nat;
    mrPrincipal : Principal;
    productId : ProductId;
    requestedQty : Nat;
    date : Text;
    notes : Text;
    status : { #Pending; #Approved; #Rejected };
  };

  type ManagerAreaAssignment = {
    areaIds : [AreaId];
  };

  type CRMDemandId = Nat;
  type CRMStatus = { #Pending; #Approved; #Rejected };
  type CRMDemand = {
    id : CRMDemandId;
    doctorId : DoctorId;
    doctorName : Text;
    amount : Nat;
    notes : Text;
    status : CRMStatus;
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


  type TADASettings = {
    mrTaPerKm : Nat;
    mrDaDefault : Nat;
    asmTaPerKm : Nat;
    asmDaDefault : Nat;
    rsmTaPerKm : Nat;
    rsmDaDefault : Nat;
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

  type OldActor = {
    userProfiles : Map.Map<Principal, UserProfile>;
    mrProfiles : Map.Map<Principal, MRProfile>;
    managerProfiles : Map.Map<Principal, ManagerProfile>;
    areas : Map.Map<AreaId, Area>;
    doctors : Map.Map<DoctorId, Doctor>;
    products : Map.Map<ProductId, Product>;
    chemists : Map.Map<ChemistId, Chemist>;
    detailingEntries : Map.Map<Principal, List.List<DetailingEntry>>;
    sampleEntries : Map.Map<Principal, List.List<SampleEntry>>;
    chemistOrders : Map.Map<Principal, List.List<{ chemistId : ChemistId; date : Text; productId : ProductId; quantity : Nat; scheme : Text; status : OrderStatus }>>;
    expenseEntries : Map.Map<Principal, List.List<OldExpenseEntry>>;
    leaveEntries : Map.Map<Principal, List.List<LeaveEntry>>;
    headquarters : Map.Map<Nat, Headquarter>;
    sampleAllotments : Map.Map<Nat, SampleAllotment>;
    sampleDemandOrders : Map.Map<Nat, SampleDemandOrder>;
    managerAreaAssignments : Map.Map<Principal, ManagerAreaAssignment>;
    crmDemands : Map.Map<CRMDemandId, CRMDemand>;
    giftArticles : Map.Map<GiftArticleId, GiftArticle>;
    giftDistributions : Map.Map<GiftDistributionId, GiftDistribution>;
    giftDemandOrders : Map.Map<GiftDemandOrderId, GiftDemandOrder>;
    tadaSettings : TADASettings;
    idCounters : IdCounters;
  };

  type NewActor = {
    userProfiles : Map.Map<Principal, UserProfile>;
    mrProfiles : Map.Map<Principal, MRProfile>;
    managerProfiles : Map.Map<Principal, ManagerProfile>;
    areas : Map.Map<AreaId, Area>;
    doctors : Map.Map<DoctorId, Doctor>;
    products : Map.Map<ProductId, Product>;
    chemists : Map.Map<ChemistId, Chemist>;
    detailingEntries : Map.Map<Principal, List.List<DetailingEntry>>;
    sampleEntries : Map.Map<Principal, List.List<SampleEntry>>;
    chemistOrders : Map.Map<Principal, List.List<{ chemistId : ChemistId; date : Text; productId : ProductId; quantity : Nat; scheme : Text; status : OrderStatus }>>;
    expenseEntries : Map.Map<Principal, List.List<NewExpenseEntry>>;
    leaveEntries : Map.Map<Principal, List.List<LeaveEntry>>;
    headquarters : Map.Map<Nat, Headquarter>;
    sampleAllotments : Map.Map<Nat, SampleAllotment>;
    sampleDemandOrders : Map.Map<Nat, SampleDemandOrder>;
    managerAreaAssignments : Map.Map<Principal, ManagerAreaAssignment>;
    crmDemands : Map.Map<CRMDemandId, CRMDemand>;
    giftArticles : Map.Map<GiftArticleId, GiftArticle>;
    giftDistributions : Map.Map<GiftDistributionId, GiftDistribution>;
    giftDemandOrders : Map.Map<GiftDemandOrderId, GiftDemandOrder>;
    tadaSettings : TADASettings;
    idCounters : IdCounters;
  };

  public func run(old : OldActor) : NewActor {
    let newExpenseEntries = old.expenseEntries.map<Principal, List.List<OldExpenseEntry>, List.List<NewExpenseEntry>>(
      func(_p, oldList) {
        oldList.map(
          func(oldEntry) {
            {
              oldEntry with
              workingArea = "";
              daType = "";
            };
          }
        );
      }
    );

    { old with expenseEntries = newExpenseEntries };
  };
};
