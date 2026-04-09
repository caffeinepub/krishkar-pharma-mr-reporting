import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Nat32 "mo:core/Nat32";
import Char "mo:core/Char";
import Runtime "mo:core/Runtime";
import AccessControl "../authorization/access-control";

module {
  // ── Types ──────────────────────────────────────────────────────────────────

  public type StoredUser = {
    userId : Text;
    hashedPassword : Text;
    principalId : Text;   // Text representation of the virtual principal (userId itself)
    role : Text;
    hq : Text;
    isActive : Bool;
    mustChangePassword : Bool;
    createdAt : Int;
  };

  public type SessionInfo = {
    principalId : Text;
    userId : Text;
    expiryNanos : Int;
  };

  public type StaffAccountInfo = {
    userId : Text;
    role : Text;
    hq : Text;
    isActive : Bool;
    mustChangePassword : Bool;
    name : Text;
  };

  public type CustomAuthState = {
    users : Map.Map<Text, StoredUser>;          // keyed by userId
    sessions : Map.Map<Text, SessionInfo>;      // keyed by sessionToken
    var defaultAdminCreated : Bool;
  };

  // ── State helpers ──────────────────────────────────────────────────────────

  public func initState() : CustomAuthState {
    {
      users = Map.empty<Text, StoredUser>();
      sessions = Map.empty<Text, SessionInfo>();
      var defaultAdminCreated = false;
    };
  };

  // ── Constants ──────────────────────────────────────────────────────────────

  let SALT : Text = "krishkar_pharma_salt_2026";
  let SESSION_EXPIRY_NANOS : Int = 86_400_000_000_000; // 24 hours

  // ── Internal helpers ───────────────────────────────────────────────────────

  func textHash(t : Text) : Nat32 {
    t.foldLeft(5381 : Nat32, func(acc : Nat32, c : Char) : Nat32 {
      (acc *% 33) +% Nat32.fromNat(c.toNat32().toNat());
    });
  };

  public func hashPassword(password : Text) : Text {
    let combined = SALT # password;
    let h : Nat32 = textHash(combined);
    h.toText();
  };

  func makeSessionToken(userId : Text, now : Int) : Text {
    let h : Nat32 = textHash(userId # now.toText());
    userId # "_" # h.toText() # "_" # now.toText();
  };

  func isSessionValid(session : SessionInfo, now : Int) : Bool {
    session.expiryNanos > now;
  };

  // Ensure the default admin account exists (called lazily)
  public func ensureDefaultAdmin(state : CustomAuthState) {
    if (not state.defaultAdminCreated) {
      let defaultAdmin : StoredUser = {
        userId = "admin";
        hashedPassword = hashPassword("Admin@1234");
        principalId = "admin";
        role = "admin";
        hq = "";
        isActive = true;
        mustChangePassword = true;
        createdAt = 0;
      };
      state.users.add("admin", defaultAdmin);
      state.defaultAdminCreated := true;
    };
  };

  // Validate that the given token belongs to a live admin session
  func requireAdminSession(state : CustomAuthState, adminToken : Text, now : Int) : ?StoredUser {
    switch (state.sessions.get(adminToken)) {
      case (null) { null };
      case (?session) {
        if (not isSessionValid(session, now)) { null } else {
          switch (state.users.get(session.userId)) {
            case (null) { null };
            case (?u) {
              if (u.role == "admin" and u.isActive) { ?u } else { null };
            };
          };
        };
      };
    };
  };

  // ── Core auth logic ────────────────────────────────────────────────────────

  public func authenticate(
    state : CustomAuthState,
    userId : Text,
    password : Text,
    now : Int,
  ) : { #ok : { sessionToken : Text; userId : Text; role : Text }; #err : Text } {
    ensureDefaultAdmin(state);
    switch (state.users.get(userId)) {
      case (null) { #err("Invalid credentials") };
      case (?user) {
        if (not user.isActive) { return #err("Account is deactivated") };
        let hashed = hashPassword(password);
        if (user.hashedPassword != hashed) { return #err("Invalid credentials") };
        // Remove any expired sessions for this user
        let token = makeSessionToken(userId, now);
        let session : SessionInfo = {
          principalId = user.principalId;
          userId = userId;
          expiryNanos = now + SESSION_EXPIRY_NANOS;
        };
        state.sessions.add(token, session);
        #ok({ sessionToken = token; userId = userId; role = user.role });
      };
    };
  };

  public func validate(
    state : CustomAuthState,
    token : Text,
    now : Int,
  ) : { #ok : { principalId : Text; userId : Text }; #err : Text } {
    switch (state.sessions.get(token)) {
      case (null) { #err("Invalid or expired session") };
      case (?session) {
        if (not isSessionValid(session, now)) {
          state.sessions.remove(token);
          #err("Session expired");
        } else {
          #ok({ principalId = session.principalId; userId = session.userId });
        };
      };
    };
  };

  public func changePass(
    state : CustomAuthState,
    token : Text,
    oldPassword : Text,
    newPassword : Text,
    now : Int,
  ) : { #ok : Text; #err : Text } {
    switch (validate(state, token, now)) {
      case (#err(e)) { #err(e) };
      case (#ok({ userId; principalId = _ })) {
        switch (state.users.get(userId)) {
          case (null) { #err("User not found") };
          case (?user) {
            if (user.hashedPassword != hashPassword(oldPassword)) {
              return #err("Old password is incorrect");
            };
            let updated : StoredUser = { user with
              hashedPassword = hashPassword(newPassword);
              mustChangePassword = false;
            };
            state.users.add(userId, updated);
            #ok("Password changed successfully");
          };
        };
      };
    };
  };

  public func createAccount(
    state : CustomAuthState,
    adminToken : Text,
    userId : Text,
    tempPassword : Text,
    role : Text,
    hq : Text,
    now : Int,
  ) : { #ok : Text; #err : Text } {
    switch (requireAdminSession(state, adminToken, now)) {
      case (null) { #err("Unauthorized: Invalid or expired admin session") };
      case (?_admin) {
        if (state.users.containsKey(userId)) {
          return #err("User ID already exists");
        };
        if (userId == "") { return #err("User ID cannot be empty") };
        let newUser : StoredUser = {
          userId;
          hashedPassword = hashPassword(tempPassword);
          principalId = userId;
          role;
          hq;
          isActive = true;
          mustChangePassword = true;
          createdAt = now;
        };
        state.users.add(userId, newUser);
        #ok("Staff account created successfully");
      };
    };
  };

  public func resetPassword(
    state : CustomAuthState,
    adminToken : Text,
    userId : Text,
    newTempPassword : Text,
    now : Int,
  ) : { #ok : Text; #err : Text } {
    switch (requireAdminSession(state, adminToken, now)) {
      case (null) { #err("Unauthorized: Invalid or expired admin session") };
      case (?_admin) {
        switch (state.users.get(userId)) {
          case (null) { #err("User not found") };
          case (?user) {
            let updated : StoredUser = { user with
              hashedPassword = hashPassword(newTempPassword);
              mustChangePassword = true;
            };
            state.users.add(userId, updated);
            #ok("Password reset successfully");
          };
        };
      };
    };
  };

  public func updateAccount(
    state : CustomAuthState,
    adminToken : Text,
    userId : Text,
    newRole : ?Text,
    newHQ : ?Text,
    isActive : ?Bool,
    now : Int,
  ) : { #ok : Text; #err : Text } {
    switch (requireAdminSession(state, adminToken, now)) {
      case (null) { #err("Unauthorized: Invalid or expired admin session") };
      case (?_admin) {
        switch (state.users.get(userId)) {
          case (null) { #err("User not found") };
          case (?user) {
            let role = switch (newRole) { case (?r) { r }; case null { user.role } };
            let hq = switch (newHQ) { case (?h) { h }; case null { user.hq } };
            let active = switch (isActive) { case (?a) { a }; case null { user.isActive } };
            let updated : StoredUser = { user with role; hq; isActive = active };
            state.users.add(userId, updated);
            #ok("Account updated successfully");
          };
        };
      };
    };
  };

  public func getAllAccounts(
    state : CustomAuthState,
    adminToken : Text,
    now : Int,
  ) : { #ok : [StaffAccountInfo]; #err : Text } {
    switch (requireAdminSession(state, adminToken, now)) {
      case (null) { #err("Unauthorized: Invalid or expired admin session") };
      case (?_admin) {
        let result = state.users.entries().toArray().map(
          func((_key, u) : (Text, StoredUser)) : StaffAccountInfo {
            { userId = u.userId; role = u.role; hq = u.hq; isActive = u.isActive; mustChangePassword = u.mustChangePassword; name = u.userId };
          }
        );
        #ok(result);
      };
    };
  };

  public func logout(
    state : CustomAuthState,
    token : Text,
  ) : { #ok : Text; #err : Text } {
    switch (state.sessions.get(token)) {
      case (null) { #err("Session not found") };
      case (?_) {
        state.sessions.remove(token);
        #ok("Logged out successfully");
      };
    };
  };
};
