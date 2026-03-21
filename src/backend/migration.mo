import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  type UserProfiles = Map.Map<Principal.Principal, { name : Text; employeeCode : Text; headQuarter : Text }>;
  type OldIdCounters = {
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
    nextWorkingPlanId : Nat;
  };

  type OldPersistentState = {
    userProfiles : UserProfiles;
    idCounters : OldIdCounters;
  };

  type NewPersistentState = {
    userProfiles : UserProfiles;
    idCounters : NewIdCounters;
  };

  public func run(old : OldPersistentState) : NewPersistentState {
    {
      userProfiles = old.userProfiles;
      idCounters = {
        old.idCounters with
        nextWorkingPlanId = 1;
      };
    };
  };
};
