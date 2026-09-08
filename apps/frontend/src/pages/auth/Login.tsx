import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { loginSchema, type LoginInput } from "@/schemas/auth.schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Boxes, KeyRound, Phone, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);

  // Read return destination or fallback to "/"
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/";

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phoneNumber: "9500088697",
      passcode: "000000",
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setSubmitting(true);
    try {
      await login(data.phoneNumber, data.passcode);
      navigate(from, { replace: true });
    } catch {
      // Error handled and toasted in AuthProvider
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemoAccount = (phone: string, code: string) => {
    setValue("phoneNumber", phone);
    setValue("passcode", code);
  };

  return (
    <Card className="border-slate-200/80 shadow-xl">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md mb-2">
          <Boxes className="h-7 w-7" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
          Robago Enterprise
        </CardTitle>
        <CardDescription className="text-sm text-slate-500">
          Manufacturing & Inventory Management System
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="phoneNumber">Phone Number (10 Digits)</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                id="phoneNumber"
                type="tel"
                maxLength={10}
                placeholder="9500088697"
                className="pl-9 text-base tracking-wider font-medium"
                {...register("phoneNumber")}
              />
            </div>
            {errors.phoneNumber && (
              <p className="text-xs text-rose-500 font-medium">
                {errors.phoneNumber.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="passcode">6-Digit Passcode</Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                id="passcode"
                type="password"
                maxLength={6}
                placeholder="000000"
                className="pl-9 text-base tracking-widest font-mono"
                {...register("passcode")}
              />
            </div>
            {errors.passcode && (
              <p className="text-xs text-rose-500 font-medium">
                {errors.passcode.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-base font-semibold"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing In...
              </>
            ) : (
              <>
                Enter System
                <ArrowRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </form>

        {/* Demo Credentials Quick Selector */}
        <div className="mt-6 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 font-semibold text-indigo-900 mb-2">
            <ShieldCheck className="h-4 w-4 text-indigo-600" />
            Quick Demo Access (Accounts Jan 2026):
          </div>
          <div className="space-y-1 text-[11px]">
            <div className="flex items-center justify-between">
              <span>Admin: <strong>9500088697</strong> (Passcode: 000000)</span>
              <button
                type="button"
                onClick={() => fillDemoAccount("9500088697", "000000")}
                className="text-indigo-600 hover:underline font-semibold cursor-pointer"
              >
                Use
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span>Staff: <strong>9342851545</strong> (Passcode: 000000)</span>
              <button
                type="button"
                onClick={() => fillDemoAccount("9342851545", "000000")}
                className="text-indigo-600 hover:underline font-semibold cursor-pointer"
              >
                Use
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
