// src/hooks/queries/useUsersQueries.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as usersApi from "@/api/users";
import { queryKeys } from "@/lib/queryKeys";
import { getErrorMessage } from "@/lib/errors";
import type { CreateUserInput, UpdateUserInput } from "@robago/shared";

export function useUsersQuery() {
    return useQuery({
        queryKey: queryKeys.users.all(),
        queryFn: () => usersApi.getUsers(),
    });
}

export function useCreateUserMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: CreateUserInput) => usersApi.createUser(input),
        // robago-prd.md §8: "User with this phone number already exists!" is a
        // field-level (phoneNumber) error — callers should read getFieldErrors(error)
        // from @/lib/errors and set it on the RHF field via form.setError, not just toast.
        onError: (err) => toast.error(getErrorMessage(err, "Failed to create user.")),
        onSuccess: () => toast.success("User created."),
        onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.all() }),
    });
}

export function useUpdateUserMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ phoneNumber, input }: { phoneNumber: string; input: UpdateUserInput }) =>
            usersApi.updateUser(phoneNumber, input),
        onError: (err) => toast.error(getErrorMessage(err, "Failed to update user.")),
        onSuccess: () => toast.success("User updated."),
        onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.all() }),
    });
}

export function useDeleteUserMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (phoneNumber: string) => usersApi.deleteUser(phoneNumber),
        onError: (err) => toast.error(getErrorMessage(err, "Failed to delete user.")),
        onSuccess: () => toast.success("User deleted."),
        onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.all() }),
    });
}
