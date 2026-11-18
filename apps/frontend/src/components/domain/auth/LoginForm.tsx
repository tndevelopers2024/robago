// src/components/domain/auth/LoginForm.tsx
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@robago/shared";
import { useAuth } from "@/context/AuthProvider";
import InputField from "@/components/InputField";
import { Button } from "@/components/ui/button";
import { ArrowRight, CalendarCheck2, IndianRupee, Package, Sparkles, Users } from "lucide-react";

const HIGHLIGHTS = [
    { icon: Users, label: "Staff & attendance" },
    { icon: IndianRupee, label: "Salary & advances" },
    { icon: Package, label: "Inventory & stock" },
    { icon: CalendarCheck2, label: "Daily operations" },
];

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
        <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
            {/* Brand panel — hidden on phones, a compact band on tablets, full on desktop */}
            <aside className="relative hidden overflow-hidden bg-sidebar text-white md:flex md:min-h-64 md:flex-col md:justify-between md:p-10 lg:min-h-dvh lg:p-14">
                <div className="pointer-events-none absolute -top-32 -right-24 size-[28rem] rounded-full bg-brand/30 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-40 -left-20 size-[26rem] rounded-full bg-primary/40 blur-3xl" />
                <div className="relative flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-white p-1.5 shadow-xl shadow-black/30">
                        <img src="/images/robago-logo.png" alt="Robago" className="size-full object-contain" />
                    </div>
                    <span className="text-lg font-semibold tracking-[0.2em]">ROBAGO</span>
                </div>
                <div className="relative max-w-xl py-8">
                    <h1 className="text-3xl leading-tight font-semibold tracking-tight lg:text-5xl">
                        Run your whole factory <span className="text-brand">from one place.</span>
                    </h1>
                    <p className="mt-4 text-base text-white/60 lg:text-lg">
                        Staff, salaries, stock and daily operations — built to feel as fast as the spreadsheets your
                        team already knows.
                    </p>
                    <ul className="mt-8 grid grid-cols-2 gap-3">
                        {HIGHLIGHTS.map(({ icon: Icon, label }) => (
                            <li
                                key={label}
                                className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3 text-sm font-medium ring-1 ring-white/10"
                            >
                                <Icon className="size-4 text-brand" />
                                {label}
                            </li>
                        ))}
                    </ul>
                </div>
                <p className="relative hidden text-xs text-white/40 lg:block">Techienutpam Pvt. Ltd.</p>
            </aside>

            <section className="flex items-center justify-center bg-[radial-gradient(40rem_24rem_at_50%_-10%,oklch(0.9_0.06_225/0.55),transparent),var(--background)] px-5 py-10">
                <div className="rise-in w-full max-w-sm">
                    <div className="mb-8 flex flex-col items-center text-center md:items-start md:text-left">
                        <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-white p-2 shadow-lg ring-1 ring-border md:hidden">
                            <img src="/images/robago-logo.png" alt="Robago" className="size-full object-contain" />
                        </div>
                        <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
                        <p className="mt-1 text-sm text-muted-foreground">Sign in with your phone number and passcode.</p>
                    </div>

                    <FormProvider {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <InputField<LoginInput>
                                name="phoneNumber"
                                type="tel"
                                inputMode="numeric"
                                label="Phone number"
                                placeholder="10-digit number"
                                required
                                autoComplete="tel"
                            />
                            <InputField<LoginInput>
                                name="passcode"
                                type="password"
                                inputMode="numeric"
                                label="Passcode"
                                placeholder="6-digit passcode"
                                required
                                autoComplete="current-password"
                            />
                            <Button type="submit" size="lg" className="h-11 w-full gap-2 text-sm font-semibold" disabled={isPending}>
                                {isPending ? "Signing in…" : "Sign in"}
                                {!isPending && <ArrowRight className="size-4" />}
                            </Button>
                        </form>
                    </FormProvider>

                    <div className="mt-6 rounded-2xl border border-primary/20 bg-accent/60 p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-accent-foreground">
                            <Sparkles className="size-4 text-primary" />
                            Try the demo
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Sample data is preloaded — no database needed.
                        </p>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleQuickDemoLogin}
                            disabled={isPending}
                            className="mt-3 h-10 w-full bg-card font-medium"
                        >
                            Quick demo login
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default LoginForm;
