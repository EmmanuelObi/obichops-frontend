"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useSession } from "next-auth/react";
import { Settings2 } from "lucide-react";
import { toast } from "sonner";

import type { WorkspaceSettings } from "@/types/platform";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/lib/api-client";

const TIMEZONE_OPTIONS = [
  "Africa/Lagos",
  "Africa/Johannesburg",
  "Africa/Cairo",
  "Europe/London",
  "Europe/Paris",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Asia/Dubai",
  "Asia/Singapore",
  "UTC",
] as const;

const settingsSchema = z.object({
  timezone: z.string().min(1, "Timezone is required"),
  allowedEmailDomains: z.string(),
  defaultMaxOrderAmountNaira: z
    .string()
    .min(1, "Enter an amount")
    .refine((value) => Number(value) > 0, "Enter a positive amount"),
});

type SettingsValues = z.infer<typeof settingsSchema>;

function parseDomains(value: string): string[] {
  return value
    .split(/[,\s]+/)
    .map((domain) => domain.replace(/^@/, "").trim().toLowerCase())
    .filter(Boolean);
}

function formatDomains(domains: string[]): string {
  return domains.join(", ");
}

interface WorkspaceSettingsFormProps {
  workspaceId: string;
  settings: WorkspaceSettings;
  onUpdated?: () => void | Promise<void>;
}

export function WorkspaceSettingsForm({
  workspaceId,
  settings,
  onUpdated,
}: WorkspaceSettingsFormProps) {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [error, setError] = useState<string | null>(null);

  const form = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      timezone: settings.timezone,
      allowedEmailDomains: formatDomains(settings.allowedEmailDomains),
      defaultMaxOrderAmountNaira: String(settings.defaultMaxOrderAmountCents / 100),
    },
  });

  useEffect(() => {
    form.reset({
      timezone: settings.timezone,
      allowedEmailDomains: formatDomains(settings.allowedEmailDomains),
      defaultMaxOrderAmountNaira: String(settings.defaultMaxOrderAmountCents / 100),
    });
  }, [settings, form]);

  async function onSubmit(values: SettingsValues) {
    if (!token) return;
    setError(null);

    const amountNaira = Number(values.defaultMaxOrderAmountNaira);

    try {
      await apiClient(token).patch(`/platform/workspaces/${workspaceId}`, {
        settings: {
          timezone: values.timezone,
          allowedEmailDomains: parseDomains(values.allowedEmailDomains),
          defaultMaxOrderAmountCents: Math.round(amountNaira * 100),
        },
      });
      toast.success("Chopspace settings saved");
      await onUpdated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="size-5" />
          Chopspace settings
        </CardTitle>
        <CardDescription>
          Configure timezone, invite domains, and default order limits without
          entering manage mode.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timezone</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TIMEZONE_OPTIONS.map((timezone) => (
                        <SelectItem key={timezone} value={timezone}>
                          {timezone.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allowedEmailDomains"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Allowed email domains</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="company.com, partner.org"
                      autoComplete="off"
                    />
                  </FormControl>
                  <FormDescription>
                    Comma-separated domains for staff invites. Leave empty to
                    allow any domain.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="defaultMaxOrderAmountNaira"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default max order (₦)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min={1}
                      step={100}
                    />
                  </FormControl>
                  <FormDescription>
                    Applied to new menu weeks unless overridden.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              variant="premium"
              disabled={form.formState.isSubmitting}
            >
              Save settings
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
