from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth, users, products, materials, bom, suppliers, material_lots,
    production_orders, consumption, machines, process_steps, inspection_plans,
    inspection_results, defects, containments, capa, traceability,
    exceptions, analytics, data_generator, validation, dashboard
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(products.router, prefix="/products", tags=["Products"])
api_router.include_router(materials.router, prefix="/materials", tags=["Materials"])
api_router.include_router(bom.router, prefix="/bom", tags=["Bill of Materials"])
api_router.include_router(suppliers.router, prefix="/suppliers", tags=["Suppliers"])
api_router.include_router(material_lots.router, prefix="/material-lots", tags=["Material Lots"])
api_router.include_router(production_orders.router, prefix="/production-orders", tags=["Production Orders"])
api_router.include_router(consumption.router, prefix="/consumption", tags=["Material Consumption"])
api_router.include_router(machines.router, prefix="/machines", tags=["Machines"])
api_router.include_router(process_steps.router, prefix="/process-steps", tags=["Process Steps"])
api_router.include_router(inspection_plans.router, prefix="/inspection-plans", tags=["Inspection Plans"])
api_router.include_router(inspection_results.router, prefix="/inspection-results", tags=["Inspection Results"])
api_router.include_router(defects.router, prefix="/defects", tags=["Defects"])
api_router.include_router(containments.router, prefix="/containments", tags=["Containments"])
api_router.include_router(capa.router, prefix="/capa", tags=["CAPA"])
api_router.include_router(traceability.router, prefix="/traceability", tags=["Traceability"])
api_router.include_router(exceptions.router, prefix="/exceptions", tags=["Exceptions"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(data_generator.router, prefix="/data-generator", tags=["Data Generator"])
api_router.include_router(validation.router, prefix="/validation", tags=["Data Validation"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
