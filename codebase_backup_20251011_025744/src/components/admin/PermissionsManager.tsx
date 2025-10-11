import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Role { id: string; name: string; description: string | null }
interface Permission { id: string; key: string; description: string | null }
interface RolePermission { role_id: string; permission_id: string }

export default function PermissionsManager() {
  const { toast } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [perms, setPerms] = useState<Permission[]>([]);
  const [rolePerms, setRolePerms] = useState<Record<string, Set<string>>>({});
  const [loading, setLoading] = useState(true);

  // Create forms
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [newPermKey, setNewPermKey] = useState("");
  const [newPermDesc, setNewPermDesc] = useState("");

  // Assignment by email
  const [assignEmail, setAssignEmail] = useState("");
  const [assignRoleId, setAssignRoleId] = useState<string>("");
  const [assigning, setAssigning] = useState(false);

  const roleById = useMemo(() => Object.fromEntries(roles.map(r => [r.id, r])), [roles]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [{ data: r, error: re }, { data: p, error: pe }, { data: rp, error: rpe }] = await Promise.all([
        supabase.from("roles").select("id,name,description").order("name"),
        supabase.from("permissions").select("id,key,description").order("key"),
        supabase.from("role_permissions").select("role_id,permission_id"),
      ]);
      if (re) throw re; if (pe) throw pe; if (rpe) throw rpe;
      setRoles(r || []);
      setPerms(p || []);
      const map: Record<string, Set<string>> = {};
      (rp || []).forEach((row: RolePermission) => {
        if (!map[row.role_id]) map[row.role_id] = new Set();
        map[row.role_id].add(row.permission_id);
      });
      setRolePerms(map);
    } catch (e: any) {
      toast({ title: "Failed to load RBAC", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const createRole = async () => {
    if (!newRoleName.trim()) return;
    const { error } = await supabase.from("roles").insert({ name: newRoleName.trim(), description: newRoleDesc || null });
    if (error) return toast({ title: "Could not create role", description: error.message, variant: "destructive" });
    setNewRoleName(""); setNewRoleDesc("");
    toast({ title: "Role created" });
    loadAll();
  };

  const createPerm = async () => {
    if (!newPermKey.trim()) return;
    const { error } = await supabase.from("permissions").insert({ key: newPermKey.trim(), description: newPermDesc || null });
    if (error) return toast({ title: "Could not create permission", description: error.message, variant: "destructive" });
    setNewPermKey(""); setNewPermDesc("");
    toast({ title: "Permission created" });
    loadAll();
  };

  const toggle = async (roleId: string, permId: string, checked: boolean) => {
    if (checked) {
      const { error } = await supabase.from("role_permissions").insert({ role_id: roleId, permission_id: permId });
      if (error) return toast({ title: "Failed to grant", description: error.message, variant: "destructive" });
      setRolePerms(prev => ({ ...prev, [roleId]: new Set([...(prev[roleId] || new Set()), permId]) }));
    } else {
      const { error } = await supabase.from("role_permissions").delete().eq("role_id", roleId).eq("permission_id", permId);
      if (error) return toast({ title: "Failed to revoke", description: error.message, variant: "destructive" });
      setRolePerms(prev => { const next = { ...prev }; const s = new Set(next[roleId] || []); s.delete(permId); next[roleId] = s; return next; });
    }
  };

  const assignRoleByEmail = async () => {
    if (!assignEmail.trim() || !assignRoleId) return;
    setAssigning(true);
    try {
      const roleName = roleById[assignRoleId]?.name;
      const { data, error } = await supabase.rpc("grant_named_role_by_email", { _email: assignEmail.trim(), _role_name: roleName });
      if (error) throw error;
      if (data === false) {
        toast({ title: "User not found", description: "Ask the user to sign up first, then try again.", variant: "destructive" });
      } else {
        toast({ title: "Role assigned", description: `${assignEmail} ← ${roleName}` });
      }
    } catch (e: any) {
      toast({ title: "Assignment failed", description: e.message, variant: "destructive" });
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">Permissions</h2>
        <p className="text-muted-foreground">Manage roles, permissions, and assignments.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Assign role to user</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="assign-email">User email</Label>
            <Input id="assign-email" placeholder="user@example.com" value={assignEmail} onChange={(e) => setAssignEmail(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="assign-role">Role</Label>
            <select id="assign-role" className="w-full rounded-md border bg-background p-2" value={assignRoleId} onChange={(e) => setAssignRoleId(e.target.value)}>
              <option value="">Select a role…</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <Button onClick={assignRoleByEmail} disabled={assigning || !assignEmail || !assignRoleId} className="w-full">Assign</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Roles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input placeholder="Role name (unique)" value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} />
              <Input placeholder="Description (optional)" value={newRoleDesc} onChange={(e) => setNewRoleDesc(e.target.value)} />
              <Button onClick={createRole} disabled={!newRoleName.trim()}>Create role</Button>
            </div>
            <Separator />
            <div className="space-y-2 max-h-64 overflow-auto">
              {roles.map((r) => (
                <div key={r.id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{r.name}</div>
                    {r.description && <div className="text-sm text-muted-foreground">{r.description}</div>}
                  </div>
                </div>
              ))}
              {roles.length === 0 && <div className="text-sm text-muted-foreground">No roles yet.</div>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Permissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input placeholder="permission:key" value={newPermKey} onChange={(e) => setNewPermKey(e.target.value)} />
              <Input placeholder="Description (optional)" value={newPermDesc} onChange={(e) => setNewPermDesc(e.target.value)} />
              <Button onClick={createPerm} disabled={!newPermKey.trim()}>Create permission</Button>
            </div>
            <Separator />
            <div className="space-y-2 max-h-64 overflow-auto">
              {perms.map((p) => (
                <div key={p.id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{p.key}</div>
                    {p.description && <div className="text-sm text-muted-foreground">{p.description}</div>}
                  </div>
                </div>
              ))}
              {perms.length === 0 && <div className="text-sm text-muted-foreground">No permissions yet.</div>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Role → Permission matrix</CardTitle>
        </CardHeader>
        <CardContent className="overflow-auto">
          {loading ? (
            <div className="p-4">Loading…</div>
          ) : roles.length === 0 || perms.length === 0 ? (
            <div className="text-sm text-muted-foreground">Create roles and permissions to begin.</div>
          ) : (
            <div className="inline-block min-w-full">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left p-2">Permission</th>
                    {roles.map((r) => (
                      <th key={r.id} className="text-left p-2">{r.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {perms.map((p) => (
                    <tr key={p.id} className="border-t">
                      <td className="p-2 align-top">
                        <div className="font-medium">{p.key}</div>
                        {p.description && <div className="text-muted-foreground">{p.description}</div>}
                      </td>
                      {roles.map((r) => {
                        const assigned = rolePerms[r.id]?.has(p.id) || false;
                        return (
                          <td key={r.id + p.id} className="p-2">
                            <Checkbox checked={assigned} onCheckedChange={(c) => toggle(r.id, p.id, Boolean(c))} />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
