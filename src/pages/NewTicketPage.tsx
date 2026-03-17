import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedLayout from "@/components/ProtectedLayout";
import TipTapEditor from "@/components/TipTapEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Upload, Send } from "lucide-react";
import { useAgentTenant } from "@/hooks/useAgentTenant";
import { validateFiles, ALLOWED_FILE_TYPES } from "@/utils/file-validation";
import { sanitizeTicketHtml } from "@/lib/sanitize";
import { Database } from "@/integrations/supabase/types";

type Priority = Database["public"]["Enums"]["ticket_priority"];

export default function NewTicketPage() {
  const { user, profile } = useAuth();
  const { activeCompany, memberships, isLoading: isTenantLoading } = useAgentTenant();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");

  // Initialize selected company from active company or profile
  useState(() => {
    // 1. Try active company (from membership)
    if (activeCompany?.id) {
      setSelectedCompanyId(activeCompany.id);
    } 
    // 2. Fallback to profile's company_id (if not in memberships but linked in profile)
    // @ts-ignore - profile might not have company_id typed yet
    else if (profile?.company_id) {
      // @ts-ignore
      setSelectedCompanyId(profile.company_id);
    }
  });

  // Ensure it updates if data loads late
  if (!selectedCompanyId) {
    if (activeCompany?.id) setSelectedCompanyId(activeCompany.id);
    // @ts-ignore
    else if (profile?.company_id) setSelectedCompanyId(profile.company_id);
  }

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [contactEmail, setContactEmail] = useState(profile?.email || "");
  const [contactPhone, setContactPhone] = useState(profile?.phone || "");
  const [files, setFiles] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setFiles(validateFiles(Array.from(e.target.files)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();

    if (!user) {
      toast.error("You must be signed in.");
      return;
    }
    if (!trimmedTitle || !trimmedDesc) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (trimmedTitle.length > 200) {
      toast.error("Title must be less than 200 characters.");
      return;
    }
    if (trimmedDesc.length > 10000) {
      toast.error("Description is too long (max 10,000 characters).");
      return;
    }
    // Email format validation if provided
    if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) {
      toast.error("Please enter a valid contact email.");
      return;
    }

    setLoading(true);

    try {
      let fileUrls: string[] = [];
      for (const file of files) {
        // Sanitize filename to prevent path traversal
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${user.id}/${Date.now()}-${safeName}`;
        const { error } = await supabase.storage
          .from("ticket-attachments")
          .upload(path, file, { contentType: file.type });
        if (error) {
          toast.error(`Failed to upload "${file.name}". Please try another file or retry.`);
          setLoading(false);
          return;
        }
        fileUrls.push(path);
      }

      let companyIdToUse = selectedCompanyId || activeCompany?.id;
      
      // Fallback Strategy: If no company selected or found in context
      if (!companyIdToUse) {
        // 1. Direct Primary Source: Check company_memberships table
        const { data: memberData, error: memError } = await supabase
          .from('company_memberships')
          .select('company_id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();

        if (memberData?.company_id) {
          companyIdToUse = memberData.company_id;
        } else {
           // 2. Secondary Source: Check profile (in case sync trigger worked but membership query failed for some reason)
           const { data: freshProfile } = await supabase
            .from('profiles')
            .select('company_id')
            .eq('user_id', user.id)
            .maybeSingle();

           // @ts-ignore
           if (freshProfile?.company_id) {
             // @ts-ignore
             companyIdToUse = freshProfile.company_id;
           }
        }
      }

      const { error } = await supabase.from("tickets").insert({
        user_id: user.id,
        // @ts-ignore - Supabase type might not be updated yet
        company_id: companyIdToUse || null,
        title: trimmedTitle,
        description: sanitizeTicketHtml(trimmedDesc),
        priority,
        contact_email: contactEmail.trim() || null,
        contact_phone: contactPhone.trim() || null,
        file_urls: fileUrls.length > 0 ? fileUrls : null,
      });

      if (error) {
        toast.error("Failed to submit ticket. Please try again.");
      } else {
        toast.success("Ticket submitted successfully!");
        const targetMembership = memberships.find((m) => m.company_id === companyIdToUse);
        const targetSlug = targetMembership?.companies?.slug || activeCompany?.slug;
        navigate(targetSlug ? `/${targetSlug}/tickets` : "/tickets");
      }
    } catch (err) {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedLayout>
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Submit a Service Request</CardTitle>
            {activeCompany && !selectedCompanyId && memberships.length <= 1 && (
              <p className="text-sm text-muted-foreground">Creating for company: <span className="font-medium text-foreground">{activeCompany.name}</span></p>
            )}
            {memberships.length > 1 && (
              <div className="pt-2 flex items-center gap-2">
                <Label className="text-xs font-semibold uppercase text-muted-foreground whitespace-nowrap">Creating for:</Label>
                <select 
                  value={selectedCompanyId} 
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  className="h-8 rounded-md border border-input bg-background px-2 text-sm w-full max-w-xs"
                >
                  <option value="" disabled>Select Company</option>
                  {memberships.map((m) => (
                    <option key={m.company_id} value={m.company_id}>
                      {m.companies?.name || m.company_id} {m.is_primary ? "(Primary)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input value={profile?.full_name || ""} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">🟢 Low</SelectItem>
                      <SelectItem value="medium">🟡 Medium</SelectItem>
                      <SelectItem value="high">🟠 High</SelectItem>
                      <SelectItem value="critical">🔴 Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contact Email</Label>
                  <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="you@company.com" />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Brief summary of your request" required />
              </div>

              <div className="space-y-2">
                <Label>Requirements *</Label>
                <TipTapEditor content={description} onChange={setDescription} />
              </div>

              <div className="space-y-2">
                <Label>Attachments</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <input type="file" multiple accept={ALLOWED_FILE_TYPES.join(",")} onChange={handleFileChange} className="hidden" id="file-upload" />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {files.length > 0 ? `${files.length} file(s) selected` : "Click to upload files"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Allowed: PDF, JPG, PNG (max 10MB each)</p>
                  </label>
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full gap-2" size="lg">
                <Send className="h-4 w-4" />
                {loading ? "Submitting..." : "Submit Ticket"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </ProtectedLayout>
  );
}
