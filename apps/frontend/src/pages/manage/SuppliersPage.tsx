// src/pages/manage/SuppliersPage.tsx
import TaggedEntityManagePage from "@/components/domain/manage/TaggedEntityManagePage";
import { supplierQueries } from "@/hooks/queries/taggedEntityInstances";
import { createSupplierSchema } from "@robago/shared";

export default function SuppliersPage() {
    return (
        <TaggedEntityManagePage
            resourceLabel="supplier"
            resourceLabelPlural="suppliers"
            schema={createSupplierSchema}
            queries={supplierQueries}
        />
    );
}
