import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { TADASettingsV3 } from "../../backend.d";
import { useActor } from "../../hooks/useActor";

const TA_SCALE = 100;

const DEFAULT_FORM = {
  mrTaPerKm: "8.00",
  mrDaHQ: "300",
  mrDaOutStation: "400",
  mrDaExStation: "350",
  asmTaPerKm: "10.00",
  asmDaHQ: "500",
  asmDaOutStation: "700",
  asmDaExStation: "600",
  rsmTaPerKm: "12.00",
  rsmDaHQ: "700",
  rsmDaOutStation: "1000",
  rsmDaExStation: "850",
};

type SettingsForm = typeof DEFAULT_FORM;

function toForm(s: TADASettingsV3): SettingsForm {
  return {
    mrTaPerKm: (Number(s.mrTaPerKm) / TA_SCALE).toFixed(2),
    mrDaHQ: s.mrDaHQ.toString(),
    mrDaOutStation: s.mrDaOutStation.toString(),
    mrDaExStation: s.mrDaExStation?.toString() ?? "350",
    asmTaPerKm: (Number(s.asmTaPerKm) / TA_SCALE).toFixed(2),
    asmDaHQ: s.asmDaHQ.toString(),
    asmDaOutStation: s.asmDaOutStation.toString(),
    asmDaExStation: s.asmDaExStation?.toString() ?? "600",
    rsmTaPerKm: (Number(s.rsmTaPerKm) / TA_SCALE).toFixed(2),
    rsmDaHQ: s.rsmDaHQ.toString(),
    rsmDaOutStation: s.rsmDaOutStation.toString(),
    rsmDaExStation: s.rsmDaExStation?.toString() ?? "850",
  };
}

function fromForm(f: SettingsForm): TADASettingsV3 {
  return {
    mrTaPerKm: BigInt(
      Math.round(Number.parseFloat(f.mrTaPerKm || "0") * TA_SCALE),
    ),
    mrDaHQ: BigInt(Number.parseInt(f.mrDaHQ || "0")),
    mrDaOutStation: BigInt(Number.parseInt(f.mrDaOutStation || "0")),
    mrDaExStation: BigInt(Number.parseInt(f.mrDaExStation || "0")),
    asmTaPerKm: BigInt(
      Math.round(Number.parseFloat(f.asmTaPerKm || "0") * TA_SCALE),
    ),
    asmDaHQ: BigInt(Number.parseInt(f.asmDaHQ || "0")),
    asmDaOutStation: BigInt(Number.parseInt(f.asmDaOutStation || "0")),
    asmDaExStation: BigInt(Number.parseInt(f.asmDaExStation || "0")),
    rsmTaPerKm: BigInt(
      Math.round(Number.parseFloat(f.rsmTaPerKm || "0") * TA_SCALE),
    ),
    rsmDaHQ: BigInt(Number.parseInt(f.rsmDaHQ || "0")),
    rsmDaOutStation: BigInt(Number.parseInt(f.rsmDaOutStation || "0")),
    rsmDaExStation: BigInt(Number.parseInt(f.rsmDaExStation || "0")),
  };
}

export default function AdminTADASettingsV3() {
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

  const handleTaChange = (key: keyof SettingsForm, value: string) => {
    if (value !== "" && !/^\d*\.?\d{0,2}$/.test(value)) return;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleDaChange = (key: keyof SettingsForm, value: string) => {
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
      daHQKey: "mrDaHQ" as keyof SettingsForm,
      daOutKey: "mrDaOutStation" as keyof SettingsForm,
      daExKey: "mrDaExStation" as keyof SettingsForm,
    },
    {
      label: "Area Sales Manager (ASM)",
      color: "bg-green-50 border-green-200",
      taKey: "asmTaPerKm" as keyof SettingsForm,
      daHQKey: "asmDaHQ" as keyof SettingsForm,
      daOutKey: "asmDaOutStation" as keyof SettingsForm,
      daExKey: "asmDaExStation" as keyof SettingsForm,
    },
    {
      label: "Regional Sales Manager (RSM)",
      color: "bg-purple-50 border-purple-200",
      taKey: "rsmTaPerKm" as keyof SettingsForm,
      daHQKey: "rsmDaHQ" as keyof SettingsForm,
      daOutKey: "rsmDaOutStation" as keyof SettingsForm,
      daExKey: "rsmDaExStation" as keyof SettingsForm,
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
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-semibold">TA / DA Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Set Travel Allowance (TA) per KM and Daily Allowance (DA) for Head
          Quarter, Out Station, and Ex-Station separately for each role.
        </p>
      </div>

      <div className="space-y-4">
        {roles.map((role) => (
          <Card key={role.label} className={`border ${role.color}`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{role.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor={role.taKey}>TA Per KM (₹)</Label>
                  <Input
                    id={role.taKey}
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="e.g. 8.75"
                    value={form[role.taKey]}
                    onChange={(e) => handleTaChange(role.taKey, e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    2 decimal places
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={role.daHQKey}>DA - Head Quarter (₹)</Label>
                  <Input
                    id={role.daHQKey}
                    type="number"
                    min={0}
                    placeholder="e.g. 300"
                    value={form[role.daHQKey]}
                    onChange={(e) =>
                      handleDaChange(role.daHQKey, e.target.value)
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={role.daOutKey}>DA - Out Station (₹)</Label>
                  <Input
                    id={role.daOutKey}
                    type="number"
                    min={0}
                    placeholder="e.g. 400"
                    value={form[role.daOutKey]}
                    onChange={(e) =>
                      handleDaChange(role.daOutKey, e.target.value)
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={role.daExKey}>DA - Ex-Station (₹)</Label>
                  <Input
                    id={role.daExKey}
                    type="number"
                    min={0}
                    placeholder="e.g. 350"
                    value={form[role.daExKey]}
                    onChange={(e) =>
                      handleDaChange(role.daExKey, e.target.value)
                    }
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
