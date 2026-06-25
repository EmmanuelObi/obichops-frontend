"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { getSession, signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { changePassword } from "@/lib/auth-api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const schema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required"),
    lastName: z.string().trim().min(1, "Last name is required"),
    currentPassword: z.string().min(1, "Temporary password is required"),
    password: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ChangePasswordValues = z.input<typeof schema>;

export function ChangePasswordForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const token = session?.accessToken;
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      currentPassword: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: ChangePasswordValues) {
    if (!token || !session?.user?.email) {
      setError("You must be signed in to continue.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await changePassword(
        token,
        values.currentPassword,
        values.password,
        {
          firstName: values.firstName,
          lastName: values.lastName,
        },
      );

      const result = await signIn("credentials", {
        email: session.user.email,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        router.push("/login");
        return;
      }

      const updatedSession = await getSession();
      const role = updatedSession?.user?.role;
      if (role === "STAFF") {
        router.push("/staff");
      } else if (role === "ADMIN" || role === "SUPER_ADMIN") {
        router.push("/admin");
      } else {
        router.push("/");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to complete setup");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First name</FormLabel>
                <FormControl>
                  <Input {...field} autoComplete="given-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last name</FormLabel>
                <FormControl>
                  <Input {...field} autoComplete="family-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Temporary password</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="password"
                  autoComplete="current-password"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New password</FormLabel>
              <FormControl>
                <Input {...field} type="password" autoComplete="new-password" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm new password</FormLabel>
              <FormControl>
                <Input {...field} type="password" autoComplete="new-password" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          variant="premium"
          size="lg"
          className="h-11 w-full rounded-lg"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving…" : "Complete setup"}
        </Button>
      </form>
    </Form>
  );
}
