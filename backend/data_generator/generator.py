"""
Manufacturing Defect Traceability System - Synthetic Data Generator
Fixed seed: 20261022
Generates deterministic, reproducible synthetic manufacturing data.
"""
import os
import json
import csv
import random
import numpy as np
from faker import Faker
from datetime import date, datetime, timedelta
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

SEED = 20261022


class DataGenerator:
    def __init__(self, db_url: str, seed: int = SEED):
        self.seed = seed
        random.seed(seed)
        np.random.seed(seed)
        self.fake = Faker()
        Faker.seed(seed)

        if db_url.startswith("sqlite"):
            self.engine = create_engine(db_url, connect_args={"check_same_thread": False})
        else:
            self.engine = create_engine(db_url)
        self.Session = sessionmaker(bind=self.engine)
        self.db = self.Session()

        # Track created IDs for referential integrity
        self.product_ids = []
        self.material_ids = []
        self.supplier_ids = []
        self.lot_ids = []
        self.order_ids = []
        self.machine_ids = []
        self.step_ids = []
        self.plan_ids = []
        self.inspection_ids = []
        self.defect_ids = []
        self.capa_ids = []

    def generate(self, config: dict):
        """Main generation entry point."""
        n_products = config.get("n_products", 200)
        n_suppliers = config.get("n_suppliers", 50)
        n_lots = config.get("n_lots", 2000)
        n_orders = config.get("n_orders", 5000)
        n_inspections = config.get("n_inspections", 20000)
        include_anomalies = config.get("include_anomalies", True)

        logger.info(f"Starting data generation with seed {self.seed}")
        logger.info(f"Config: {config}")

        try:
            if config.get("clean_first", False):
                self._clean_data()

            self._generate_materials(n_products // 2)
            self._generate_products(n_products)
            self._generate_bom_components()
            self._generate_suppliers(n_suppliers)
            self._generate_machines(30)
            self._generate_process_steps()
            self._generate_inspection_plans()
            self._generate_lots(n_lots)
            self._generate_production_orders(n_orders)
            self._generate_consumptions()
            self._generate_step_executions()
            self._generate_inspection_results(n_inspections)
            self._generate_defects()
            self._generate_containments()
            self._generate_capas()

            if include_anomalies:
                self._inject_anomalies()

            self.db.commit()
            logger.info("Data generation completed successfully")

        except Exception as e:
            self.db.rollback()
            logger.error(f"Generation failed: {e}")
            raise
        finally:
            self.db.close()

    def _clean_data(self):
        """Clean all operational and generated data while preserving users and roles."""
        from app.models.capa import CAPAVerification, CorrectiveAction
        from app.models.defect import DefectContainment, Defect
        from app.models.inspection import InspectionResult, InspectionPlan
        from app.models.process import ProductionStepExecution, ProcessStep
        from app.models.consumption import MaterialConsumption
        from app.models.production import ProductionOutput, ProductionOrder
        from app.models.material_lot import MaterialTransaction, MaterialLot
        from app.models.bom import BOMComponent
        from app.models.exception import ExceptionRecord
        from app.models.audit import EntityEventHistory, AuditLog
        from app.models.machine import Machine
        from app.models.supplier import Supplier
        from app.models.product import Product, Material

        tables = [
            CAPAVerification, CorrectiveAction, DefectContainment, Defect,
            InspectionResult, InspectionPlan, ProductionStepExecution, ProcessStep,
            MaterialConsumption, ProductionOutput, ProductionOrder,
            MaterialTransaction, MaterialLot, BOMComponent, ExceptionRecord,
            EntityEventHistory, AuditLog, Machine, Supplier, Material, Product
        ]

        logger.info("Cleaning existing operational data before generation...")
        for table in tables:
            try:
                self.db.query(table).delete()
            except Exception as e:
                logger.warning(f"Error clearing {table.__name__}: {e}")
        self.db.flush()

        # Reset tracked IDs
        self.product_ids = []
        self.material_ids = []
        self.supplier_ids = []
        self.lot_ids = []
        self.order_ids = []
        self.machine_ids = []
        self.step_ids = []
        self.plan_ids = []
        self.inspection_ids = []
        self.defect_ids = []
        self.capa_ids = []

    def _generate_materials(self, n: int):
        from app.models.product import Material, MaterialCategory, LifecycleStatus
        categories = list(MaterialCategory)
        units = ["KG", "LITRE", "METER", "PIECE", "GRAM", "ROLL"]

        material_names = [
            "Aluminum Sheet", "Copper Wire", "Steel Rod", "Polypropylene Resin",
            "Epoxy Resin", "Rubber Gasket", "Glass Fiber", "Silicon Wafer",
            "Titanium Plate", "Zinc Alloy", "Carbon Fiber", "Polyethylene Film",
            "Stainless Steel Tube", "Ceramic Insulator", "Neoprene Seal",
            "Brass Fitting", "Nickel Alloy", "PVC Compound", "Silicone Adhesive",
            "Thermal Grease", "Solder Wire", "Flux Paste", "Acetone Solvent",
            "Lubricant Oil", "Circuit Board Substrate", "Connector Pin", "LED Module",
            "Transformer Core", "Capacitor Film", "Resistor Element",
        ]

        for i in range(1, n + 1):
            name = material_names[(i - 1) % len(material_names)]
            if i > len(material_names):
                name = f"{name} Type-{i // len(material_names)}"
            mat = Material(
                material_id=f"MAT-{str(i).zfill(6)}",
                name=name,
                description=f"Industrial grade {name.lower()} for manufacturing use",
                category=random.choice(categories),
                unit_of_measurement=random.choice(units),
                lifecycle_status=LifecycleStatus.ACTIVE,
            )
            self.db.add(mat)
            self.material_ids.append(i)

        self.db.flush()
        logger.info(f"Generated {n} materials")

    def _generate_products(self, n: int):
        from app.models.product import Product, ProductCategory, LifecycleStatus
        categories = list(ProductCategory)
        units = ["UNIT", "SET", "ASSEMBLY", "PAIR"]

        product_names = [
            "Electric Motor", "Power Supply Unit", "Transformer Assembly",
            "Control Panel", "Circuit Breaker", "Relay Module",
            "Sensor Array", "Actuator Assembly", "Pump Unit", "Valve Assembly",
            "Battery Module", "Inverter Unit", "Generator Assembly", "Switch Gear",
            "Cable Harness", "Connector Assembly", "PCB Assembly", "Heat Exchanger",
            "Pressure Regulator", "Flow Controller",
        ]

        for i in range(1, n + 1):
            base_name = product_names[(i - 1) % len(product_names)]
            model_num = f"M{random.randint(100, 999)}"
            prod = Product(
                product_id=f"PROD-{str(i).zfill(6)}",
                name=f"{base_name} {model_num}",
                sku=f"SKU-{str(i).zfill(6)}",
                description=f"Industrial {base_name.lower()} for manufacturing applications",
                category=random.choice(categories),
                unit_of_measurement=random.choice(units),
                standard_production_time=round(random.uniform(0.5, 24.0), 1),
                lifecycle_status=LifecycleStatus.ACTIVE,
            )
            self.db.add(prod)
            self.product_ids.append(i)

        self.db.flush()
        logger.info(f"Generated {n} products")

    def _generate_bom_components(self):
        from app.models.bom import BOMComponent, BOMStatus
        from app.models.product import Product, Material

        products = self.db.query(Product).all()
        materials = self.db.query(Material).all()

        bom_counter = 1
        for product in products:
            n_components = random.randint(2, 6)
            selected_materials = random.sample(materials, min(n_components, len(materials)))
            for mat in selected_materials:
                effective_from = date(2025, 1, 1) + timedelta(days=random.randint(0, 180))
                bom = BOMComponent(
                    bom_id=f"BOM-{str(bom_counter).zfill(6)}",
                    product_id=product.id,
                    material_id=mat.id,
                    required_quantity=round(random.uniform(0.1, 50.0), 2),
                    unit=mat.unit_of_measurement,
                    revision="REV-1",
                    effective_from=effective_from,
                    bom_status=BOMStatus.ACTIVE,
                )
                self.db.add(bom)
                bom_counter += 1

        self.db.flush()
        logger.info(f"Generated {bom_counter - 1} BOM components")

    def _generate_suppliers(self, n: int):
        from app.models.supplier import Supplier, SupplierCategory, SupplierStatus

        countries = ["USA", "Germany", "China", "Japan", "South Korea", "India",
                     "UK", "France", "Italy", "Taiwan", "Mexico", "Brazil"]
        categories = list(SupplierCategory)

        for i in range(1, n + 1):
            country = random.choice(countries)
            # Quality rating skewed - most suppliers are good, some are poor
            quality_weights = [0.1, 0.1, 0.1, 0.2, 0.2, 0.1, 0.1, 0.05, 0.03, 0.02]
            quality_rating = round(
                np.random.choice(range(1, 11), p=quality_weights), 1
            )
            sup = Supplier(
                supplier_id=f"SUP-{str(i).zfill(6)}",
                name=f"{self.fake.company()} {random.choice(['Industries', 'Components', 'Materials', 'Supply Co.'])}",
                contact_name=self.fake.name(),
                email=self.fake.email(),
                phone=self.fake.phone_number()[:20],
                address=self.fake.address()[:200],
                country=country,
                category=random.choice(categories),
                quality_rating=quality_rating,
                lifecycle_status=SupplierStatus.ACTIVE,
            )
            self.db.add(sup)
            self.supplier_ids.append(i)

        self.db.flush()
        logger.info(f"Generated {n} suppliers")

    def _generate_machines(self, n: int):
        from app.models.machine import Machine, MachineStatus

        machine_types = [
            "CNC Machine", "Injection Molder", "Welding Station",
            "Assembly Robot", "Testing Bench", "Conveyor System",
            "Press Machine", "Lathe", "Drill Press", "Heat Treatment Oven"
        ]
        locations = ["Floor A", "Floor B", "Floor C", "Building 1", "Building 2"]

        for i in range(1, n + 1):
            mtype = machine_types[(i - 1) % len(machine_types)]
            inst_date = date(2020, 1, 1) + timedelta(days=random.randint(0, 1000))
            last_maint = inst_date + timedelta(days=random.randint(30, 365))
            mach = Machine(
                machine_id=f"MCH-{str(i).zfill(6)}",
                name=f"{mtype} {chr(65 + (i-1) % 26)}-{i}",
                machine_type=mtype,
                location=random.choice(locations),
                manufacturer=self.fake.company(),
                model_number=f"MODEL-{random.randint(1000, 9999)}",
                serial_number=f"SN{random.randint(100000, 999999)}",
                installation_date=inst_date,
                current_status=random.choices(
                    list(MachineStatus),
                    weights=[0.7, 0.1, 0.15, 0.03, 0.02]
                )[0],
                last_maintenance_date=last_maint,
                next_maintenance_date=last_maint + timedelta(days=90),
            )
            self.db.add(mach)
            self.machine_ids.append(i)

        self.db.flush()
        logger.info(f"Generated {n} machines")

    def _generate_process_steps(self):
        from app.models.process import ProcessStep, ProcessStepStatus

        step_templates = [
            ("Material Preparation", 1, (20, 25), (1.0, 1.5), (10, 50)),
            ("Component Cutting", 2, (18, 28), (2.0, 5.0), (100, 500)),
            ("Winding/Forming", 3, (20, 30), (1.5, 3.0), (50, 200)),
            ("Assembly", 4, (20, 26), (0.5, 2.0), (20, 100)),
            ("Welding/Bonding", 5, (150, 300), (5.0, 20.0), (200, 800)),
            ("Quality Testing", 6, (20, 25), (1.0, 2.0), (10, 30)),
            ("Final Inspection", 7, (20, 25), (1.0, 1.5), (10, 20)),
            ("Packaging", 8, (18, 25), (0.5, 1.0), (10, 50)),
        ]

        for i, (name, seq, temp_range, press_range, speed_range) in enumerate(step_templates, 1):
            step = ProcessStep(
                step_id=f"STP-{str(i).zfill(6)}",
                name=name,
                sequence_number=seq,
                description=f"Standard {name.lower()} process step",
                expected_temperature_min=temp_range[0],
                expected_temperature_max=temp_range[1],
                expected_pressure_min=press_range[0],
                expected_pressure_max=press_range[1],
                expected_speed_min=speed_range[0],
                expected_speed_max=speed_range[1],
                lifecycle_status=ProcessStepStatus.ACTIVE,
            )
            self.db.add(step)
            self.step_ids.append(i)

        self.db.flush()
        logger.info(f"Generated {len(step_templates)} process steps")

    def _generate_inspection_plans(self):
        from app.models.inspection import InspectionPlan, InspectionType, InspectionStage, PlanStatus
        from app.models.product import Product

        products = self.db.query(Product).all()
        plan_counter = 1

        for product in products[:100]:  # Create plans for first 100 products
            for insp_type in [InspectionType.INCOMING, InspectionType.FINAL]:
                stage = InspectionStage.RECEIVING if insp_type == InspectionType.INCOMING else InspectionStage.TESTING
                plan = InspectionPlan(
                    plan_id=f"PLAN-{str(plan_counter).zfill(6)}",
                    product_id=product.id,
                    inspection_type=insp_type,
                    inspection_stage=stage,
                    inspection_criteria=f"Standard {insp_type.value.lower()} inspection criteria",
                    min_value=round(random.uniform(0.5, 5.0), 2),
                    max_value=round(random.uniform(6.0, 15.0), 2),
                    unit="mm" if random.random() > 0.5 else "N/A",
                    effective_date=date(2025, 1, 1),
                    plan_status=PlanStatus.ACTIVE,
                )
                self.db.add(plan)
                self.plan_ids.append(plan_counter)
                plan_counter += 1

        self.db.flush()
        logger.info(f"Generated {plan_counter - 1} inspection plans")

    def _generate_lots(self, n: int):
        from app.models.material_lot import MaterialLot, MaterialTransaction, InspectionStatus, LotStatus, TransactionType
        from app.models.supplier import Supplier
        from app.models.product import Material

        suppliers = self.db.query(Supplier).all()
        materials = self.db.query(Material).all()

        if not suppliers or not materials:
            logger.warning("No suppliers or materials found, skipping lot generation")
            return

        lot_seq_by_supplier = {}
        for i in range(1, n + 1):
            supplier = random.choice(suppliers)
            material = random.choice(materials)

            sup_short = supplier.supplier_id.replace("SUP-", "")
            if sup_short not in lot_seq_by_supplier:
                lot_seq_by_supplier[sup_short] = 0
            lot_seq_by_supplier[sup_short] += 1

            lot_id = f"LOT-{sup_short}-2026-{str(lot_seq_by_supplier[sup_short]).zfill(6)}"
            received_qty = round(random.uniform(100, 5000), 2)
            received_date = date(2026, 1, 1) + timedelta(days=random.randint(0, 270))
            expiry_date = received_date + timedelta(days=random.randint(90, 730))

            insp_status = random.choices(
                list(InspectionStatus),
                weights=[0.05, 0.88, 0.05, 0.02]
            )[0]
            lot_status = LotStatus.AVAILABLE
            if insp_status == InspectionStatus.FAILED:
                lot_status = LotStatus.REJECTED

            lot = MaterialLot(
                lot_id=lot_id,
                supplier_id=supplier.id,
                material_id=material.id,
                received_quantity=received_qty,
                available_quantity=received_qty,
                unit=material.unit_of_measurement,
                received_date=received_date,
                expiry_date=expiry_date,
                incoming_inspection_status=insp_status,
                lot_status=lot_status,
            )
            self.db.add(lot)
            self.db.flush()

            # Receipt transaction
            txn = MaterialTransaction(
                lot_id=lot.id,
                transaction_type=TransactionType.RECEIPT,
                quantity=received_qty,
                notes="Initial receipt - generated",
            )
            self.db.add(txn)
            self.lot_ids.append(lot.id)

        self.db.flush()
        logger.info(f"Generated {n} material lots")

    def _generate_production_orders(self, n: int):
        from app.models.production import ProductionOrder, ProductionStatus, Priority
        from app.models.product import Product

        products = self.db.query(Product).all()
        if not products:
            return

        statuses = list(ProductionStatus)
        status_weights = [0.05, 0.1, 0.15, 0.05, 0.5, 0.05, 0.1]
        priorities = list(Priority)

        for i in range(1, n + 1):
            product = random.choice(products)
            start_date = date(2026, 1, 1) + timedelta(days=random.randint(0, 270))
            planned_qty = round(random.uniform(10, 1000), 0)
            status = random.choices(statuses, weights=status_weights)[0]
            actual_qty = 0
            scrap_qty = 0
            rework_qty = 0

            if status in [ProductionStatus.IN_PROGRESS, ProductionStatus.COMPLETED, ProductionStatus.CLOSED]:
                completion_pct = random.uniform(0.3, 1.0)
                actual_qty = round(planned_qty * completion_pct * random.uniform(0.95, 1.0))
                scrap_rate = random.uniform(0.01, 0.08)
                rework_rate = random.uniform(0.01, 0.05)
                scrap_qty = round(actual_qty * scrap_rate)
                rework_qty = round(actual_qty * rework_rate)

            end_date = start_date + timedelta(days=random.randint(1, 30))
            order = ProductionOrder(
                order_id=f"WO-2026-{str(i).zfill(6)}",
                product_id=product.id,
                bom_revision="REV-1",
                planned_quantity=planned_qty,
                actual_quantity=actual_qty,
                scrap_quantity=scrap_qty,
                rework_quantity=rework_qty,
                start_date=start_date,
                end_date=end_date,
                production_status=status,
                priority=random.choice(priorities),
                responsible_team=random.choice(["Team Alpha", "Team Beta", "Team Gamma", "Team Delta"]),
            )
            self.db.add(order)
            self.order_ids.append(order)

        self.db.flush()
        logger.info(f"Generated {n} production orders")

    def _generate_consumptions(self):
        from app.models.consumption import MaterialConsumption
        from app.models.production import ProductionOrder, ProductionStatus
        from app.models.material_lot import MaterialLot, LotStatus
        from app.models.bom import BOMComponent, BOMStatus

        orders = self.db.query(ProductionOrder).filter(
            ProductionOrder.production_status.in_([
                ProductionStatus.IN_PROGRESS,
                ProductionStatus.COMPLETED,
                ProductionStatus.CLOSED,
            ])
        ).all()

        available_lots = self.db.query(MaterialLot).filter(
            MaterialLot.lot_status.in_([
                LotStatus.AVAILABLE, LotStatus.PARTIALLY_CONSUMED
            ])
        ).all()

        if not available_lots:
            logger.warning("No available lots for consumption generation")
            return

        cons_counter = 1
        for order in orders:
            bom_comps = self.db.query(BOMComponent).filter(
                BOMComponent.product_id == order.product_id,
                BOMComponent.bom_status == BOMStatus.ACTIVE,
            ).all()

            for comp in bom_comps:
                # Find matching lots (by material)
                matching_lots = [l for l in available_lots
                                 if l.material_id == comp.material_id
                                 and l.available_quantity > 0]
                if not matching_lots:
                    matching_lots = random.sample(available_lots, min(2, len(available_lots)))

                lot = random.choice(matching_lots)
                required_qty = comp.required_quantity * min(order.actual_quantity, order.planned_quantity)
                consume_qty = min(required_qty, lot.available_quantity * 0.8)
                if consume_qty <= 0:
                    continue

                consume_qty = round(consume_qty, 3)
                cons_date = order.start_date or date(2026, 3, 1)

                cons = MaterialConsumption(
                    consumption_id=f"CON-MC-{str(cons_counter).zfill(6)}",
                    production_order_id=order.id,
                    lot_id=lot.id,
                    material_id=comp.material_id,
                    consumed_quantity=consume_qty,
                    unit=comp.unit,
                    consumption_date=cons_date,
                    recorded_by="System Generator",
                )
                self.db.add(cons)

                lot.available_quantity = max(lot.available_quantity - consume_qty, 0)
                if lot.available_quantity <= 0:
                    lot.lot_status = LotStatus.CONSUMED
                else:
                    lot.lot_status = LotStatus.PARTIALLY_CONSUMED

                cons_counter += 1

        self.db.flush()
        logger.info(f"Generated {cons_counter - 1} material consumptions")

    def _generate_step_executions(self):
        from app.models.process import ProductionStepExecution, ProcessStep, ExecutionStatus
        from app.models.production import ProductionOrder, ProductionStatus
        from app.models.machine import Machine, MachineStatus

        orders = self.db.query(ProductionOrder).filter(
            ProductionOrder.production_status.in_([
                ProductionStatus.IN_PROGRESS,
                ProductionStatus.COMPLETED,
                ProductionStatus.CLOSED,
            ])
        ).limit(500).all()

        steps = self.db.query(ProcessStep).all()
        machines = self.db.query(Machine).filter(
            Machine.current_status == MachineStatus.OPERATIONAL
        ).all()

        if not steps or not machines:
            return

        exec_counter = 1
        for order in orders:
            # Execute 3-5 steps per order
            n_steps = random.randint(3, min(5, len(steps)))
            selected_steps = sorted(
                random.sample(steps, n_steps),
                key=lambda s: s.sequence_number
            )

            start_dt = datetime.combine(order.start_date or date(2026, 3, 1), datetime.min.time())
            for step in selected_steps:
                machine = random.choice(machines)
                duration_hrs = random.uniform(0.5, 4.0)
                end_dt = start_dt + timedelta(hours=duration_hrs)

                # Generate parameters with occasional drift
                drift = random.random() < 0.05  # 5% drift rate
                temp = round(random.uniform(
                    step.expected_temperature_min * (1.15 if drift else 0.95),
                    step.expected_temperature_max * (1.15 if drift else 1.05)
                ), 1) if step.expected_temperature_min else None
                press = round(random.uniform(
                    step.expected_pressure_min * 0.95,
                    step.expected_pressure_max * 1.05
                ), 2) if step.expected_pressure_min else None
                speed = round(random.uniform(
                    step.expected_speed_min * 0.95,
                    step.expected_speed_max * 1.05
                ), 1) if step.expected_speed_min else None

                execution = ProductionStepExecution(
                    execution_id=f"EXE-{str(exec_counter).zfill(6)}",
                    production_order_id=order.id,
                    process_step_id=step.id,
                    machine_id=machine.id,
                    operator=self.fake.name(),
                    actual_start=start_dt,
                    actual_end=end_dt,
                    temperature=temp,
                    pressure=press,
                    speed=speed,
                    execution_status=ExecutionStatus.COMPLETED,
                    drift_detected=1 if drift else 0,
                )
                self.db.add(execution)
                start_dt = end_dt
                exec_counter += 1

        self.db.flush()
        logger.info(f"Generated {exec_counter - 1} process step executions")

    def _generate_inspection_results(self, n: int):
        from app.models.inspection import InspectionResult, InspectionPlan, InspectionResultStatus
        from app.models.production import ProductionOrder, ProductionStatus

        orders = self.db.query(ProductionOrder).filter(
            ProductionOrder.production_status.in_([
                ProductionStatus.IN_PROGRESS,
                ProductionStatus.COMPLETED,
                ProductionStatus.CLOSED,
            ])
        ).all()

        plans = self.db.query(InspectionPlan).all()
        if not orders or not plans:
            return

        insp_counter = 1
        target = min(n, len(orders) * 4)  # ~4 inspections per order

        for i in range(target):
            order = random.choice(orders)
            plan = random.choice(plans)

            inspected_qty = round(random.uniform(10, order.planned_quantity), 0)
            # Most pass, some fail
            fail_rate = random.uniform(0.01, 0.12)
            failed_qty = round(inspected_qty * fail_rate)
            passed_qty = inspected_qty - failed_qty

            if failed_qty > 0:
                status = InspectionResultStatus.FAILED
            else:
                status = InspectionResultStatus.PASSED

            order_short = order.order_id.replace("WO-", "").replace("-", "")
            seq_for_order = 1  # simplified
            insp_id = f"INSP-{order_short}-{str(insp_counter % 999 + 1).zfill(3)}"

            insp_date = datetime.combine(
                order.start_date + timedelta(days=random.randint(0, 10))
                if order.start_date else date(2026, 6, 1),
                datetime.min.time()
            )

            result = InspectionResult(
                inspection_id=insp_id,
                production_order_id=order.id,
                inspection_plan_id=plan.id,
                inspection_date=insp_date,
                quantity_inspected=inspected_qty,
                quantity_passed=passed_qty,
                quantity_failed=failed_qty,
                inspection_status=status,
                inspector=self.fake.name(),
                notes=f"Generated inspection record {insp_counter}",
            )
            self.db.add(result)
            self.inspection_ids.append(result)
            insp_counter += 1

        self.db.flush()
        logger.info(f"Generated {insp_counter - 1} inspection results")

    def _generate_defects(self):
        from app.models.defect import Defect, DefectCategory, Severity, DefectStatus
        from app.models.inspection import InspectionResult, InspectionResultStatus
        from app.models.material_lot import MaterialLot
        from app.models.machine import Machine

        failed_inspections = self.db.query(InspectionResult).filter(
            InspectionResult.inspection_status == InspectionResultStatus.FAILED
        ).limit(2000).all()

        lots = self.db.query(MaterialLot).all()
        machines = self.db.query(Machine).all()
        categories = list(DefectCategory)
        severities = list(Severity)
        severity_weights = [0.15, 0.35, 0.40, 0.10]

        defect_counter = 1
        for insp in failed_inspections:
            if random.random() > 0.7:  # not all failed inspections create defects
                continue

            order = insp.production_order
            lot = random.choice(lots) if lots and random.random() > 0.3 else None
            machine = random.choice(machines) if machines and random.random() > 0.4 else None

            defect_qty = round(random.uniform(1, insp.quantity_failed))

            defect = Defect(
                defect_id=f"DEF-2026-{str(defect_counter).zfill(6)}",
                inspection_id=insp.id,
                product_id=order.product_id if order else None,
                production_order_id=order.id if order else None,
                material_lot_id=lot.id if lot else None,
                machine_id=machine.id if machine else None,
                defect_category=random.choice(categories),
                description=random.choice([
                    "Dimensional out of tolerance",
                    "Surface scratch detected",
                    "Material contamination found",
                    "Assembly misalignment",
                    "Functional test failure",
                    "Coating defect",
                    "Welding crack",
                    "Wrong component installed",
                ]),
                defect_quantity=min(defect_qty, insp.quantity_failed),
                severity=random.choices(severities, weights=severity_weights)[0],
                detection_date=insp.inspection_date.date() if insp.inspection_date else date(2026, 6, 1),
                defect_status=random.choice([
                    DefectStatus.OPEN, DefectStatus.UNDER_INVESTIGATION,
                    DefectStatus.CONTAINED, DefectStatus.CLOSED
                ]),
                lot_link_confirmed=1 if lot and random.random() > 0.5 else 0,
                machine_link_confirmed=1 if machine and random.random() > 0.6 else 0,
            )
            self.db.add(defect)
            self.defect_ids.append(defect)
            defect_counter += 1

            if defect_counter > 3000:
                break

        self.db.flush()
        logger.info(f"Generated {defect_counter - 1} defects")

    def _generate_containments(self):
        from app.models.defect import Defect, DefectContainment, ContainmentStatus, DefectStatus

        defects_needing_containment = self.db.query(Defect).filter(
            Defect.defect_status.in_([DefectStatus.CONTAINED, DefectStatus.CLOSED])
        ).limit(500).all()

        cont_counter = 1
        decisions = ["HOLD", "QUARANTINE", "REWORK", "SCRAP", "RELEASE"]

        for defect in defects_needing_containment:
            containment = DefectContainment(
                containment_id=f"CON-{str(cont_counter).zfill(6)}",
                defect_id=defect.id,
                action_description=random.choice([
                    "Quarantined affected batch pending investigation",
                    "Placed affected units on hold",
                    "Initiated 100% reinspection of affected units",
                    "Reworked defective units",
                    "Scrapped nonconforming units",
                ]),
                affected_quantity=defect.defect_quantity * random.uniform(1.0, 2.0),
                quarantined_quantity=defect.defect_quantity,
                responsible_person=self.fake.name(),
                start_date=defect.detection_date,
                completion_date=defect.detection_date + timedelta(days=random.randint(1, 14)),
                containment_status=ContainmentStatus.COMPLETED,
                decision=random.choice(decisions),
            )
            self.db.add(containment)
            cont_counter += 1

        self.db.flush()
        logger.info(f"Generated {cont_counter - 1} containments")

    def _generate_capas(self):
        from app.models.capa import CorrectiveAction, CAPAVerification, CAPAStatus, CAPAPriority, VerificationStatus
        from app.models.defect import Defect, DefectStatus

        critical_defects = self.db.query(Defect).filter(
            Defect.severity.in_(["CRITICAL", "MAJOR"]),
            Defect.defect_status.in_([DefectStatus.CONTAINED, DefectStatus.CLOSED,
                                      DefectStatus.CAPA_INITIATED])
        ).limit(300).all()

        capa_counter = 1
        for defect in critical_defects:
            if random.random() > 0.6:
                continue

            created = defect.detection_date + timedelta(days=random.randint(1, 5))
            target = created + timedelta(days=random.randint(14, 60))
            status = random.choice([
                CAPAStatus.OPEN, CAPAStatus.IN_PROGRESS,
                CAPAStatus.PENDING_VERIFICATION, CAPAStatus.VERIFIED, CAPAStatus.CLOSED
            ])
            verif_status = VerificationStatus.PENDING
            completion = None

            if status in [CAPAStatus.VERIFIED, CAPAStatus.CLOSED]:
                verif_status = VerificationStatus.PASSED
                completion = target - timedelta(days=random.randint(0, 5))

            capa = CorrectiveAction(
                capa_id=f"CAPA-2026-{str(capa_counter).zfill(6)}",
                defect_id=defect.id,
                root_cause=random.choice([
                    "Process parameter drift",
                    "Incoming material nonconformance",
                    "Machine maintenance overdue",
                    "Operator training gap",
                    "Inspection plan inadequate",
                    "Supplier quality issue",
                ]),
                corrective_action=random.choice([
                    "Updated SOP and retrained operators",
                    "Implemented 100% incoming inspection",
                    "Performed machine calibration",
                    "Increased process monitoring frequency",
                    "Updated inspection plan criteria",
                    "Issued supplier corrective action request",
                ]),
                preventive_action="Reviewed all similar processes and applied same controls",
                assigned_engineer=self.fake.name(),
                priority=random.choice(list(CAPAPriority)),
                created_date=created,
                target_date=target,
                completion_date=completion,
                verification_status=verif_status,
                capa_status=status,
            )
            self.db.add(capa)
            self.db.flush()

            # Add verification record for verified/closed CAPAs
            if verif_status == VerificationStatus.PASSED:
                verif = CAPAVerification(
                    capa_id=capa.id,
                    verified_by=self.fake.name(),
                    verification_date=completion + timedelta(days=3) if completion else target,
                    verification_status=VerificationStatus.PASSED,
                    evidence="Process audit completed. No recurrence observed over 30-day monitoring period.",
                    notes="Verification passed. CAPA effective.",
                )
                self.db.add(verif)

            self.capa_ids.append(capa)
            capa_counter += 1

        self.db.flush()
        logger.info(f"Generated {capa_counter - 1} CAPAs")

    def _inject_anomalies(self):
        """Inject 5 deliberately labelled anomalies for testing."""
        from app.models.exception import ExceptionRecord, ExceptionType, ExceptionSeverity, ExceptionResolutionStatus
        from app.models.defect import Defect
        from app.models.capa import CorrectiveAction, CAPAStatus, VerificationStatus
        from app.models.inspection import InspectionResult

        logger.info("Injecting 5 deliberate anomalies...")

        # ANOMALY 1: Defect linked to nonexistent material lot
        defects = self.db.query(Defect).limit(5).all()
        if defects:
            victim_defect = defects[0]
            fake_lot_id = 999999  # Nonexistent
            old_lot_id = victim_defect.material_lot_id
            victim_defect.material_lot_id = fake_lot_id

            exc1 = ExceptionRecord(
                exception_id="EXC-ANOMALY-001",
                exception_type=ExceptionType.NONEXISTENT_LOT,
                related_entity="Defect",
                related_record_id=victim_defect.defect_id,
                description=f"INJECTED ANOMALY: Defect {victim_defect.defect_id} linked to nonexistent lot ID {fake_lot_id}",
                severity=ExceptionSeverity.CRITICAL,
                expected_behavior="Defect should reference a valid material lot",
                actual_result=f"References lot_id={fake_lot_id} which does not exist",
                resolution_status=ExceptionResolutionStatus.OPEN,
                is_injected_anomaly=1,
            )
            self.db.add(exc1)

        # ANOMALY 2: CAPA closed before verification
        if self.capa_ids:
            victim_capa = self.capa_ids[0]
            victim_capa.capa_status = CAPAStatus.CLOSED
            victim_capa.verification_status = VerificationStatus.PENDING  # Not verified!
            victim_capa.completion_date = date(2026, 8, 1)

            exc2 = ExceptionRecord(
                exception_id="EXC-ANOMALY-002",
                exception_type=ExceptionType.CAPA_CLOSED_BEFORE_VERIFICATION,
                related_entity="CorrectiveAction",
                related_record_id=victim_capa.capa_id,
                description=f"INJECTED ANOMALY: CAPA {victim_capa.capa_id} marked CLOSED with verification_status=PENDING",
                severity=ExceptionSeverity.CRITICAL,
                expected_behavior="CAPA must be VERIFIED before CLOSED",
                actual_result="CAPA closed with PENDING verification",
                resolution_status=ExceptionResolutionStatus.OPEN,
                is_injected_anomaly=1,
            )
            self.db.add(exc2)

        # ANOMALY 3: Defect count exceeds inspected quantity
        inspections = self.db.query(InspectionResult).filter(
            InspectionResult.quantity_failed > 0
        ).limit(5).all()
        if inspections:
            victim_insp = inspections[0]
            if self.defect_ids:
                victim_defect_2 = random.choice(self.defect_ids)
                old_qty = victim_defect_2.defect_quantity
                victim_defect_2.defect_quantity = victim_insp.quantity_failed * 10  # Exceed!
                victim_defect_2.inspection_id = victim_insp.id

                exc3 = ExceptionRecord(
                    exception_id="EXC-ANOMALY-003",
                    exception_type=ExceptionType.DEFECT_COUNT_EXCEEDS_INSPECTED,
                    related_entity="Defect",
                    related_record_id=victim_defect_2.defect_id,
                    description=f"INJECTED ANOMALY: Defect quantity ({victim_defect_2.defect_quantity}) exceeds inspection failed quantity ({victim_insp.quantity_failed})",
                    severity=ExceptionSeverity.CRITICAL,
                    expected_behavior="Defect quantity must not exceed failed inspection quantity",
                    actual_result=f"Defect qty={victim_defect_2.defect_quantity} > failed qty={victim_insp.quantity_failed}",
                    resolution_status=ExceptionResolutionStatus.OPEN,
                    is_injected_anomaly=1,
                )
                self.db.add(exc3)

        # ANOMALY 4: BOM material not consumed for a completed order
        from app.models.production import ProductionOrder, ProductionStatus
        completed_orders = self.db.query(ProductionOrder).filter(
            ProductionOrder.production_status == ProductionStatus.COMPLETED
        ).limit(5).all()
        if completed_orders:
            victim_order = completed_orders[0]
            # Delete consumptions for this order (simulate missing consumption)
            from app.models.consumption import MaterialConsumption
            self.db.query(MaterialConsumption).filter(
                MaterialConsumption.production_order_id == victim_order.id
            ).delete()

            exc4 = ExceptionRecord(
                exception_id="EXC-ANOMALY-004",
                exception_type=ExceptionType.BOM_MATERIAL_NOT_CONSUMED,
                related_entity="ProductionOrder",
                related_record_id=victim_order.order_id,
                description=f"INJECTED ANOMALY: Completed order {victim_order.order_id} has no material consumption records",
                severity=ExceptionSeverity.HIGH,
                expected_behavior="Completed orders must have material consumption records matching BOM",
                actual_result="Zero material consumption records found for completed order",
                resolution_status=ExceptionResolutionStatus.OPEN,
                is_injected_anomaly=1,
            )
            self.db.add(exc4)

        # ANOMALY 5: Broken traceability chain
        if self.defect_ids:
            victim_defect_3 = self.defect_ids[-1]
            old_order_id = victim_defect_3.production_order_id
            old_lot_id = victim_defect_3.material_lot_id
            old_insp_id = victim_defect_3.inspection_id

            victim_defect_3.production_order_id = None
            victim_defect_3.material_lot_id = None
            victim_defect_3.inspection_id = None

            exc5 = ExceptionRecord(
                exception_id="EXC-ANOMALY-005",
                exception_type=ExceptionType.BROKEN_TRACEABILITY_CHAIN,
                related_entity="Defect",
                related_record_id=victim_defect_3.defect_id,
                description=f"INJECTED ANOMALY: Defect {victim_defect_3.defect_id} has broken traceability (no order, lot, or inspection links)",
                severity=ExceptionSeverity.HIGH,
                expected_behavior="Defects must be traceable to inspection, production order, and material lot",
                actual_result="All traceability links removed: production_order_id=NULL, material_lot_id=NULL, inspection_id=NULL",
                resolution_status=ExceptionResolutionStatus.OPEN,
                is_injected_anomaly=1,
            )
            self.db.add(exc5)

        self.db.flush()
        logger.info("5 anomalies injected successfully")

        # Generate ground truth files
        self._write_ground_truth()

    def _write_ground_truth(self):
        """Write ground truth files for anomaly validation."""
        import json
        import csv
        import os

        ground_truth = [
            {
                "anomaly_id": "EXC-ANOMALY-001",
                "anomaly_type": "NONEXISTENT_LOT",
                "expected_detection": True,
                "entity": "Defect",
                "description": "Defect references a nonexistent material lot ID",
            },
            {
                "anomaly_id": "EXC-ANOMALY-002",
                "anomaly_type": "CAPA_CLOSED_BEFORE_VERIFICATION",
                "expected_detection": True,
                "entity": "CorrectiveAction",
                "description": "CAPA closed with PENDING verification status",
            },
            {
                "anomaly_id": "EXC-ANOMALY-003",
                "anomaly_type": "DEFECT_COUNT_EXCEEDS_INSPECTED",
                "expected_detection": True,
                "entity": "Defect",
                "description": "Defect quantity exceeds inspection failed quantity",
            },
            {
                "anomaly_id": "EXC-ANOMALY-004",
                "anomaly_type": "BOM_MATERIAL_NOT_CONSUMED",
                "expected_detection": True,
                "entity": "ProductionOrder",
                "description": "Completed production order with no material consumption records",
            },
            {
                "anomaly_id": "EXC-ANOMALY-005",
                "anomaly_type": "BROKEN_TRACEABILITY_CHAIN",
                "expected_detection": True,
                "entity": "Defect",
                "description": "Defect with all traceability links removed",
            },
        ]

        output_dir = os.path.join(os.path.dirname(__file__), "..", "..", "docs")
        os.makedirs(output_dir, exist_ok=True)

        # Write JSON
        with open(os.path.join(output_dir, "ground_truth.json"), "w") as f:
            json.dump({"seed": SEED, "anomalies": ground_truth}, f, indent=2)

        # Write CSV
        with open(os.path.join(output_dir, "ground_truth.csv"), "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=ground_truth[0].keys())
            writer.writeheader()
            writer.writerows(ground_truth)

        logger.info("Ground truth files written to docs/")


if __name__ == "__main__":
    import argparse
    import sys

    # Add parent directory to sys.path so app imports work when executed directly
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

    parser = argparse.ArgumentParser(description="Deterministic Synthetic Data Generator for TRACE-Q")
    parser.add_argument("--seed", type=int, default=20261022, help="Seed value for reproducibility")
    parser.add_argument("--scale", choices=["small", "medium", "full"], default="small", help="Data scale preset")
    parser.add_argument("--clean", action="store_true", help="Clean existing generated data first")
    parser.add_argument("--no-anomalies", action="store_true", help="Skip anomaly injection")
    parser.add_argument("--db-url", type=str, default=None, help="Database connection URL")

    args = parser.parse_args()

    presets = {
        "small": {"n_products": 20, "n_suppliers": 10, "n_lots": 100, "n_orders": 150, "n_inspections": 300},
        "medium": {"n_products": 50, "n_suppliers": 25, "n_lots": 500, "n_orders": 1000, "n_inspections": 3000},
        "full": {"n_products": 200, "n_suppliers": 50, "n_lots": 2000, "n_orders": 5000, "n_inspections": 20000},
    }

    config = presets[args.scale]
    config["seed"] = args.seed
    config["clean_first"] = args.clean
    config["include_anomalies"] = not args.no_anomalies

    from app.core.config import settings
    db_url = args.db_url or settings.DATABASE_URL

    print(f"Generating data with scale '{args.scale}' (seed={args.seed}, clean={args.clean})...")
    gen = DataGenerator(db_url=db_url, seed=args.seed)
    gen.generate(config)
    print("Done! Deterministic synthetic data generated successfully.")
