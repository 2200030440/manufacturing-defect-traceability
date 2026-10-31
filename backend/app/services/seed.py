"""Seed initial data: roles, admin user, and sample master data."""
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

ROLES = [
    {"name": "admin", "description": "OT/IT Administrator - full access"},
    {"name": "quality_engineer", "description": "Quality Engineer - defects, CAPA, inspections"},
    {"name": "production_planner", "description": "Production Planner - orders, materials, scheduling"},
    {"name": "plant_operator", "description": "Plant Operator - process execution, consumption"},
]

DEMO_USERS = [
    {
        "email": settings.FIRST_ADMIN_EMAIL,
        "full_name": "System Administrator",
        "password": settings.FIRST_ADMIN_PASSWORD,
        "department": "IT",
        "roles": ["admin"],
    },
    {
        "email": "quality@manufacturing.com",
        "full_name": "Quality Engineer",
        "password": "Quality@123456",
        "department": "Quality",
        "roles": ["quality_engineer"],
    },
    {
        "email": "planner@manufacturing.com",
        "full_name": "Production Planner",
        "password": "Planner@123456",
        "department": "Production Planning",
        "roles": ["production_planner"],
    },
    {
        "email": "operator@manufacturing.com",
        "full_name": "Plant Operator",
        "password": "Operator@123456",
        "department": "Manufacturing",
        "roles": ["plant_operator"],
    },
]


def seed_initial_data():
    db: Session = SessionLocal()
    try:
        from app.models.user import User, Role

        # Create roles if they don't exist
        role_objs = {}
        for role_data in ROLES:
            role = db.query(Role).filter(Role.name == role_data["name"]).first()
            if not role:
                role = Role(**role_data)
                db.add(role)
                db.flush()
                logger.info(f"Created role: {role_data['name']}")
            role_objs[role_data["name"]] = role

        db.commit()

        # Create demo users
        for user_data in DEMO_USERS:
            user = db.query(User).filter(User.email == user_data["email"]).first()
            if not user:
                roles = [role_objs[r] for r in user_data["roles"] if r in role_objs]
                user = User(
                    email=user_data["email"],
                    full_name=user_data["full_name"],
                    hashed_password=get_password_hash(user_data["password"]),
                    department=user_data["department"],
                    roles=roles,
                )
                db.add(user)
                logger.info(f"Created user: {user_data['email']}")

        db.commit()
        logger.info("User and role seed completed successfully")

        # Auto-seed operational manufacturing dataset on first boot
        from app.models.product import Product
        if db.query(Product).count() == 0:
            logger.info("Fresh database detected; automatically seeding initial manufacturing dataset...")
            from data_generator.generator import DataGenerator
            gen = DataGenerator(db_url=settings.DATABASE_URL, seed=20261022)
            gen.generate({
                "seed": 20261022,
                "n_products": 20,
                "n_suppliers": 10,
                "n_lots": 100,
                "n_orders": 150,
                "n_inspections": 300,
                "include_anomalies": True,
                "clean_first": False,
            })
            logger.info("Operational manufacturing dataset seeded successfully!")

        logger.info("Initial data startup complete")
    except Exception as e:
        db.rollback()
        logger.error(f"Seed data error: {e}")
    finally:
        db.close()
