// src/components/domain/manage/UserForm.tsx
import { useForm, FormProvider, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    createUserSchema,
    updateUserSchema,
    ROLE_LABEL,
    UserRole,
    type CreateUserInput,
    type UpdateUserInput,
} from "@robago/shared";
import InputField from "@/components/InputField";
import SelectField from "@/components/SelectField";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { getFieldErrors } from "@/lib/errors";
import type { UserDTO } from "@/types";

interface UserFormProps {
    initial?: UserDTO;
    onSubmit: (values: CreateUserInput | UpdateUserInput) => Promise<unknown>;
    onCancel: () => void;
}

// createUserSchema's `role` has a `.default()`, making it optional pre-parse — same
// input/output distinction explained in CategoryForm.tsx. Fixed shape covering both the
// create and edit cases (edit just never touches phoneNumber and treats passcode as
// optional at the call-site, not the schema).
interface UserFormValues {
    phoneNumber: string;
    name: string;
    role?: UserRole;
    passcode: string;
}

export function UserForm({ initial, onSubmit, onCancel }: UserFormProps) {
    const isEdit = Boolean(initial);
    const form = useForm<UserFormValues>({
        // Both schemas share the same field set; update just makes passcode optional —
        // safe to resolve against createUserSchema client-side either way since the
        // fields being edited (name/role/passcode) are shape-compatible. See the
        // TaggedEntityManagePage.tsx comment for why this cast is safe here too.
        resolver: (isEdit ? zodResolver(updateUserSchema) : zodResolver(createUserSchema)) as unknown as Resolver<UserFormValues>,
        defaultValues: {
            phoneNumber: initial?.phoneNumber ?? "",
            name: initial?.name ?? "",
            role: initial?.role ?? UserRole.Manager,
            passcode: "",
        },
    });

    async function handleSubmit(values: UserFormValues) {
        try {
            if (isEdit) {
                const { name, role, passcode } = values;
                const update: UpdateUserInput = { name, role };
                if (passcode) update.passcode = passcode;
                await onSubmit(update);
            } else {
                await onSubmit(values as CreateUserInput);
            }
        } catch (err) {
            // robago-prd.md §8: "User with this phone number already exists!" — surface
            // it on the phoneNumber field, not just as a toast (the mutation already toasts).
            const fieldErrors = getFieldErrors(err);
            if (fieldErrors?.phoneNumber) {
                form.setError("phoneNumber", { message: fieldErrors.phoneNumber });
            }
        }
    }

    return (
        <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <InputField<UserFormValues>
                    name="phoneNumber"
                    type="tel"
                    label="Phone number"
                    required
                    disabled={isEdit} // phoneNumber is the collection's key — see robago-prd.md §5 user.schema.ts note
                />
                <InputField<UserFormValues> name="name" type="text" label="Name" required />
                <SelectField<UserFormValues>
                    name="role"
                    label="Role"
                    required
                    options={[
                        { value: UserRole.Manager, label: `${ROLE_LABEL.manager} — inventory only` },
                        { value: UserRole.SuperAdmin, label: `${ROLE_LABEL.superadmin} — full access` },
                    ]}
                />
                <InputField<UserFormValues>
                    name="passcode"
                    type="password"
                    label={isEdit ? "New passcode (leave blank to keep current)" : "Passcode"}
                    required={!isEdit}
                />
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        {isEdit ? "Save changes" : "Create user"}
                    </Button>
                </DialogFooter>
            </form>
        </FormProvider>
    );
}

export default UserForm;
