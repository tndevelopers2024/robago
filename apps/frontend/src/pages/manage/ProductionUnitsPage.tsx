// src/pages/manage/ProductionUnitsPage.tsx
import TaggedEntityManagePage from "@/components/domain/manage/TaggedEntityManagePage";
import { productionUnitQueries } from "@/hooks/queries/taggedEntityInstances";
import { createProductionUnitSchema } from "@robago/shared";

export default function ProductionUnitsPage() {
    return (
        <TaggedEntityManagePage
            resourceLabel="production unit"
            resourceLabelPlural="production units"
            schema={createProductionUnitSchema}
            queries={productionUnitQueries}
        />
    );
}
