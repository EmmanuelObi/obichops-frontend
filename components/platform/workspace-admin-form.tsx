"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useSession } from "next-auth/react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";

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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";

const inviteAdminSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

type InviteAdminValues = z.infer<typeof inviteAdminSchema>;

interface WorkspaceAdminFormProps {
  workspaceId: string;
  adminCount: number;
  onCreated?: () => void | Promise<void>;
}

export function WorkspaceAdminForm({
  workspaceId,
  adminCount,
  onCreated,
}: WorkspaceAdminFormProps) {
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [error, setError] = useState<string | null>(null);

  const form = useForm<InviteAdminValues>({
    resolver: zodResolver(inviteAdminSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: InviteAdminValues) {
    if (!token) return;
    setError(null);
    try {
      await apiClient(token).post(`/platform/workspaces/${workspaceId}/admins`, {
        email: values.email,
      });
      form.reset();
      toast.success("Admin invite sent");
      await onCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to invite admin");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspace admin</CardTitle>
        <CardDescription>
          {adminCount === 0
            ? "No admins yet. Invite one to run day-to-day operations."
            : `${adminCount} admin${adminCount === 1 ? "" : "s"} configured. Invite another if needed.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4 sm:flex-row sm:items-end"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Admin email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="admin@company.com"
                      autoComplete="off"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              variant="premium"
              disabled={form.formState.isSubmitting}
              className="h-10 shrink-0"
            >
              <UserPlus className="size-4" />
              Send invite
            </Button>
          </form>
        </Form>

        <p className="text-sm text-muted-foreground">
          They&apos;ll receive a temporary password and must complete their
          profile on first sign-in.
        </p>
      </CardContent>
    </Card>
  );
}
