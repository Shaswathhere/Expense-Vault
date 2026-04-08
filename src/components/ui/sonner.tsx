"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "cn-toast font-sans !shadow-lg !rounded-xl !border !px-4 !py-3 !gap-3",
          title: "!font-semibold !text-[13px]",
          description: "!text-[12px] !opacity-80",
          success:
            "!bg-emerald-50 !border-emerald-200 !text-emerald-900 dark:!bg-emerald-950/60 dark:!border-emerald-800 dark:!text-emerald-100 [&_[data-icon]]:!text-emerald-600 dark:[&_[data-icon]]:!text-emerald-400",
          error:
            "!bg-red-50 !border-red-200 !text-red-900 dark:!bg-red-950/60 dark:!border-red-800 dark:!text-red-100 [&_[data-icon]]:!text-red-600 dark:[&_[data-icon]]:!text-red-400",
          warning:
            "!bg-amber-50 !border-amber-200 !text-amber-900 dark:!bg-amber-950/60 dark:!border-amber-800 dark:!text-amber-100 [&_[data-icon]]:!text-amber-600 dark:[&_[data-icon]]:!text-amber-400",
          info: "!bg-blue-50 !border-blue-200 !text-blue-900 dark:!bg-blue-950/60 dark:!border-blue-800 dark:!text-blue-100 [&_[data-icon]]:!text-blue-600 dark:[&_[data-icon]]:!text-blue-400",
          loading:
            "!bg-emerald-50 !border-emerald-200 !text-emerald-900 dark:!bg-emerald-950/60 dark:!border-emerald-800 dark:!text-emerald-100 [&_[data-icon]]:!text-emerald-600 dark:[&_[data-icon]]:!text-emerald-400",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
