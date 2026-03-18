import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";

module {
  type OldIdCounters = {
    nextAreaId : Nat;
    nextDoctorId : Nat;
    nextProductId : Nat;
    nextChemistId : Nat;
    nextHeadquarterId : Nat;
  };

  type OldActor = {
    idCounters : OldIdCounters;
  };

  type NewIdCounters = {
    nextAreaId : Nat;
    nextDoctorId : Nat;
    nextProductId : Nat;
    nextChemistId : Nat;
    nextHeadquarterId : Nat;
    nextSampleAllotmentId : Nat;
    nextDemandOrderId : Nat;
  };

  type NewActor = {
    idCounters : NewIdCounters;
    sampleAllotments : Map.Map<Nat, SampleAllotment>;
    sampleDemandOrders : Map.Map<Nat, SampleDemandOrder>;
  };

  type SampleAllotment = {
    id : Nat;
    targetPrincipal : Principal.Principal;
    productId : Nat;
    quantity : Nat;
    date : Text;
    allocatedBy : Principal.Principal;
  };

  type DemandOrderStatus = { #Pending; #Approved; #Rejected };

  type SampleDemandOrder = {
    id : Nat;
    mrPrincipal : Principal.Principal;
    productId : Nat;
    requestedQty : Nat;
    date : Text;
    notes : Text;
    status : DemandOrderStatus;
  };

  public func run(old : OldActor) : NewActor {
    {
      idCounters = {
        old.idCounters with
        nextSampleAllotmentId = 1;
        nextDemandOrderId = 1;
      };
      sampleAllotments = Map.empty<Nat, SampleAllotment>();
      sampleDemandOrders = Map.empty<Nat, SampleDemandOrder>();
    };
  };
};
