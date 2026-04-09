import CustomAuth "./CustomAuth";
import Time "mo:core/Time";

mixin (customAuthState : CustomAuth.CustomAuthState) {

  public shared func authenticateUser(
    userId : Text,
    password : Text,
  ) : async { #ok : { sessionToken : Text; userId : Text; role : Text }; #err : Text } {
    CustomAuth.authenticate(customAuthState, userId, password, Time.now());
  };

  public shared func validateSession(
    token : Text,
  ) : async { #ok : { principalId : Text; userId : Text }; #err : Text } {
    CustomAuth.validate(customAuthState, token, Time.now());
  };

  public shared func changePassword(
    token : Text,
    oldPassword : Text,
    newPassword : Text,
  ) : async { #ok : Text; #err : Text } {
    CustomAuth.changePass(customAuthState, token, oldPassword, newPassword, Time.now());
  };

  public shared func adminCreateStaffAccount(
    adminToken : Text,
    userId : Text,
    tempPassword : Text,
    role : Text,
    hq : Text,
  ) : async { #ok : Text; #err : Text } {
    CustomAuth.createAccount(customAuthState, adminToken, userId, tempPassword, role, hq, Time.now());
  };

  public shared func adminResetStaffPassword(
    adminToken : Text,
    userId : Text,
    newTempPassword : Text,
  ) : async { #ok : Text; #err : Text } {
    CustomAuth.resetPassword(customAuthState, adminToken, userId, newTempPassword, Time.now());
  };

  public shared func adminUpdateStaffAccount(
    adminToken : Text,
    userId : Text,
    newRole : ?Text,
    newHQ : ?Text,
    isActive : ?Bool,
  ) : async { #ok : Text; #err : Text } {
    CustomAuth.updateAccount(customAuthState, adminToken, userId, newRole, newHQ, isActive, Time.now());
  };

  public shared func adminGetAllStaffAccounts(
    adminToken : Text,
  ) : async { #ok : [CustomAuth.StaffAccountInfo]; #err : Text } {
    CustomAuth.getAllAccounts(customAuthState, adminToken, Time.now());
  };

  public shared func logoutUser(
    token : Text,
  ) : async { #ok : Text; #err : Text } {
    CustomAuth.logout(customAuthState, token);
  };
};
