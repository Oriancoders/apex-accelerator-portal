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
import { validateFiles } from "@/utils/file-validation";
import type { Database } from "@/integrations/supabase/types";

type Priority = Database["public"]["Enums"]["ticket_priority"];

export default function NewTicketPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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
    if (!user || !description.trim() || !title.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setLoading(true);

    let fileUrls: string[] = [];
    for (const file of files) {
      // Sanitize filename to prevent path traversal
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${user.id}/${Date.now()}-${safeName}`;
      const { error } = await supabase.storage
        .from("ticket-attachments")
        .upload(path, file, { contentType: file.type });
      if (!error) fileUrls.push(path);
    }

    const { error } = await supabase.from("tickets").insert({
      user_id: user.id,
      title,
      description,
      priority,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      file_urls: fileUrls.length > 0 ? fileUrls : null,
    });

    if (error) {
      toast.error("Failed to submit ticket: " + error.message);
    } else {
      toast.success("Ticket submitted successfully!");
      navigate("/tickets");
    }
    setLoading(false);
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
                  <input type="file" multiple onChange={handleFileChange} className="hidden" id="file-upload" />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {files.length > 0 ? `${files.length} file(s) selected` : "Click to upload files"}
                    </p>
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
