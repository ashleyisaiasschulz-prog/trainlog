import * as React from "react"

import { cn } from "@/lib/utils"

function Card({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
  return (
    <div
      data-slot="bg-zinc-900 border border-zinc-800 rounded-2xl"
      data-size={size}
      className={cn(
        "group/bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col gap-(--bg-zinc-900 border border-zinc-800 rounded-2xl-spacing) overflow-hidden rounded-xl bg-bg-zinc-900 border border-zinc-800 rounded-2xl py-(--bg-zinc-900 border border-zinc-800 rounded-2xl-spacing) text-sm text-bg-zinc-900 border border-zinc-800 rounded-2xl-foreground ring-1 ring-foreground/10 [--bg-zinc-900 border border-zinc-800 rounded-2xl-spacing:--spacing(4)] has-data-[slot=bg-zinc-900 border border-zinc-800 rounded-2xl-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:[--bg-zinc-900 border border-zinc-800 rounded-2xl-spacing:--spacing(3)] data-[size=sm]:has-data-[slot=bg-zinc-900 border border-zinc-800 rounded-2xl-footer]:pb-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="bg-zinc-900 border border-zinc-800 rounded-2xl-header"
      className={cn(
        "group/bg-zinc-900 border border-zinc-800 rounded-2xl-header @container/bg-zinc-900 border border-zinc-800 rounded-2xl-header grid auto-rows-min items-start gap-1 rounded-t-xl px-(--bg-zinc-900 border border-zinc-800 rounded-2xl-spacing) has-data-[slot=bg-zinc-900 border border-zinc-800 rounded-2xl-action]:grid-cols-[1fr_auto] has-data-[slot=bg-zinc-900 border border-zinc-800 rounded-2xl-description]:grid-rows-[auto_auto] [.border-b]:pb-(--bg-zinc-900 border border-zinc-800 rounded-2xl-spacing)",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="bg-zinc-900 border border-zinc-800 rounded-2xl-title"
      className={cn(
        "font-heading text-base leading-snug font-medium group-data-[size=sm]/bg-zinc-900 border border-zinc-800 rounded-2xl:text-sm",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="bg-zinc-900 border border-zinc-800 rounded-2xl-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="bg-zinc-900 border border-zinc-800 rounded-2xl-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="bg-zinc-900 border border-zinc-800 rounded-2xl-content"
      className={cn("px-(--bg-zinc-900 border border-zinc-800 rounded-2xl-spacing)", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="bg-zinc-900 border border-zinc-800 rounded-2xl-footer"
      className={cn(
        "flex items-center rounded-b-xl border-t bg-muted/50 p-(--bg-zinc-900 border border-zinc-800 rounded-2xl-spacing)",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
