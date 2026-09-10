// src/pages/manage/WarehousesPage.tsx
import TaggedEntityManagePage from "@/components/domain/manage/TaggedEntityManagePage";
import { warehouseQueries } from "@/hooks/queries/taggedEntityInstances";
import { createWarehouseSchema } from "@robago/shared";

export default function WarehousesPage() {
    return (
        <TaggedEntityManagePage
            resourceLabel="warehouse"
            resourceLabelPlural="warehouses"
            schema={createWarehouseSchema}
            queries={warehouseQueries}
        />
    );
}
