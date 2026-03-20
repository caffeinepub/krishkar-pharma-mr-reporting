import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { TADASettings } from "../../backend.d";
import { useActor } from "../../hooks/useActor";

const DEFAULT_FORM = {
  mrTaPerKm: "8",
  mrDaDefault: "300",
  asmTaPerKm: "10",
  asmDaDefault: "500",
  rsmTaPerKm: "12",
  rsmDaDefault: "700",
};

type SettingsForm = typeof DEFAULT_FORM;

function toForm(s: TADASettings): SettingsForm {
  return {
    mrTaPerKm: s.mrTaPerKm.toString(),
    mrDaDefault: s.mrDaDefault.toString(),
    asmTaPerKm: s.asmTaPerKm.toString(),
    asmDaDefault: s.asmDaDefault.toString(),
    rsmTaPerKm: s.rsmTaPerKm.toString(),
    rsmDaDefault: s.rsmDaDefault.toString(),
  };
}

function fromForm(f: SettingsForm): TADASettings {
  return {
    mrTaPerKm: BigInt(f.mrTaPerKm || "0"),
    mrDaDefault: BigInt(f.mrDaDefault || "0"),
    asmTaPerKm: BigInt(f.asmTaPerKm || "0"),
    asmDaDefault: BigInt(f.asmDaDefault || "0"),
    rsmTaPerKm: BigInt(f.rsmTaPerKm || "0"),
    rsmDaDefault: BigInt(f.rsmDaDefault || "0"),
  };
}

export default function AdminTADASettings() {
  const { actor, isFetching } = useActor();
  const [form, setForm] = useState<SettingsForm>(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!actor || isFetching) return;
    actor
      .adminGetTADASettings()
      .then((s) => setForm(toForm(s)))
      .catch(() => toast.error("Failed to load TA/DA settings"))
      .finally(() => setLoading(false));
  }, [actor, isFetching]);

  const handleChange = (key: keyof SettingsForm, value: string) => {
    if (value !== "" && !/^\d+$/.test(value)) return;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!actor) return;
    setSaving(true);
    try {
      await actor.adminSetTADASettings(fromForm(form));
      toast.success("TA/DA settings saved successfully");
    } catch {
      toast.error("Failed to save TA/DA settings");
    } finally {
      setSaving(false);
    }
  };

  const roles = [
    {
      label: "Medical Representative (MR)",
      color: "bg-blue-50 border-blue-200",
      taKey: "mrTaPerKm" as keyof SettingsForm,
      daKey: "mrDaDefault" as keyof SettingsForm,
    },
    {
      label: "Area Sales Manager (ASM)",
      color: "bg-green-50 border-green-200",
      taKey: "asmTaPerKm" as keyof SettingsForm,
      daKey: "asmDaDefault" as keyof SettingsForm,
    },
    {
      label: "Regional Sales Manager (RSM)",
      color: "bg-purple-50 border-purple-200",
      taKey: "rsmTaPerKm" as keyof SettingsForm,
      daKey: "rsmDaDefault" as keyof SettingsForm,
    },
  ];

  if (loading || isFetching) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-semibold">TA / DA Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Set Travel Allowance (TA) per KM and Daily Allowance (DA) default
          amount separately for each role. These rates apply when calculating
          expense reimbursements.
        </p>
      </div>

      <div className="space-y-4">
        {roles.map((role) => (
          <Card key={role.label} className={`border ${role.color}`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{role.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor={role.taKey}>TA Per KM (₹)</Label>
                  <Input
                    id={role.taKey}
                    type="number"
                    min={0}
                    placeholder="e.g. 8"
                    value={form[role.taKey]}
                    onChange={(e) => handleChange(role.taKey, e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={role.daKey}>DA Default Amount (₹)</Label>
                  <Input
                    id={role.daKey}
                    type="number"
                    min={0}
                    placeholder="e.g. 300"
                    value={form[role.daKey]}
                    onChange={(e) => handleChange(role.daKey, e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        onClick={handleSave}
        disabled={saving || !actor}
        className="w-full sm:w-auto"
      >
        {saving ? "Saving..." : "Save TA/DA Settings"}
      </Button>
    </div>
  );
}
