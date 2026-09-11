// src/components/domain/auth/LoginForm.tsx
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@robago/shared";
import { useAuth } from "@/context/AuthProvider";
import InputField from "@/components/InputField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, KeyRound } from "lucide-react";

export function LoginForm() {
    const { login, isPending } = useAuth();
    const form = useForm<LoginInput>({
        resolver: zodResolver(loginSchema),
        defaultValues: { phoneNumber: "", passcode: "" },
    });

    async function onSubmit(values: LoginInput) {
        try {
            await login(values.phoneNumber, values.passcode);
        } catch {
            // AuthProvider.login already toasts — nothing else to do here.
        }
    }

    function fillDemoCredentials() {
        form.setValue("phoneNumber", "1234567890", { shouldValidate: true });
        form.setValue("passcode", "123456", { shouldValidate: true });
    }

    async function handleQuickDemoLogin() {
        form.setValue("phoneNumber", "1234567890", { shouldValidate: true });
        form.setValue("passcode", "123456", { shouldValidate: true });
        try {
            await login("1234567890", "123456");
        } catch {
            // AuthProvider.login already toasts
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4 py-8">
            <Card className="w-full max-w-sm shadow-md border-slate-200">
                <CardHeader className="text-center pb-4">
                    <div className="mx-auto mb-2 flex items-center justify-center">
                        <img
                            src="/images/robago-logo.png"
                            alt="Robago Logo"
                            className="h-12 w-auto object-contain rounded-md"
                        />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
                        Robago Admin
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                        Bag Manufacturing & Inventory Operations Platform
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <FormProvider {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <InputField<LoginInput>
                                name="phoneNumber"
                                type="tel"
                                label="Phone number"
                                placeholder="1234567890"
                                required
                                autoComplete="tel"
                            />
                            <InputField<LoginInput>
                                name="passcode"
                                type="password"
                                label="Passcode"
                                placeholder="••••••"
                                required
                                autoComplete="current-password"
                            />
                            <Button
                                type="submit"
                                className="w-full bg-[#1565C0] hover:bg-[#0D47A1] text-white font-medium"
                                disabled={isPending}
                            >
                                {isPending ? "Signing in…" : "Sign in"}
                            </Button>
                        </form>
                    </FormProvider>

                    {/* Demo Mode / Evaluator Quick Access */}
                    <div className="relative my-3">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-slate-200" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-slate-400 font-medium text-[11px]">
                                Evaluator Demo Access
                            </span>
                        </div>
                    </div>

                    <div className="space-y-2.5 rounded-lg border border-blue-200 bg-blue-50/60 p-3 text-xs">
                        <div className="flex items-center justify-between font-semibold text-[#1565C0]">
                            <span className="flex items-center gap-1.5">
                                <Sparkles className="size-3.5 text-[#1E88E5]" />
                                Standalone Demo Mode
                            </span>
                            <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-800">
                                1-Click Entry
                            </span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-600">
                            Preloaded with 9 bag manufacturing SKUs, warehouse splits, and live ledger audit logs.
                        </p>
                        <div className="flex gap-2 pt-0.5">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={fillDemoCredentials}
                                className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border-slate-200 text-xs h-8 font-medium gap-1"
                            >
                                <KeyRound className="size-3 text-slate-500" />
                                Fill Demo
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleQuickDemoLogin}
                                disabled={isPending}
                                className="flex-1 bg-[#1565C0] hover:bg-[#0D47A1] text-white text-xs h-8 font-medium shadow-xs"
                            >
                                {isPending ? "Signing in…" : "Quick Demo Login"}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default LoginForm;
