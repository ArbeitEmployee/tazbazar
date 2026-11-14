"use client";

import NextLink from "next/link";
import {
  useRouter,
  usePathname,
  useParams as useNextParams,
} from "next/navigation";

export function Link({ to, href, children, prefetch = true, ...rest }) {
  const target = to || href;
  if (!target) return <a {...rest}>{children}</a>;
  return (
    <NextLink href={target} prefetch={prefetch} {...rest}>
      {children}
    </NextLink>
  );
}

export function NavLink({ to, href, className, style, children, prefetch = true, ...rest }) {
  const { end: _end, ...linkRest } = rest;
  const target = to || href;
  const pathname = usePathname();
  const isActive = typeof target === "string" && pathname === target;

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

  return (
    <NextLink
      href={target}
      prefetch={prefetch}
      aria-current={isActive ? "page" : undefined}
      className={resolvedClassName}
      style={resolvedStyle}
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
  return (to, options = {}) => {
    if (typeof to === "number") {
      if (to === -1) {
        router.back();
        return;
      }
      if (to === 1) {
        router.forward();
        return;
      }
      if (to > 1) {
        router.forward();
        return;
      }
      router.back();
      return;
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
  let search = "";
  let hash = "";
  if (typeof window !== "undefined") {
    search = window.location.search;
    hash = window.location.hash;
  }
  return { pathname, search, hash };
}

export function useParams() {
  return useNextParams();
}
