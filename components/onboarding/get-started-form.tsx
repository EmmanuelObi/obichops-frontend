"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CheckCircle2 } from "lucide-react";

import { apiClient } from "@/lib/api-client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";

const getStartedSchema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  slug: z
    .string()
    .min(2, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens"),
  contactName: z.string().min(2, "Your name is required"),
  email: z.string().email("Enter a valid work email"),
  phone: z.string().optional(),
  teamSize: z.string().optional(),
  notes: z.string().max(1000, "Keep notes under 1000 characters").optional(),
});

type GetStartedValues = z.input<typeof getStartedSchema>;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/['\u2019]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function GetStartedForm() {
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  const form = useForm<GetStartedValues>({
    resolver: zodResolver(getStartedSchema),
    defaultValues: {
      businessName: "",
      slug: "",
      contactName: "",
      email: "",
      phone: "",
      teamSize: "",
      notes: "",
    },
  });

  async function onSubmit(values: GetStartedValues) {
    setError(null);
    setIsSubmitting(true);
    try {
      await apiClient().post("/onboarding", {
        businessName: values.businessName,
        slug: values.slug,
        contactName: values.contactName,
        email: values.email,
        phone: values.phone || undefined,
        teamSize: values.teamSize || undefined,
        notes: values.notes || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="size-7 text-primary" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-lg font-semibold tracking-tight">
            Request received
          </h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Thanks! Our team will review your request. Once approved, you&apos;ll
            get an email with your admin sign-in details.
          </p>
        </div>
        <Link href="/" className="text-sm text-primary hover:underline">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <FormField
          control={form.control}
          name="businessName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Business name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Acme Corp"
                  onChange={(event) => {
                    field.onChange(event);
                    if (!slugTouched) {
                      form.setValue("slug", slugify(event.target.value));
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Chopspace slug</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="acme-corp"
                  onChange={(event) => {
                    setSlugTouched(true);
                    field.onChange(event.target.value.toLowerCase());
                  }}
                />
              </FormControl>
              <FormDescription>
                A short name your team will use to sign in.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="contactName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your name</FormLabel>
                <FormControl>
                  <Input {...field} autoComplete="name" placeholder="Ada Obi" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone (optional)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="tel"
                    autoComplete="tel"
                    placeholder="+234..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Work email</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                />
              </FormControl>
              <FormDescription>
                This becomes your admin account once approved.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="teamSize"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Team size (optional)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g. 25" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Anything else? (optional)</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  rows={3}
                  placeholder="Tell us about your team's meal needs..."
                />
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
          {isSubmitting ? "Submitting..." : "Request access"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have a chopspace?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </Form>
  );
}
