import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import queryClient from "@/lib/queryClient";
import { router } from "@/routes";

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
            <Toaster position="top-right" theme="system" duration={5000} visibleToasts={5} closeButton richColors />
            {/* Dev-only helper; hidden on phones where its button would cover the bottom navigation. */}
            {typeof window !== "undefined" && window.innerWidth >= 768 && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
    );
}

export default App;
