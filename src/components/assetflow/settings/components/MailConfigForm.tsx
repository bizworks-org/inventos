import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface MailConfigFormProps {
  mailForm: {
    host: string;
    port: string;
    secure: boolean;
    user: string;
    password: string;
    fromName: string;
    fromEmail: string;
  };
  mailTestTo: string;
  mailMsg: string | null;
  mailTestBusy: boolean;
  onFormChange: (updates: Partial<MailConfigFormProps["mailForm"]>) => void;
  onTestToChange: (value: string) => void;
  onVerifySmtp: () => void;
  onSaveConfig: () => void;
  onSendTestEmail: () => void;
  onSendTestToMe: () => void;
}

export function MailConfigForm({
  mailForm,
  mailTestTo,
  mailMsg,
  mailTestBusy,
  onFormChange,
  onTestToChange,
  onVerifySmtp,
  onSaveConfig,
  onSendTestEmail,
  onSendTestToMe,
}: Readonly<MailConfigFormProps>) {
  return (
    <Card className="border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Mail Server Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="mb-1 block">
              SMTP Host<span className="text-red-500"> *</span>
            </Label>
            <Input
              value={mailForm.host}
              onChange={(e) => onFormChange({ host: e.target.value })}
              placeholder="smtp.example.com"
            />
          </div>
          <div>
            <Label className="mb-1 block">
              Port<span className="text-red-500"> *</span>
            </Label>
            <Input
              type="number"
              value={mailForm.port}
              onChange={(e) => onFormChange({ port: e.target.value })}
              placeholder="587"
            />
          </div>
          <div>
            <Label className="mb-1 block">Username</Label>
            <Input
              value={mailForm.user}
              onChange={(e) => onFormChange({ user: e.target.value })}
              placeholder="Optional"
            />
          </div>
          <div>
            <Label className="mb-1 block">Password</Label>
            <Input
              type="password"
              value={mailForm.password}
              onChange={(e) => onFormChange({ password: e.target.value })}
              placeholder="Optional"
            />
          </div>
          <div>
            <Label className="mb-1 block">From Name</Label>
            <Input
              value={mailForm.fromName}
              onChange={(e) => onFormChange({ fromName: e.target.value })}
              placeholder="AssetFlow"
            />
          </div>
          <div>
            <Label className="mb-1 block">
              From Email<span className="text-red-500"> *</span>
            </Label>
            <Input
              type="email"
              value={mailForm.fromEmail}
              onChange={(e) => onFormChange({ fromEmail: e.target.value })}
              placeholder="no-reply@example.com"
            />
          </div>
        </div>

        {mailMsg && (
          <p
            className={`text-sm ${
              mailMsg.startsWith("OK") ? "text-green-600" : "text-red-600"
            }`}
          >
            {mailMsg}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-[#6366f1] text-[#6366f1] hover:bg-[#eef2ff]"
              disabled={mailTestBusy}
              onClick={onVerifySmtp}
            >
              {mailTestBusy ? "Verifying…" : "Verify SMTP"}
            </Button>
            <Button
              type="button"
              className="bg-gradient-to-r from-[#06b6d4] to-[#3b82f6] text-white hover:shadow-lg hover:shadow-[#06b6d4]/20"
              onClick={onSaveConfig}
            >
              Save SMTP Config
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Send test to (email)"
              value={mailTestTo}
              onChange={(e) => onTestToChange(e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              className="border-[#10b981] text-[#10b981] hover:bg-[#dcfce7]"
              onClick={onSendTestEmail}
            >
              Send Test Email
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-[#0ea5e9] text-[#0ea5e9] hover:bg-[#e0f2fe]"
              onClick={onSendTestToMe}
            >
              Send to me
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
