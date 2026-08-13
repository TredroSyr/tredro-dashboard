"use client";
import React from "react";

import Link from "next/link";

const Footer = () => {
  const getCurrentYear = () => {
    return new Date().getFullYear();
  };

  return (
    <div className="px-4 py-1 md:px-8 lg:px-20 bg-primary">
      <div className="container mx-auto max-w-[1440px]">
        <div className="hidden items-center justify-between lg:flex">
          <div className="flex items-center gap-3">
            <Link
              href=""
              aria-label="Facebook"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-white/20"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="10"
                height="16"
                viewBox="0 0 10 16"
                fill="none"
                className="!m-0"
              >
                <path
                  d="M8.72266 9L9.16703 6.10437H6.38859V4.22531C6.38859 3.43313 6.77672 2.66094 8.02109 2.66094H9.28422V0.195625C9.28422 0.195625 8.13797 0 7.04203 0C4.75391 0 3.25828 1.38688 3.25828 3.8975V6.10437H0.714844V9H3.25828V16H6.38859V9H8.72266Z"
                  fill="currentColor"
                />
              </svg>
            </Link>

            <Link
              href=""
              aria-label="Instagram"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-white/20"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                className="!m-0 fill-current"
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </Link>

            <Link
              href=""
              aria-label="TikTok"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-white/20"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                className="!m-0 fill-current"
              >
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" />
              </svg>
            </Link>

            <Link
              href=""
              aria-label="X (Twitter)"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-white/20"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                className="!m-0 fill-current"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.259 5.629L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
              </svg>
            </Link>
          </div>

          <div className="flex items-center">
            <p className="text-sm font-medium text-white/90">
              © {getCurrentYear()},{" "}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:hidden">
          <div className="flex items-center justify-center gap-3">
            <Link
              href=""
              aria-label="Facebook"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-white/20"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="10"
                height="16"
                viewBox="0 0 10 16"
                fill="none"
                className="!m-0"
              >
                <path
                  d="M8.72266 9L9.16703 6.10437H6.38859V4.22531C6.38859 3.43313 6.77672 2.66094 8.02109 2.66094H9.28422V0.195625C9.28422 0.195625 8.13797 0 7.04203 0C4.75391 0 3.25828 1.38688 3.25828 3.8975V6.10437H0.714844V9H3.25828V16H6.38859V9H8.72266Z"
                  fill="currentColor"
                />
              </svg>
            </Link>

            <Link
              href=""
              aria-label="Instagram"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-white/20"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                className="!m-0 fill-current"
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </Link>

            <Link
              href=""
              aria-label="TikTok"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-white/20"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                className="!m-0 fill-current"
              >
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" />
              </svg>
            </Link>

            <Link
              href="https://x.com/kadnyaio?s=11"
              aria-label="X (Twitter)"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-white/20"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                className="!m-0 fill-current"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.259 5.629L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
              </svg>
            </Link>
          </div>

          <div className="text-center">
            <p className="text-sm font-medium text-white/90">
              © {getCurrentYear()},{" "}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
