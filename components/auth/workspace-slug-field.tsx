"use client";

import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { HelpCircle } from "lucide-react";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type WorkspaceSlugFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  required?: boolean;
  description?: string;
};

export function WorkspaceSlugField<T extends FieldValues>({
  control,
  name,
  required = false,
  description = "The short name for your team workspace (e.g. verto).",
}: WorkspaceSlugFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <div className="flex items-center gap-1.5">
            <FormLabel>
              Workspace slug{required ? "" : " (optional)"}
            </FormLabel>
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <HelpCircle className="size-3.5" />
                  </button>
                }
              />
              <TooltipContent side="top" className="max-w-xs">
                Your admin shares this with your invite email. Super admins can
                leave it blank.
              </TooltipContent>
            </Tooltip>
          </div>
          <FormControl>
            <Input
              {...field}
              autoComplete="organization"
              placeholder="workspace-slug"
              onChange={(event) =>
                field.onChange(event.target.value.toLowerCase())
              }
            />
          </FormControl>
          {description ? (
            <FormDescription>{description}</FormDescription>
          ) : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
