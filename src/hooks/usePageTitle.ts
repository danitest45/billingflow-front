import { useEffect } from "react";
import { branding } from "../config/branding";

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title === branding.productName ? branding.productName : `${title} | ${branding.productName}`;
  }, [title]);
}
