"use client";

import NextLink from "next/link";
import {
  useRouter,
  usePathname,
  useSearchParams,
  useParams as useNextParams,
} from "next/navigation";
import { useMemo } from "react";

export function Link({ to, href, children, prefetch = true, onClick, replace = false, ...rest }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const target = to || href;

  if (!target) return <a onClick={onClick} {...rest}>{children}</a>;

  const handleClick = (e) => {
    if (typeof onClick === "function") {
      onClick(e);
    }
    if (e.defaultPrevented) return;

    // Normal link behaviors: modifier keys (cmd, ctrl, shift, alt) or non-left-click
    if (e.button !== 0 || e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) {
      return;
    }

    // Always scroll smoothly to top on navigation if needed, but do not prevent NextLink's default router behavior
    const currentSearch = searchParams ? searchParams.toString() : "";
    const currentFullPath = currentSearch ? `${pathname}?${currentSearch}` : (pathname || "/");

    if (target === currentFullPath || (target === "/" && currentFullPath === "/")) {
      e.preventDefault();
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  return (
    <NextLink
      href={target}
      prefetch={prefetch}
      replace={replace}
      onClick={handleClick}
      {...rest}
    >
      {children}
    </NextLink>
  );
}

export function NavLink({ to, href, className, style, children, prefetch = true, onClick, replace = false, ...rest }) {
  const { end: _end, ...linkRest } = rest;
  const target = to || href;
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSearch = searchParams ? searchParams.toString() : "";
  const currentFullPath = currentSearch ? `${pathname}?${currentSearch}` : (pathname || "/");
  const isActive = typeof target === "string" && (target === currentFullPath || target === pathname);

  let resolvedClassName = className;
  if (typeof className === "function") {
    resolvedClassName = className({
      isActive,
      isPending: false,
    });
  }

  let resolvedStyle = style;
  if (typeof style === "function") {
    resolvedStyle = style({
      isActive,
      isPending: false,
    });
  }

  const handleClick = (e) => {
    if (typeof onClick === "function") {
      onClick(e);
    }
    if (e.defaultPrevented) return;

    if (e.button !== 0 || e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) {
      return;
    }

    if (target === currentFullPath) {
      e.preventDefault();
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  return (
    <NextLink
      href={target}
      prefetch={prefetch}
      replace={replace}
      aria-current={isActive ? "page" : undefined}
      className={resolvedClassName}
      style={resolvedStyle}
      onClick={handleClick}
      {...linkRest}
    >
      {typeof children === "function"
        ? children({ isActive, isPending: false })
        : children}
    </NextLink>
  );
}

export function useNavigate() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (to, options = {}) => {
    if (typeof to === "number") {
      if (to === -1) {
        router.back();
        return;
      }
      if (to >= 1) {
        router.forward();
        return;
      }
      router.back();
      return;
    }

    if (!to) return;

    // Build current full path including search query string
    const currentSearch = searchParams ? searchParams.toString() : "";
    const currentFullPath = currentSearch ? `${pathname}?${currentSearch}` : (pathname || "/");

    // If identical URL and not forcing a re-navigation, scroll to top
    const hasHash = typeof to === "string" && to.includes("#");
    if (!hasHash && !options.force && to === currentFullPath) {
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }

    if (options.replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  };
}

export function useLocation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return useMemo(() => {
    const searchString = searchParams ? searchParams.toString() : "";
    const search = searchString ? `?${searchString}` : "";
    let hash = "";
    if (typeof window !== "undefined") {
      hash = window.location.hash || "";
    }
    return {
      pathname: pathname || "/",
      search,
      hash,
    };
  }, [pathname, searchParams]);
}

export function useParams() {
  return useNextParams();
}
