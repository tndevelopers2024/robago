// src/components/domain/auth/LoginForm.tsx
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@robago/shared";
import { useAuth } from "@/context/AuthProvider";
import InputField from "@/components/InputField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">Robago Admin</CardTitle>
                    <CardDescription>Sign in with your phone number and passcode</CardDescription>
                </CardHeader>
                <CardContent>
                    <FormProvider {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <InputField<LoginInput>
                                name="phoneNumber"
                                type="tel"
                                label="Phone number"
                                required
                                autoComplete="tel"
                            />
                            <InputField<LoginInput>
                                name="passcode"
                                type="password"
                                label="Passcode"
                                required
                                autoComplete="current-password"
                            />
                            <Button type="submit" className="w-full" disabled={isPending}>
                                {isPending ? "Signing in…" : "Sign in"}
                            </Button>
                        </form>
                    </FormProvider>
                </CardContent>
            </Card>
        </div>
    );
}

export default LoginForm;
