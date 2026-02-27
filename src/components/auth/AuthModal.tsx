"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { authApi } from "@/lib/api/auth";
import { useRouter } from "next/navigation";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "login" | "register";
  onLogin?: () => void;
}

interface ValidationErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  displayName?: string;
}

export function AuthModal({
  isOpen,
  onClose,
  defaultTab = "login",
  onLogin,
}: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">(defaultTab);
  const [registerStep, setRegisterStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {},
  );
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const router = useRouter();

  // Reset form when tab changes
  useEffect(() => {
    setEmail("");
    setPassword("");
    setUsername("");
    setConfirmPassword("");
    setDisplayName("");
    setError("");
    setSuccessMessage("");
    setValidationErrors({});
    setTouchedFields(new Set());
    setRegisterStep(1);
  }, [activeTab]);

  if (!isOpen) return null;

  // Validation functions
  const validateUsername = (value: string): string | undefined => {
    if (!value) return "Username is required";
    if (value.length < 3) return "Username must be at least 3 characters";
    if (value.length > 50) return "Username must be less than 50 characters";
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      return "Username can only contain letters, numbers, underscores, and hyphens";
    }
    return undefined;
  };

  const validateEmail = (
    value: string,
    required: boolean = false,
  ): string | undefined => {
    if (!value && !required) return undefined; // Email is optional for register
    if (!value && required) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return "Invalid email address";
    return undefined;
  };

  const validatePassword = (value: string): string | undefined => {
    if (!value) return "Password is required";
    if (value.length < 6) return "Password must be at least 6 characters";
    if (!/(?=.*[a-z])/.test(value))
      return "Password must contain a lowercase letter";
    if (!/(?=.*\d)/.test(value)) return "Password must contain a number";
    return undefined;
  };

  const validateConfirmPassword = (
    value: string,
    passwordValue: string,
  ): string | undefined => {
    if (!value) return "Please confirm your password";
    if (value !== passwordValue) return "Passwords do not match";
    return undefined;
  };

  const validateDisplayName = (value: string): string | undefined => {
    if (!value) return "Display name is required";
    if (value.length > 100)
      return "Display name must be less than 100 characters";
    return undefined;
  };

  // Handle field blur (mark as touched)
  const handleBlur = (fieldName: string) => {
    setTouchedFields((prev) => new Set(prev).add(fieldName));
  };

  // Validate step 1 fields only
  const validateStep1 = (): boolean => {
    const errors: ValidationErrors = {};
    errors.username = validateUsername(username);
    errors.email = validateEmail(email, true);
    errors.displayName = validateDisplayName(displayName);

    const filteredErrors = Object.fromEntries(
      Object.entries(errors).filter(([_, value]) => value !== undefined),
    ) as ValidationErrors;

    setValidationErrors(filteredErrors);
    return Object.keys(filteredErrors).length === 0;
  };

  // Validate all fields
  const validateAll = (): boolean => {
    const errors: ValidationErrors = {};

    if (activeTab === "register") {
      errors.username = validateUsername(username);
      errors.email = validateEmail(email, true);
      errors.password = validatePassword(password);
      errors.confirmPassword = validateConfirmPassword(
        confirmPassword,
        password,
      );
      errors.displayName = validateDisplayName(displayName);
    } else {
      // Login validation
      if (!email && !username) {
        errors.email = "Email or username is required";
      }
      if (!password) {
        errors.password = "Password is required";
      }
    }

    // Filter out undefined errors
    const filteredErrors = Object.fromEntries(
      Object.entries(errors).filter(([_, value]) => value !== undefined),
    ) as ValidationErrors;

    setValidationErrors(filteredErrors);
    return Object.keys(filteredErrors).length === 0;
  };

  // Handle "Continue" from step 1 to step 2
  const handleNextStep = () => {
    setTouchedFields(new Set(["username", "email", "displayName"]));
    if (validateStep1()) {
      setValidationErrors({});
      setTouchedFields(new Set());
      setRegisterStep(2);
    }
  };

  // Real-time validation on change
  const handleUsernameChange = (value: string) => {
    setUsername(value);
    if (touchedFields.has("username")) {
      const error = validateUsername(value);
      setValidationErrors((prev) => ({ ...prev, username: error }));
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (touchedFields.has("email")) {
      const error = validateEmail(value, true); // Always required
      setValidationErrors((prev) => ({ ...prev, email: error }));
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (touchedFields.has("password")) {
      const error = validatePassword(value);
      setValidationErrors((prev) => ({ ...prev, password: error }));
    }
    // Also revalidate confirm password if it's been touched
    if (touchedFields.has("confirmPassword") && confirmPassword) {
      const confirmError = validateConfirmPassword(confirmPassword, value);
      setValidationErrors((prev) => ({
        ...prev,
        confirmPassword: confirmError,
      }));
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (touchedFields.has("confirmPassword")) {
      const error = validateConfirmPassword(value, password);
      setValidationErrors((prev) => ({ ...prev, confirmPassword: error }));
    }
  };

  const handleDisplayNameChange = (value: string) => {
    setDisplayName(value);
    if (touchedFields.has("displayName")) {
      const error = validateDisplayName(value);
      setValidationErrors((prev) => ({ ...prev, displayName: error }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    // Mark all fields as touched
    const allFields =
      activeTab === "register"
        ? ["username", "email", "password", "confirmPassword", "displayName"]
        : ["email", "password"];
    setTouchedFields(new Set(allFields));

    // Validate all fields
    if (!validateAll()) {
      return;
    }

    setIsLoading(true);

    try {
      if (activeTab === "register") {
        // Prepare register data
        const registerData: {
          username: string;
          email?: string;
          password: string;
          displayName?: string;
        } = {
          username: username.trim(),
          password,
        };

        // Only include email if it's not empty
        if (email && email.trim() !== "") {
          registerData.email = email.trim();
        }

        // Only include displayName if it's not empty
        if (displayName && displayName.trim() !== "") {
          registerData.displayName = displayName.trim();
        }


        // Register user
        await authApi.register(registerData);

        // Switch to login tab after successful registration
        setActiveTab("login");
        setError("");
        setEmail(registerData.email || "");
        setPassword("");
        // Show success message inline (will be displayed as a success banner)
        setSuccessMessage("Registration successful! Please login with your credentials.");
      } else {
        // Login user
        await authApi.login({
          identifier: email.trim() || username.trim(),
          password,
        });

        // Close modal and redirect
        onClose();
        if (onLogin) onLogin();
        router.push("/home");
        router.refresh();
      }
    } catch (err: unknown) {

      // Handle API validation errors
      if (err && typeof err === "object" && "details" in err) {
        const apiError = err as {
          details?: Array<{ field: string; message: string }>;
        };
        if (apiError.details && apiError.details.length > 0) {
          const newErrors: ValidationErrors = {};
          apiError.details.forEach((detail) => {
            newErrors[detail.field as keyof ValidationErrors] = detail.message;
          });
          setValidationErrors((prev) => ({ ...prev, ...newErrors }));
        }
      }

      if (err && typeof err === "object" && "message" in err) {
        setError(err.message as string);
      } else {
        setError("An error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscordLogin = () => {
    authApi.loginWithDiscord();
  };

  // Helper to check if field has error
  const hasError = (fieldName: keyof ValidationErrors): boolean => {
    return touchedFields.has(fieldName) && !!validationErrors[fieldName];
  };

  // Get input class with error state
  const getInputClass = (fieldName: keyof ValidationErrors): string => {
    const baseClass =
      "w-full h-9 px-3 rounded-lg bg-white/[0.03] border text-[13px] text-offgray-100 placeholder:text-offgray-600 focus:outline-none transition-all";

    if (hasError(fieldName)) {
      return `${baseClass} border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500/20`;
    }

    return `${baseClass} border-white/[0.08] focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-[#0f1115] rounded-lg border border-white/[0.08] shadow-2xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-7 h-7 flex items-center justify-center rounded-md text-offgray-500 hover:text-offgray-200 hover:bg-white/[0.06] transition-colors"
          type="button"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="p-5 pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5 mb-3">
            <Image
              src="/logo.svg"
              alt="ScriptHub Logo"
              width={24}
              height={24}
              className="w-6 h-6"
            />
            <h2 className="text-[17px] font-semibold text-offgray-50">
              Welcome to ScriptHub
            </h2>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <button
              type="button"
              onClick={() => setActiveTab("login")}
              className={[
                "flex-1 text-[13px] font-medium py-1.5 rounded-md transition-colors",
                activeTab === "login"
                  ? "bg-white/[0.08] text-offgray-50"
                  : "text-offgray-500 hover:text-offgray-300",
              ].join(" ")}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("register")}
              className={[
                "flex-1 text-[13px] font-medium py-1.5 rounded-md transition-colors",
                activeTab === "register"
                  ? "bg-white/[0.08] text-offgray-50"
                  : "text-offgray-500 hover:text-offgray-300",
              ].join(" ")}
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Discord Login */}
          <button
            type="button"
            onClick={handleDiscordLogin}
            className="w-full flex items-center justify-center gap-2.5 h-9 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium text-[13px] transition-colors mb-4"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
            Continue with Discord
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-[11px] text-offgray-600">OR</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Success message */}
            {successMessage && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-[12px] text-emerald-400">✅ {successMessage}</p>
              </div>
            )}

            {/* Global error message */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-[12px] text-red-400">{error}</p>
              </div>
            )}

            {/* Step indicator for register */}
            {activeTab === "register" && (
              <div className="flex items-center justify-center gap-2 pb-1">
                <div className={`h-1.5 w-8 rounded-full transition-colors ${registerStep === 1 ? "bg-emerald-500" : "bg-emerald-500/30"
                  }`} />
                <div className={`h-1.5 w-8 rounded-full transition-colors ${registerStep === 2 ? "bg-emerald-500" : "bg-white/[0.06]"
                  }`} />
              </div>
            )}

            {/* Register Step 1: Username, Display Name, Email */}
            {activeTab === "register" && registerStep === 1 && (
              <>
                {/* Username */}
                <div>
                  <label
                    htmlFor="username"
                    className="block text-[11px] font-medium text-offgray-400 mb-1.5"
                  >
                    Username <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    onBlur={() => handleBlur("username")}
                    placeholder="e.g. john_doe (min 3 chars)"
                    className={getInputClass("username")}
                    disabled={isLoading}
                    autoComplete="username"
                  />
                  {hasError("username") && (
                    <p className="mt-1 text-[11px] text-red-400">
                      {validationErrors.username}
                    </p>
                  )}
                  {!hasError("username") &&
                    touchedFields.has("username") &&
                    username && (
                      <p className="mt-1 text-[11px] text-emerald-400">
                        ✓ Valid username
                      </p>
                    )}
                </div>

                {/* Display Name */}
                <div>
                  <label
                    htmlFor="displayName"
                    className="block text-[11px] font-medium text-offgray-400 mb-1.5"
                  >
                    Display Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="displayName"
                    value={displayName}
                    onChange={(e) => handleDisplayNameChange(e.target.value)}
                    onBlur={() => handleBlur("displayName")}
                    placeholder="e.g. John Doe"
                    className={getInputClass("displayName")}
                    disabled={isLoading}
                    autoComplete="name"
                  />
                  {hasError("displayName") && (
                    <p className="mt-1 text-[11px] text-red-400">
                      {validationErrors.displayName}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-[11px] font-medium text-offgray-400 mb-1.5"
                  >
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    onBlur={() => handleBlur("email")}
                    placeholder="your.email@example.com"
                    className={getInputClass("email")}
                    disabled={isLoading}
                    autoComplete="email"
                  />
                  {hasError("email") && (
                    <p className="mt-1 text-[11px] text-red-400">
                      {validationErrors.email}
                    </p>
                  )}
                  {!hasError("email") &&
                    touchedFields.has("email") &&
                    email && (
                      <p className="mt-1 text-[11px] text-emerald-400">
                        ✓ Valid email
                      </p>
                    )}
                </div>

                {/* Continue button */}
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full h-9 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-medium text-[13px] transition-colors mt-4"
                >
                  Continue
                </button>
              </>
            )}

            {/* Register Step 2: Password, Confirm Password */}
            {activeTab === "register" && registerStep === 2 && (
              <>
                {/* Summary of step 1 */}
                <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                  <div className="text-[12px]">
                    <span className="text-offgray-400">Signing up as </span>
                    <span className="text-offgray-100 font-medium">@{username}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRegisterStep(1)}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    Edit
                  </button>
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-[11px] font-medium text-offgray-400 mb-1.5"
                  >
                    Password <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    onBlur={() => handleBlur("password")}
                    placeholder="Min 6 chars, a-z, 0-9"
                    className={getInputClass("password")}
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  {hasError("password") && (
                    <p className="mt-1 text-[11px] text-red-400">
                      {validationErrors.password}
                    </p>
                  )}
                  {!hasError("password") &&
                    touchedFields.has("password") &&
                    password && (
                      <div className="mt-1 space-y-0.5">
                        <p
                          className={`text-[10px] ${password.length >= 6 ? "text-emerald-400" : "text-offgray-600"}`}
                        >
                          {password.length >= 6 ? "✓" : "○"} At least 6 characters
                        </p>
                        <p
                          className={`text-[10px] ${/[a-z]/.test(password) ? "text-emerald-400" : "text-offgray-600"}`}
                        >
                          {/[a-z]/.test(password) ? "✓" : "○"} One lowercase letter
                        </p>
                        <p
                          className={`text-[10px] ${/\d/.test(password) ? "text-emerald-400" : "text-offgray-600"}`}
                        >
                          {/\d/.test(password) ? "✓" : "○"} One number
                        </p>
                      </div>
                    )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-[11px] font-medium text-offgray-400 mb-1.5"
                  >
                    Confirm Password <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                    onBlur={() => handleBlur("confirmPassword")}
                    placeholder="Re-enter your password"
                    className={getInputClass("confirmPassword")}
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  {hasError("confirmPassword") && (
                    <p className="mt-1 text-[11px] text-red-400">
                      {validationErrors.confirmPassword}
                    </p>
                  )}
                  {!hasError("confirmPassword") &&
                    touchedFields.has("confirmPassword") &&
                    confirmPassword && (
                      <p className="mt-1 text-[11px] text-emerald-400">
                        ✓ Passwords match
                      </p>
                    )}
                </div>

                {/* Back + Submit buttons */}
                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setRegisterStep(1)}
                    className="flex-1 h-9 rounded-lg bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.08] text-offgray-200 font-medium text-[13px] transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-[2] h-9 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 disabled:cursor-not-allowed text-black font-medium text-[13px] transition-colors"
                  >
                    {isLoading ? "Loading..." : "Create Account"}
                  </button>
                </div>
              </>
            )}

            {/* Login form */}
            {activeTab === "login" && (
              <>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-[11px] font-medium text-offgray-400 mb-1.5"
                  >
                    Email or Username <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="email"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    onBlur={() => handleBlur("email")}
                    placeholder="Enter email or username"
                    className={getInputClass("email")}
                    disabled={isLoading}
                    autoComplete="username"
                  />
                  {hasError("email") && (
                    <p className="mt-1 text-[11px] text-red-400">
                      {validationErrors.email}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-[11px] font-medium text-offgray-400 mb-1.5"
                  >
                    Password <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    onBlur={() => handleBlur("password")}
                    placeholder="Enter your password"
                    className={getInputClass("password")}
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  {hasError("password") && (
                    <p className="mt-1 text-[11px] text-red-400">
                      {validationErrors.password}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-3.5 h-3.5 rounded border-white/[0.08] bg-white/[0.03] text-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                    />
                    <span className="text-[11px] text-offgray-500">
                      Remember me
                    </span>
                  </label>
                  <button
                    type="button"
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-9 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 disabled:cursor-not-allowed text-black font-medium text-[13px] transition-colors mt-4"
                >
                  {isLoading ? "Loading..." : "Sign In"}
                </button>
              </>
            )}
          </form>

          {/* Footer */}
          <div className="mt-4 text-center">
            <p className="text-[11px] text-offgray-600">
              {activeTab === "login"
                ? "Don't have an account? "
                : "Already have an account? "}
              <button
                type="button"
                onClick={() =>
                  setActiveTab(activeTab === "login" ? "register" : "login")
                }
                className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
              >
                {activeTab === "login" ? "Sign Up" : "Sign In"}
              </button>
            </p>
          </div>

          {activeTab === "register" && (
            <p className="mt-3 text-[10px] text-offgray-600 text-center leading-relaxed">
              By creating an account, you agree to our{" "}
              <a
                href="/rules"
                className="text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="/rules"
                className="text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Privacy Policy
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
